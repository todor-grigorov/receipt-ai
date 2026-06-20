import { z } from 'zod'

export enum AuditEventType {
  ReceiptUploaded = 'ReceiptUploaded',
  JobCreated = 'JobCreated',
  BlobStored = 'BlobStored',
  JobProcessingStarted = 'JobProcessingStarted',
  LlmRequestSent = 'LlmRequestSent',
  LlmResponseReceived = 'LlmResponseReceived',
  LlmParsingCompleted = 'LlmParsingCompleted',
  JobCompleted = 'JobCompleted',
  JobFailed = 'JobFailed',
  ResultRetrieved = 'ResultRetrieved',
}

export const AuditLogResponseSchema = z.object({
  id: z.uuid(),
  correlationId: z.uuid(),
  eventType: z.nativeEnum(AuditEventType),
  service: z.string(),
  actor: z.string().nullable(),
  payload: z.string().nullable(),
  isSuccess: z.boolean(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
})

export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>

export const AuditTrailSchema = z.array(AuditLogResponseSchema)

export type AuditTrail = z.infer<typeof AuditTrailSchema>
