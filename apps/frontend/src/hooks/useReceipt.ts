import { useState, useEffect } from 'react'
import { receiptService } from '@/lib/services/receiptService'
import { RequestCancelled } from '@/lib/errors/cancelError'
import { type ReceiptResponse } from '@/types/receipt'
import { error } from '@/lib/logger'

interface UseReceiptState {
  data: ReceiptResponse | null
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

export function useReceipt(id: string) {
  const [state, setState] = useState<UseReceiptState>({
    data: null,
    isLoading: true,
    isError: false,
    errorMessage: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      setState((prev) => ({ ...prev, isLoading: true, isError: false }))

      try {
        const data = await receiptService.getById(id, controller.signal)
        setState({
          data,
          isLoading: false,
          isError: false,
          errorMessage: null,
        })
      } catch (err) {
        if (err instanceof RequestCancelled) return

        error('Failed to fetch receipt:', err)
        setState({
          data: null,
          isLoading: false,
          isError: true,
          errorMessage: 'Failed to load receipt. Please try again.',
        })
      }
    })()

    return () => controller.abort()
  }, [id])

  return {
    receipt: state.data,
    isLoading: state.isLoading,
    isError: state.isError,
    errorMessage: state.errorMessage,
  }
}

export function useReceiptByJobId(jobId: string) {
  const [state, setState] = useState<UseReceiptState>({
    data: null,
    isLoading: true,
    isError: false,
    errorMessage: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      setState((prev) => ({ ...prev, isLoading: true, isError: false }))

      try {
        const data = await receiptService.getByJobId(jobId, controller.signal)
        setState({
          data,
          isLoading: false,
          isError: false,
          errorMessage: null,
        })
      } catch (err) {
        if (err instanceof RequestCancelled) return

        error('Failed to fetch receipt by job id:', err)
        setState({
          data: null,
          isLoading: false,
          isError: true,
          errorMessage: 'Failed to load receipt. Please try again.',
        })
      }
    })()

    return () => controller.abort()
  }, [jobId])

  return {
    receipt: state.data,
    isLoading: state.isLoading,
    isError: state.isError,
    errorMessage: state.errorMessage,
  }
}
