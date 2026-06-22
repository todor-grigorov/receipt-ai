import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useReceipts } from '@/hooks/useReceipts'
import { receiptService } from '@/lib/services/receiptService'
import { RequestCancelled } from '@/lib/errors/cancelError'
import { type PagedReceiptResponse } from '@/types/receipt'

vi.mock('@/lib/services/receiptService')
vi.mock('@/lib/logger')

const mockPagedResponse: PagedReceiptResponse = {
  items: [
    {
      id: '1',
      correlationId: 'corr-1',
      merchantName: 'Coop',
      receiptDate: '2026-06-01',
      total: 10.5,
      tax: 0.8,
      currency: 'CHF',
      blobUrl: null,
      lineItems: [],
      createdAt: '2026-06-01T10:00:00Z',
    },
  ],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}

describe('useReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start in loading state', () => {
    vi.mocked(receiptService.getAll).mockReturnValue(
      new Promise(() => {}) // never resolves, keeps it loading
    )

    const { result } = renderHook(() => useReceipts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.receipts).toEqual([])
    expect(result.current.pagination).toBeNull()
  })

  it('should load receipts and pagination on success', async () => {
    vi.mocked(receiptService.getAll).mockResolvedValue(mockPagedResponse)

    const { result } = renderHook(() => useReceipts())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.receipts).toEqual(mockPagedResponse.items)
    expect(result.current.pagination).toEqual({
      page: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    })
    expect(result.current.isError).toBe(false)
  })

  it('should call receiptService.getAll with provided page and pageSize', async () => {
    vi.mocked(receiptService.getAll).mockResolvedValue(mockPagedResponse)

    renderHook(() => useReceipts({ page: 3, pageSize: 25 }))

    await waitFor(() => {
      expect(receiptService.getAll).toHaveBeenCalledWith(
        3,
        25,
        expect.any(AbortSignal)
      )
    })
  })

  it('should default to page 1 and pageSize 10 when not provided', async () => {
    vi.mocked(receiptService.getAll).mockResolvedValue(mockPagedResponse)

    renderHook(() => useReceipts())

    await waitFor(() => {
      expect(receiptService.getAll).toHaveBeenCalledWith(
        1,
        10,
        expect.any(AbortSignal)
      )
    })
  })

  it('should set error state when fetch fails', async () => {
    vi.mocked(receiptService.getAll).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useReceipts())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.errorMessage).toBe(
      'Failed to load receipts. Please try again.'
    )
    expect(result.current.receipts).toEqual([])
  })

  it('should silently ignore RequestCancelled errors without setting error state', async () => {
    const cancelError = Object.create(RequestCancelled.prototype)
    vi.mocked(receiptService.getAll).mockRejectedValue(cancelError)

    const { result } = renderHook(() => useReceipts())

    // Give the effect time to run and reject
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(true) // never resolved to false since it returned early
  })

  it('should refetch when refetch is called', async () => {
    vi.mocked(receiptService.getAll).mockResolvedValue(mockPagedResponse)

    const { result } = renderHook(() => useReceipts())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    vi.mocked(receiptService.getAll).mockClear()
    vi.mocked(receiptService.getAll).mockResolvedValue({
      ...mockPagedResponse,
      totalCount: 2,
    })

    result.current.refetch()

    await waitFor(() => {
      expect(result.current.pagination?.totalCount).toBe(2)
    })

    expect(receiptService.getAll).toHaveBeenCalledTimes(1)
  })

  it('should return empty receipts array when no data loaded yet', () => {
    vi.mocked(receiptService.getAll).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useReceipts())

    expect(result.current.receipts).toEqual([])
  })
})
