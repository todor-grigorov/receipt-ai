import { useState, useEffect, useCallback, useEffectEvent } from 'react'
import { receiptService } from '@/lib/services/receiptService'
import { RequestCancelled } from '@/lib/errors/cancelError'
import { type PagedReceiptResponse } from '@/types/receipt'
import { error } from '@/lib/logger'

interface UseReceiptsOptions {
  page?: number
  pageSize?: number
}

interface UseReceiptsState {
  data: PagedReceiptResponse | null
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

export function useReceipts({
  page = 1,
  pageSize = 10,
}: UseReceiptsOptions = {}) {
  const [state, setState] = useState<UseReceiptsState>({
    data: null,
    isLoading: true,
    isError: false,
    errorMessage: null,
  })

  const fetchReceipts = useCallback(
    async (signal: AbortSignal) => {
      setState((prev) => ({ ...prev, isLoading: true, isError: false }))

      try {
        const data = await receiptService.getAll(page, pageSize, signal)
        setState({
          data,
          isLoading: false,
          isError: false,
          errorMessage: null,
        })
      } catch (err) {
        if (err instanceof RequestCancelled) return

        error('Failed to fetch receipts:', err)
        setState({
          data: null,
          isLoading: false,
          isError: true,
          errorMessage: 'Failed to load receipts. Please try again.',
        })
      }
    },
    [page, pageSize]
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchReceipts(controller.signal)
    return () => controller.abort()
  }, [fetchReceipts])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    fetchReceipts(controller.signal)
  }, [fetchReceipts])

  return {
    receipts: state.data?.items ?? [],
    pagination: state.data
      ? {
          page: state.data.page,
          pageSize: state.data.pageSize,
          totalCount: state.data.totalCount,
          totalPages: state.data.totalPages,
          hasNextPage: state.data.hasNextPage,
          hasPreviousPage: state.data.hasPreviousPage,
        }
      : null,
    isLoading: state.isLoading,
    isError: state.isError,
    errorMessage: state.errorMessage,
    refetch,
  }
}
