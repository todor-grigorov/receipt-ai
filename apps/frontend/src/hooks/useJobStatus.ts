import { useState, useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { JobStatusChangedEventSchema, JobStatus } from '@/types/job'
import { type JobStatusChangedEvent } from '@/types/job'
import { error, info } from '@/lib/logger'

interface UseJobStatusOptions {
  jobId: string | null
  onCompleted?: (resultId: string) => void
  onFailed?: (errorMessage: string) => void
  onProcessing?: () => void
}

interface UseJobStatusState {
  status: JobStatus | null
  isConnecting: boolean
  isError: boolean
}

export function useJobStatus({
  jobId,
  onCompleted,
  onFailed,
  onProcessing,
}: UseJobStatusOptions) {
  const [state, setState] = useState<UseJobStatusState>({
    status: null,
    isConnecting: true,
    isError: false,
  })

  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const onCompletedRef = useRef(onCompleted)
  const onFailedRef = useRef(onFailed)
  const onProcessingRef = useRef(onProcessing)

  // Keep refs up to date on every render
  useEffect(() => {
    onCompletedRef.current = onCompleted
    onFailedRef.current = onFailed
    onProcessingRef.current = onProcessing
  })

  useEffect(() => {
    if (!jobId) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_BACKEND_SIGNALR_URL!, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connectionRef.current = connection

    connection.on('JobStatusChanged', (payload: unknown) => {
      const result = JobStatusChangedEventSchema.safeParse(payload)

      if (!result.success) {
        error('Invalid SignalR payload:', result.error.issues)
        return
      }

      const event: JobStatusChangedEvent = result.data

      info(`Job ${event.jobId} status changed to ${event.status}`)

      setState((prev) => ({ ...prev, status: event.status }))

      switch (event.status) {
        case JobStatus.Completed:
          if (event.resultId) onCompletedRef.current?.(event.resultId)
          break
        case JobStatus.Failed:
          onFailedRef.current?.(event.errorMessage ?? 'Unknown error occurred')
          setState((prev) => ({ ...prev, isError: true }))
          break
        case JobStatus.Processing:
          onProcessingRef.current?.()
          break
      }
    })

    const start = async () => {
      try {
        await connection.start()
        info(`SignalR connected for job: ${jobId}`)
        await connection.invoke('SubscribeToJob', jobId)
        setState((prev) => ({ ...prev, isConnecting: false }))
      } catch (err) {
        error('SignalR connection failed:', err)
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          isError: true,
        }))
      }
    }

    void start()

    return () => {
      void connection
        .invoke('UnsubscribeFromJob', jobId)
        .catch(() => {})
        .finally(() => connection.stop())
    }
  }, [jobId])

  return {
    status: state.status,
    isConnecting: state.isConnecting,
    isError: state.isError,
  }
}
