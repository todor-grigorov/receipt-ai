import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

vi.mock("../../src/config", () => ({
  config: {
    GEMINI_API_KEY: "test-api-key",
    DATABASE_URL: "postgresql://test",
    ASPNET_API_URL: "http://localhost:5000",
    ASPNET_API_KEY: "test-key",
  },
}));

import { parseReceipt } from "../../src/services/geminiService";

function mockGeminiResponse(text: string) {
  mockGenerateContent.mockResolvedValue({
    response: { text: () => text },
  });
}

const validReceiptJson = JSON.stringify({
  merchantName: "Coop",
  receiptDate: "2026-06-01",
  total: 10.5,
  tax: 0.8,
  currency: "CHF",
  lineItems: [
    { description: "Bread", quantity: 1, unitPrice: 3.5, totalPrice: 3.5 },
    { description: "Milk", quantity: 2, unitPrice: 3.5, totalPrice: 7.0 },
  ],
});

describe("parseReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return parsed receipt data when Gemini returns valid JSON", async () => {
    mockGeminiResponse(validReceiptJson);

    const result = await parseReceipt(Buffer.from("fake-image"), "image/jpeg");

    expect(result.merchantName).toBe("Coop");
    expect(result.total).toBe(10.5);
    expect(result.lineItems).toHaveLength(2);
    expect(result.rawLlmResponse).toBe(validReceiptJson);
  });

  it("should strip ```json markdown code blocks before parsing", async () => {
    mockGeminiResponse("```json\n" + validReceiptJson + "\n```");

    const result = await parseReceipt(Buffer.from("fake-image"), "image/jpeg");

    expect(result.merchantName).toBe("Coop");
  });

  it("should strip plain ``` code blocks before parsing", async () => {
    mockGeminiResponse("```\n" + validReceiptJson + "\n```");

    const result = await parseReceipt(Buffer.from("fake-image"), "image/jpeg");

    expect(result.merchantName).toBe("Coop");
  });

  it("should handle responses with leading/trailing whitespace", async () => {
    mockGeminiResponse("   \n" + validReceiptJson + "\n   ");

    const result = await parseReceipt(Buffer.from("fake-image"), "image/jpeg");

    expect(result.merchantName).toBe("Coop");
  });

  it("should throw an error when Gemini response is not valid JSON", async () => {
    mockGeminiResponse("this is not json at all");

    await expect(
      parseReceipt(Buffer.from("fake-image"), "image/jpeg"),
    ).rejects.toThrow();
  });

  it("should throw a descriptive error when schema validation fails", async () => {
    const invalidJson = JSON.stringify({
      merchantName: "Coop",
      // missing required fields: receiptDate, total, etc.
    });
    mockGeminiResponse(invalidJson);

    await expect(
      parseReceipt(Buffer.from("fake-image"), "image/jpeg"),
    ).rejects.toThrow("Gemini response failed validation");
  });

  it("should allow negative line item prices (discounts/refunds)", async () => {
    const receiptWithDiscount = JSON.stringify({
      merchantName: "Lidl",
      receiptDate: "2026-06-01",
      total: 5.5,
      tax: 0.2,
      currency: "CHF",
      lineItems: [
        { description: "Bread", quantity: 1, unitPrice: 6.0, totalPrice: 6.0 },
        {
          description: "Erstattung Parkgebü",
          quantity: 1,
          unitPrice: -0.5,
          totalPrice: -0.5,
        },
      ],
    });
    mockGeminiResponse(receiptWithDiscount);

    const result = await parseReceipt(Buffer.from("fake-image"), "image/jpeg");

    expect(result.lineItems[1].unitPrice).toBe(-0.5);
  });

  it("should allow null merchantName when Gemini cannot determine it", async () => {
    const receiptWithoutMerchant = JSON.stringify({
      merchantName: null,
      receiptDate: "2026-06-01",
      total: 10,
      tax: null,
      currency: "CHF",
      lineItems: [],
    });
    mockGeminiResponse(receiptWithoutMerchant);

    const result = await parseReceipt(Buffer.from("fake-image"), "image/jpeg");

    expect(result.merchantName).toBeNull();
  });

  it("should preserve the original raw response even after markdown stripping", async () => {
    const wrapped = "```json\n" + validReceiptJson + "\n```";
    mockGeminiResponse(wrapped);

    const result = await parseReceipt(Buffer.from("fake-image"), "image/jpeg");

    expect(result.rawLlmResponse).toBe(wrapped); // raw, not the cleaned version
  });

  it("should pass the correct base64-encoded image data and content type to Gemini", async () => {
    mockGeminiResponse(validReceiptJson);

    const buffer = Buffer.from("fake-image-bytes");
    await parseReceipt(buffer, "image/png");

    expect(mockGenerateContent).toHaveBeenCalledWith([
      {
        inlineData: {
          mimeType: "image/png",
          data: buffer.toString("base64"),
        },
      },
      expect.objectContaining({
        text: expect.stringContaining("receipt parser"),
      }),
    ]);
  });
});
