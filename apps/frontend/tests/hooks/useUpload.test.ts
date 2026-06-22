import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUpload, UploadStatus } from '@/hooks/useUpload'
import { receiptService } from '@/lib/services/receiptService'
import { ApiErrorResponse } from '@/lib/errors/apiError'

vi.mock('@/lib/services/receiptService')
vi.mock('@/lib/logger')

describe('useUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start in Idle state', () => {
    const { result } = renderHook(() => useUpload())

    expect(result.current.status).toBe(UploadStatus.Idle)
    expect(result.current.isIdle).toBe(true)
    expect(result.current.correlationId).toBeNull()
    expect(result.current.resultId).toBeNull()
    expect(result.current.errorMessage).toBeNull()
  })

  it('should transition to Processing with correlationId on successful upload', async () => {
    const mockCorrelationId = 'abc-123'
    vi.mocked(receiptService.upload).mockResolvedValue({
      correlationId: mockCorrelationId,
    } as never)

    const { result } = renderHook(() => useUpload())
    const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.upload(file)
    })

    expect(result.current.status).toBe(UploadStatus.Processing)
    expect(result.current.isProcessing).toBe(true)
    expect(result.current.correlationId).toBe(mockCorrelationId)
  })

  it('should set status to Uploading immediately when upload starts', async () => {
    let resolveUpload: (
      value: Awaited<ReturnType<typeof receiptService.upload>>
    ) => void = () => {}

    vi.mocked(receiptService.upload).mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve
      })
    )

    const { result } = renderHook(() => useUpload())
    const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.upload(file)
    })

    await waitFor(() => {
      expect(result.current.isUploading).toBe(true)
    })

    resolveUpload({ correlationId: 'abc-123' } as Awaited<
      ReturnType<typeof receiptService.upload>
    >)
  })

  it('should set Failed status with validation error message', async () => {
    const apiError = Object.create(ApiErrorResponse.prototype)
    apiError.isValidationError = vi.fn().mockReturnValue(true)
    apiError.isForbidden = vi.fn().mockReturnValue(false)

    vi.mocked(receiptService.upload).mockRejectedValue(apiError)

    const { result } = renderHook(() => useUpload())
    const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.upload(file)
    })

    expect(result.current.status).toBe(UploadStatus.Failed)
    expect(result.current.isFailed).toBe(true)
    expect(result.current.errorMessage).toContain('Invalid file type or size')
    expect(result.current.correlationId).toBeNull()
  })

  it('should set Failed status with forbidden error message', async () => {
    const apiError = Object.create(ApiErrorResponse.prototype)
    apiError.isValidationError = vi.fn().mockReturnValue(false)
    apiError.isForbidden = vi.fn().mockReturnValue(true)

    vi.mocked(receiptService.upload).mockRejectedValue(apiError)

    const { result } = renderHook(() => useUpload())
    const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.upload(file)
    })

    expect(result.current.errorMessage).toContain('do not have permission')
  })

  it('should set generic error message for non-ApiErrorResponse errors', async () => {
    vi.mocked(receiptService.upload).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useUpload())
    const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.upload(file)
    })

    expect(result.current.errorMessage).toBe('Upload failed. Please try again.')
  })

  it('should transition to Completed and store resultId when onCompleted is called', () => {
    const { result } = renderHook(() => useUpload())

    act(() => {
      result.current.onCompleted('result-456')
    })

    expect(result.current.status).toBe(UploadStatus.Completed)
    expect(result.current.isCompleted).toBe(true)
    expect(result.current.resultId).toBe('result-456')
  })

  it('should transition to Failed when onFailed is called', () => {
    const { result } = renderHook(() => useUpload())

    act(() => {
      result.current.onFailed('Gemini timed out')
    })

    expect(result.current.status).toBe(UploadStatus.Failed)
    expect(result.current.isFailed).toBe(true)
    expect(result.current.errorMessage).toBe('Gemini timed out')
  })

  it('should transition to Processing when onProcessing is called', () => {
    const { result } = renderHook(() => useUpload())

    act(() => {
      result.current.onProcessing()
    })

    expect(result.current.status).toBe(UploadStatus.Processing)
    expect(result.current.isProcessing).toBe(true)
  })

  it('should reset to Idle state', () => {
    const { result } = renderHook(() => useUpload())

    act(() => {
      result.current.onCompleted('result-456')
    })

    expect(result.current.isCompleted).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe(UploadStatus.Idle)
    expect(result.current.isIdle).toBe(true)
    expect(result.current.resultId).toBeNull()
    expect(result.current.correlationId).toBeNull()
    expect(result.current.errorMessage).toBeNull()
  })
})
