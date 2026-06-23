import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EventGridEvent, InvocationContext } from "@azure/functions";

vi.mock("axios");
vi.mock("../../src/services/geminiService");
vi.mock("../../src/services/dbService");
vi.mock("../../src/services/notificationService");
vi.mock("../../src/config", () => ({
  config: {
    GEMINI_API_KEY: "test-key",
    DATABASE_URL: "postgresql://test",
    ASPNET_API_URL: "http://localhost:5000",
    ASPNET_API_KEY: "test-internal-key",
  },
}));
vi.mock("@azure/functions", () => ({
  app: { eventGrid: vi.fn() },
}));

import axios from "axios";
import { parseReceipt } from "../../src/services/geminiService";
import {
  logAuditEvent,
  saveReceiptResult,
  updateJobStatus,
} from "../../src/services/dbService";
import {
  notifyCompleted,
  notifyFailed,
  notifyProcessing,
} from "../../src/services/notificationService";
import {
  extractCorrelationId,
  extractJobData,
  processReceiptHandler,
} from "../../src/functions/processReceipt";

const TEST_CORRELATION_ID = "550e8400-e29b-41d4-a716-446655440000";

function createMockEvent(
  overrides: Partial<EventGridEvent> = {},
): EventGridEvent {
  return {
    id: "event-1",
    eventType: "Microsoft.Storage.BlobCreated",
    subject: `/blobServices/default/containers/receipts/blobs/user-123/${TEST_CORRELATION_ID}.jpg`,
    eventTime: "2026-06-20T10:00:00Z",
    dataVersion: "1.0",
    data: {
      url: `https://storage.blob.core.windows.net/receipts/user-123/${TEST_CORRELATION_ID}.jpg?sas=token`,
      contentType: "image/jpeg",
    },
    ...overrides,
  } as EventGridEvent;
}

function createMockContext(): InvocationContext {
  return {
    log: vi.fn(),
    error: vi.fn(),
  } as unknown as InvocationContext;
}

const sampleReceiptResult = {
  merchantName: "Coop",
  receiptDate: "2026-06-01",
  total: 10.5,
  tax: 0.8,
  currency: "CHF",
  lineItems: [],
  rawLlmResponse: "{}",
};

describe("extractCorrelationId", () => {
  it("should extract correlationId from a valid Event Grid subject", () => {
    const event = createMockEvent();

    expect(extractCorrelationId(event)).toBe(TEST_CORRELATION_ID);
  });

  it("should extract correlationId regardless of file extension", () => {
    const event = createMockEvent({
      subject: `/blobServices/default/containers/receipts/blobs/user-123/${TEST_CORRELATION_ID}.pdf`,
    });

    expect(extractCorrelationId(event)).toBe(TEST_CORRELATION_ID);
  });
});

describe("extractJobData", () => {
  it("should extract userId, correlationId, fileName, and contentType from a valid event", () => {
    const event = createMockEvent();

    const result = extractJobData(event) as Record<string, unknown>;

    expect(result.userId).toBe("user-123");
    expect(result.correlationId).toBe(TEST_CORRELATION_ID);
    expect(result.fileName).toBe(`${TEST_CORRELATION_ID}.jpg`);
    expect(result.blobUrl).toContain(`${TEST_CORRELATION_ID}.jpg`);
    expect(result.contentType).toBe("image/jpeg");
  });

  it("should infer contentType from extension when not provided by Event Grid", () => {
    const event = createMockEvent({
      data: {
        url: `https://storage.blob.core.windows.net/receipts/user-123/${TEST_CORRELATION_ID}.pdf`,
        contentType: "",
      },
    });

    const result = extractJobData(event) as Record<string, unknown>;

    expect(result.contentType).toBe("application/pdf");
  });

  it("should default to octet-stream when extension is unrecognized and no contentType provided", () => {
    const event = createMockEvent({
      data: {
        url: `https://storage.blob.core.windows.net/receipts/user-123/${TEST_CORRELATION_ID}.xyz`,
        contentType: "",
      },
    });

    const result = extractJobData(event) as Record<string, unknown>;

    expect(result.contentType).toBe("application/octet-stream");
  });
});

