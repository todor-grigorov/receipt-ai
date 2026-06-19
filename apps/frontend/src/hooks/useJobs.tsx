import { useState, useEffect, useCallback } from 'react'
import { RequestCancelled } from '@/lib/errors/cancelError'
import { error } from '@/lib/logger'
import { jobService } from '@/lib/services/jobService'
import { PagedJobResponse } from '@/types/job'

interface UseJobsOptions {
  page?: number
  pageSize?: number
}

interface UseJobsState {
  data: PagedJobResponse | null
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

export function useJobs({ page = 1, pageSize = 10 }: UseJobsOptions = {}) {
  const [state, setState] = useState<UseJobsState>({
    data: null,
    isLoading: true,
    isError: false,
    errorMessage: null,
  })

  const fetchJobs = useCallback(
    async (signal: AbortSignal) => {
      setState((prev) => ({ ...prev, isLoading: true, isError: false }))

      try {
        const data = await jobService.getAll(page, pageSize, undefined, signal)
        setState({
          data,
          isLoading: false,
          isError: false,
          errorMessage: null,
        })
      } catch (err) {
        if (err instanceof RequestCancelled) return

        error('Failed to fetch jobs:', err)
        setState({
          data: null,
          isLoading: false,
          isError: true,
          errorMessage: 'Failed to load jobs. Please try again.',
        })
      }
    },
    [page, pageSize]
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchJobs(controller.signal)
    return () => controller.abort()
  }, [fetchJobs])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    fetchJobs(controller.signal)
  }, [fetchJobs])

  return {
    jobs: state.data?.items ?? [],
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
