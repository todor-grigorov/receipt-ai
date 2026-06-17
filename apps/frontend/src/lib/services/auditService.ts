import HttpRequest from '../httpRequest'
import { AuditTrailSchema } from '@/types/audit'

export const auditService = {
  async getTrail(correlationId: string, signal?: AbortSignal) {
    return HttpRequest.get(
      `/api/audit/${correlationId}`,
      AuditTrailSchema,
      signal
    )
  },
}
