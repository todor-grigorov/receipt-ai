import HttpRequest from '../httpRequest'
import {
  JobStatusResponseSchema,
  PagedJobResponseSchema,
  type JobStatus,
} from '@/types/job'

export const jobService = {
  async getById(id: string, signal?: AbortSignal) {
    return HttpRequest.get(`/api/jobs/${id}`, JobStatusResponseSchema, signal)
  },

  async getAll(
    page: number = 1,
    pageSize: number = 10,
    statusFilter?: JobStatus,
    signal?: AbortSignal
  ) {
    return HttpRequest.get('/api/jobs', PagedJobResponseSchema, signal, {
      page,
      pageSize,
      ...(statusFilter && { status: statusFilter }),
    })
  },
}
