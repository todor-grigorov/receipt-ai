import { z } from "zod";

export const ReceiptLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  totalPrice: z.number(),
});

export const ReceiptResultSchema = z.object({
  merchantName: z.string().nullable(),
  receiptDate: z.string().nullable(),
  total: z.number(),
  tax: z.number().nullable(),
  currency: z.string().max(8).nullable(),
  lineItems: z.array(ReceiptLineItemSchema),
});

export type ReceiptLineItem = z.infer<typeof ReceiptLineItemSchema>;
export type ReceiptResultBase = z.infer<typeof ReceiptResultSchema>;

export interface ReceiptResult extends ReceiptResultBase {
  rawLlmResponse: string;
}
