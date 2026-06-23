import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQuery, mockConnect, mockClient } = vi.hoisted(() => {
  const mockQuery = vi.fn();
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  const mockConnect = vi.fn().mockResolvedValue(mockClient);
  return { mockQuery, mockConnect, mockClient };
});

vi.mock("pg", () => ({
  Pool: class {
    query = mockQuery;
    connect = mockConnect;
  },
}));

vi.mock("../../src/config", () => ({
  config: {
    GEMINI_API_KEY: "test-key",
    DATABASE_URL: "postgresql://test",
    ASPNET_API_URL: "http://localhost:5000",
    ASPNET_API_KEY: "test-key",
  },
}));

import {
  saveReceiptResult,
  updateJobStatus,
  logAuditEvent,
} from "../../src/services/dbService";
import { type ReceiptResult } from "../../src/models/receiptResult";

const sampleResult: ReceiptResult = {
  merchantName: "Coop",
  receiptDate: "2026-06-01",
  total: 10.5,
  tax: 0.8,
  currency: "CHF",
  lineItems: [
    { description: "Bread", quantity: 1, unitPrice: 3.5, totalPrice: 3.5 },
    { description: "Milk", quantity: 2, unitPrice: 3.5, totalPrice: 7.0 },
  ],
  rawLlmResponse: "{}",
};

describe("saveReceiptResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(mockClient);
  });

  it("should insert the receipt and all line items within a transaction", async () => {
    const receiptId = "receipt-uuid-123";

    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ Id: receiptId }] }) // INSERT Receipts
      .mockResolvedValueOnce(undefined) // INSERT ReceiptLineItems #1
      .mockResolvedValueOnce(undefined) // INSERT ReceiptLineItems #2
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await saveReceiptResult(
      "corr-123",
      "user-456",
      "receipt.jpg",
      sampleResult,
    );

    expect(result).toBe(receiptId);
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should insert one ReceiptLineItems row per line item", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ Id: "receipt-uuid-123" }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await saveReceiptResult(
      "corr-123",
      "user-456",
      "receipt.jpg",
      sampleResult,
    );

    const lineItemInserts = mockClient.query.mock.calls.filter(
      (call) =>
        typeof call[0] === "string" && call[0].includes("ReceiptLineItems"),
    );

    expect(lineItemInserts).toHaveLength(2);
  });

  it("should pass correlationId directly as the CorrelationId value, not via subquery", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ Id: "receipt-uuid-123" }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await saveReceiptResult(
      "corr-789",
      "user-456",
      "receipt.jpg",
      sampleResult,
    );

    const receiptInsertCall = mockClient.query.mock.calls.find(
      (call) =>
        typeof call[0] === "string" &&
        call[0].includes('INSERT INTO "Receipts"'),
    );

    expect(receiptInsertCall![1][0]).toBe("corr-789"); // first param is correlationId
  });

  it("should rollback and rethrow when the receipt insert fails", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error("DB error")) // INSERT Receipts fails
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await expect(
      saveReceiptResult("corr-123", "user-456", "receipt.jpg", sampleResult),
    ).rejects.toThrow("DB error");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should rollback and rethrow when a line item insert fails", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ Id: "receipt-uuid-123" }] })
      .mockRejectedValueOnce(new Error("Line item insert failed"))
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await expect(
      saveReceiptResult("corr-123", "user-456", "receipt.jpg", sampleResult),
    ).rejects.toThrow("Line item insert failed");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
  });

  it("should always release the client even when an error occurs", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("DB error"))
      .mockResolvedValueOnce(undefined);

    await expect(
      saveReceiptResult("corr-123", "user-456", "receipt.jpg", sampleResult),
    ).rejects.toThrow();

    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should handle receipts with no line items", async () => {
    const resultWithNoItems: ReceiptResult = { ...sampleResult, lineItems: [] };

    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ Id: "receipt-uuid-123" }] })
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await saveReceiptResult(
      "corr-123",
      "user-456",
      "receipt.jpg",
      resultWithNoItems,
    );

    expect(result).toBe("receipt-uuid-123");

    const lineItemInserts = mockClient.query.mock.calls.filter(
      (call) =>
        typeof call[0] === "string" && call[0].includes("ReceiptLineItems"),
    );
    expect(lineItemInserts).toHaveLength(0);
  });
});

describe("updateJobStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update job status with the provided values", async () => {
    await updateJobStatus("corr-123", "Completed");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "Jobs"'),
      ["Completed", null, "corr-123"],
    );
  });

  it("should include errorMessage when provided", async () => {
    await updateJobStatus("corr-123", "Failed", "Gemini timed out");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "Jobs"'),
      ["Failed", "Gemini timed out", "corr-123"],
    );
  });
});

describe("logAuditEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should insert an audit log with serialized payload", async () => {
    await logAuditEvent("corr-123", "LlmRequestSent", "azure-function", {
      model: "gemini-2.5-flash",
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "AuditLogs"'),
      [
        "corr-123",
        "LlmRequestSent",
        "azure-function",
        JSON.stringify({ model: "gemini-2.5-flash" }),
        true,
        null,
      ],
    );
  });

  it("should insert null payload when no payload is provided", async () => {
    await logAuditEvent("corr-123", "LlmResponseReceived", "azure-function");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "AuditLogs"'),
      ["corr-123", "LlmResponseReceived", "azure-function", null, true, null],
    );
  });

  it("should default isSuccess to true when not specified", async () => {
    await logAuditEvent("corr-123", "JobCompleted", "azure-function");

    const call = mockQuery.mock.calls[0];
    expect(call[1][4]).toBe(true);
  });

  it("should record isSuccess false and errorMessage when explicitly provided", async () => {
    await logAuditEvent(
      "corr-123",
      "JobFailed",
      "azure-function",
      undefined,
      false,
      "Timeout exceeded",
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "AuditLogs"'),
      [
        "corr-123",
        "JobFailed",
        "azure-function",
        null,
        false,
        "Timeout exceeded",
      ],
    );
  });
});
