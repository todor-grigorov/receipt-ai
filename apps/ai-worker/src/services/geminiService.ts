import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";
import { ReceiptResult, ReceiptResultSchema } from "../models/receiptResult";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const PROMPT = `
You are a receipt parser. Analyze this receipt image or PDF and extract the following information.
Respond ONLY with a valid JSON object — no markdown, no backticks, no explanation.

Required JSON structure:
{
  "merchantName": "string",
  "receiptDate": "YYYY-MM-DD or null if not found",
  "total": number,
  "tax": number or null,
  "currency": "3-letter currency code or null",
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ]
}
`;

export async function parseReceipt(
  fileBuffer: Buffer,
  contentType: string,
): Promise<ReceiptResult> {
  const base64Data = fileBuffer.toString("base64");

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: contentType as
          | "image/jpeg"
          | "image/png"
          | "image/webp"
          | "application/pdf",
        data: base64Data,
      },
    },
    { text: PROMPT },
  ]);

  const rawResponse = result.response.text();

  // Strip markdown code blocks if Gemini wraps response despite instructions
  const cleaned = rawResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  const validated = ReceiptResultSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error(
      `Gemini response failed validation:\n${z.prettifyError(validated.error)}`,
    );
  }

  return {
    ...validated.data,
    rawLlmResponse: rawResponse,
  };
}
