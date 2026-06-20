import HttpRequest from '../httpRequest'
import {
  ReceiptResponseSchema,
  PagedReceiptResponseSchema,
} from '@/types/receipt'

export const receiptService = {
  async getById(id: string, signal?: AbortSignal) {
    return HttpRequest.get(`/api/receipts/${id}`, ReceiptResponseSchema, signal)
  },

  async getByCorrelationId(correlationId: string, signal?: AbortSignal) {
    return HttpRequest.get(
      `/api/receipts/correlation/${correlationId}`,
      ReceiptResponseSchema,
      signal
    )
  },

  async getAll(page: number = 1, pageSize: number = 10, signal?: AbortSignal) {
    return HttpRequest.get(
      '/api/receipts',
      PagedReceiptResponseSchema,
      signal,
      { page, pageSize }
    )
  },

  async upload(file: File, signal?: AbortSignal) {
    const formData = new FormData()
    formData.append('file', file)

    return HttpRequest.postFormData({
      path: '/api/receipts/upload',
      formData,
      responseType: ReceiptResponseSchema,
      signal,
    })
  },

  async delete(id: string) {
    return HttpRequest.delete(`/api/receipts/${id}`)
  },
}
