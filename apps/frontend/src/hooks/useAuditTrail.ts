import { useState, useEffect } from 'react'
import { auditService } from '@/lib/services/auditService'
import { RequestCancelled } from '@/lib/errors/cancelError'
import { type AuditTrail } from '@/types/audit'
import { error } from '@/lib/logger'

interface UseAuditTrailState {
  data: AuditTrail
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

export function useAuditTrail(correlationId: string | null) {
  const [state, setState] = useState<UseAuditTrailState>({
    data: [],
    isLoading: true,
    isError: false,
    errorMessage: null,
  })

  useEffect(() => {
    if (!correlationId) {
      setState({
        data: [],
        isLoading: false,
        isError: false,
        errorMessage: null,
      })
      return
    }

    const controller = new AbortController()

    void (async () => {
      setState((prev) => ({ ...prev, isLoading: true, isError: false }))

      try {
        const data = await auditService.getTrail(
          correlationId,
          controller.signal
        )
        setState({
          data,
          isLoading: false,
          isError: false,
          errorMessage: null,
        })
      } catch (err) {
        if (err instanceof RequestCancelled) return

        error('Failed to fetch audit trail:', err)
        setState({
          data: [],
          isLoading: false,
          isError: true,
          errorMessage: 'Failed to load audit trail.',
        })
      }
    })()

    return () => controller.abort()
  }, [correlationId])

  return {
    auditTrail: state.data,
    isLoading: state.isLoading,
    isError: state.isError,
    errorMessage: state.errorMessage,
  }
}
