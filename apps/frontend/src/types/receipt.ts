import { z } from 'zod'

export const ReceiptLineItemResponseSchema = z.object({
  id: z.uuid(),
  description: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  totalPrice: z.number(),
})

export type ReceiptLineItemResponse = z.infer<
  typeof ReceiptLineItemResponseSchema
>

export const ReceiptResponseSchema = z.object({
  id: z.uuid(),
  jobId: z.uuid(),
  merchantName: z.string().nullable(),
  receiptDate: z.string().nullable(),
  total: z.number(),
  tax: z.number().nullable(),
  currency: z.string().nullable(),
  blobUrl: z.string().nullable(),
  lineItems: z.array(ReceiptLineItemResponseSchema),
  createdAt: z.iso.datetime(),
})

export type ReceiptResponse = z.infer<typeof ReceiptResponseSchema>

export const PagedReceiptResponseSchema = z.object({
  items: z.array(ReceiptResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

export type PagedReceiptResponse = z.infer<typeof PagedReceiptResponseSchema>