describe("processReceiptHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: Buffer.from("fake-image") });
    vi.mocked(parseReceipt).mockResolvedValue(sampleReceiptResult);
    vi.mocked(saveReceiptResult).mockResolvedValue("receipt-uuid-789");
  });

  it("should complete the full success path and notify completion", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(notifyProcessing).toHaveBeenCalledWith(TEST_CORRELATION_ID);
    expect(updateJobStatus).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "Processing",
    );
    expect(parseReceipt).toHaveBeenCalled();
    expect(saveReceiptResult).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "user-123",
      `${TEST_CORRELATION_ID}.jpg`,
      sampleReceiptResult,
    );
    expect(notifyCompleted).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "receipt-uuid-789",
    );
  });

  it("should log LlmRequestSent and LlmResponseReceived audit events around the Gemini call", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(logAuditEvent).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "LlmRequestSent",
      "azure-function",
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "LlmResponseReceived",
      "azure-function",
    );
  });

  it("should download the blob using the SAS URL with arraybuffer response type", async () => {
    const event = createMockEvent();
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining(`${TEST_CORRELATION_ID}.jpg`),
      { responseType: "arraybuffer" },
    );
  });

  it("should update status to Failed and notify failure when Gemini parsing throws", async () => {
    vi.mocked(parseReceipt).mockRejectedValue(new Error("Gemini timed out"));

    const event = createMockEvent();
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(updateJobStatus).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "Failed",
      "Gemini timed out",
    );
    expect(notifyFailed).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "Gemini timed out",
    );
    expect(notifyCompleted).not.toHaveBeenCalled();
  });

  it("should update status to Failed when blob download fails", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("Blob not found"));

    const event = createMockEvent();
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(updateJobStatus).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "Failed",
      "Blob not found",
    );
    expect(notifyFailed).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "Blob not found",
    );
  });

  it("should update status to Failed when saving the receipt to the database fails", async () => {
    vi.mocked(saveReceiptResult).mockRejectedValue(
      new Error("DB write failed"),
    );

    const event = createMockEvent();
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(updateJobStatus).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "Failed",
      "DB write failed",
    );
    expect(notifyFailed).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "DB write failed",
    );
  });

  it("should not throw when both the main flow and the failure notification fail", async () => {
    vi.mocked(parseReceipt).mockRejectedValue(new Error("Gemini timed out"));
    vi.mocked(notifyFailed).mockRejectedValue(
      new Error("ASP.NET API unreachable"),
    );

    const event = createMockEvent();
    const context = createMockContext();

    await expect(processReceiptHandler(event, context)).resolves.not.toThrow();

    expect(context.error).toHaveBeenCalledWith(
      "Failed to notify failure:",
      expect.any(Error),
    );
  });

  it("should use a generic error message when a non-Error value is thrown", async () => {
    vi.mocked(parseReceipt).mockRejectedValue("a plain string failure");

    const event = createMockEvent();
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(updateJobStatus).toHaveBeenCalledWith(
      TEST_CORRELATION_ID,
      "Failed",
      "Unknown error occurred",
    );
  });

  it("should fail validation and report it when extracted correlationId is not a valid UUID", async () => {
    const event = createMockEvent({
      subject:
        "/blobServices/default/containers/receipts/blobs/user-123/not-a-uuid.jpg",
      data: {
        url: "https://storage.blob.core.windows.net/receipts/user-123/not-a-uuid.jpg",
        contentType: "image/jpeg",
      },
    });
    const context = createMockContext();

    await processReceiptHandler(event, context);

    expect(updateJobStatus).toHaveBeenCalledWith(
      "not-a-uuid",
      "Failed",
      expect.stringContaining("Invalid event payload"),
    );
  });
});
