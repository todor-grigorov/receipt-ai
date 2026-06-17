import { z } from 'zod'

// ── JobStatus Enum ────────────────────────────────────────
export enum JobStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
}

export const JobStatusResponseSchema = z.object({
  id: z.uuid(),
  correlationId: z.uuid(),
  status: z.nativeEnum(JobStatus),
  errorMessage: z.string().nullable(),
  resultId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>

export const PagedJobResponseSchema = z.object({
  items: z.array(JobStatusResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

export type PagedJobResponse = z.infer<typeof PagedJobResponseSchema>

// ── SignalR Job Status Changed Event ──────────────────────
export const JobStatusChangedEventSchema = z.object({
  jobId: z.uuid(),
  status: z.nativeEnum(JobStatus),
  resultId: z.uuid().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
})

export type JobStatusChangedEvent = z.infer<typeof JobStatusChangedEventSchema>
