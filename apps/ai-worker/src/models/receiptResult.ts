import { z } from "zod";

export const ReceiptLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
});

export const ReceiptResultSchema = z.object({
  merchantName: z.string().min(1),
  receiptDate: z.string().nullable(),
  total: z.number().nonnegative(),
  tax: z.number().nonnegative().nullable(),
  currency: z.string().max(8).nullable(),
  lineItems: z.array(ReceiptLineItemSchema),
});

export type ReceiptLineItem = z.infer<typeof ReceiptLineItemSchema>;
export type ReceiptResult = z.infer<typeof ReceiptResultSchema>;
