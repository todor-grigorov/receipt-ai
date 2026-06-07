import { z } from "zod";

export const ReceiptJobSchema = z.object({
  correlationId: z.string().uuid(),
  blobUrl: z.string().url(),
  userId: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
});

export type ReceiptJob = z.infer<typeof ReceiptJobSchema>;
