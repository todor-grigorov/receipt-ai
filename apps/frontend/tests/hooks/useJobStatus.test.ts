import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useJobStatus } from '@/hooks/useJobStatus'
import { JobStatus } from '@/types/job'

// ── Mock HubConnection ──────────────────────────────────
const mockConnection = {
  on: vi.fn(),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  invoke: vi.fn().mockResolvedValue(undefined),
}

const mockBuilder = {
  withUrl: vi.fn().mockReturnThis(),
  withAutomaticReconnect: vi.fn().mockReturnThis(),
  configureLogging: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue(mockConnection),
}

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: class {
    constructor() {
      return mockBuilder
    }
  },
  LogLevel: { Warning: 2 },
}))

vi.mock('@/lib/logger')

describe('useJobStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnection.start.mockResolvedValue(undefined)
    mockConnection.invoke.mockResolvedValue(undefined)
    mockBuilder.build.mockReturnValue(mockConnection)
  })

  it('should do nothing when correlationId is null', () => {
    const { result } = renderHook(() => useJobStatus({ correlationId: null }))

    expect(result.current.isConnecting).toBe(true)
    expect(mockConnection.start).not.toHaveBeenCalled()
  })

  it('should establish connection and subscribe when correlationId is provided', async () => {
    const { result } = renderHook(() =>
      useJobStatus({ correlationId: 'corr-123' })
    )

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false)
    })

    expect(mockConnection.start).toHaveBeenCalledTimes(1)
    expect(mockConnection.invoke).toHaveBeenCalledWith(
      'SubscribeToJob',
      'corr-123'
    )
  })

  it('should set isError when connection fails to start', async () => {
    mockConnection.start.mockRejectedValue(new Error('Connection refused'))

    const { result } = renderHook(() =>
      useJobStatus({ correlationId: 'corr-123' })
    )

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false)
    })

    expect(result.current.isError).toBe(true)
  })

  it('should update status and call onCompleted when JobStatusChanged fires with Completed', async () => {
    const onCompleted = vi.fn()
    const resultId = crypto.randomUUID()
    const jobId = crypto.randomUUID()

    renderHook(() => useJobStatus({ correlationId: 'corr-123', onCompleted }))

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalledWith(
        'JobStatusChanged',
        expect.any(Function)
      )
    })

    const handler = mockConnection.on.mock.calls[0][1]

    handler({
      jobId,
      status: JobStatus.Completed,
      resultId,
    })

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledWith(resultId)
    })
  })

  it('should call onFailed and set isError when JobStatusChanged fires with Failed', async () => {
    const onFailed = vi.fn()
    const jobId = crypto.randomUUID()

    renderHook(() => useJobStatus({ correlationId: 'corr-123', onFailed }))

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalled()
    })

    const handler = mockConnection.on.mock.calls[0][1]

    handler({
      jobId: jobId,
      status: JobStatus.Failed,
      errorMessage: 'Gemini timed out',
    })

    await waitFor(() => {
      expect(onFailed).toHaveBeenCalledWith('Gemini timed out')
    })
  })

  it('should call onFailed with default message when errorMessage is missing', async () => {
    const onFailed = vi.fn()
    const jobId = crypto.randomUUID()

    renderHook(() => useJobStatus({ correlationId: 'corr-123', onFailed }))

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalled()
    })

    const handler = mockConnection.on.mock.calls[0][1]

    handler({ jobId: jobId, status: JobStatus.Failed })

    await waitFor(() => {
      expect(onFailed).toHaveBeenCalledWith('Unknown error occurred')
    })
  })

  it('should call onProcessing when JobStatusChanged fires with Processing', async () => {
    const onProcessing = vi.fn()
    const jobId = crypto.randomUUID()

    renderHook(() => useJobStatus({ correlationId: 'corr-123', onProcessing }))

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalled()
    })

    const handler = mockConnection.on.mock.calls[0][1]

    handler({
      jobId,
      status: JobStatus.Processing,
    })

    await waitFor(() => {
      expect(onProcessing).toHaveBeenCalledTimes(1)
    })
  })

  it('should ignore invalid SignalR payloads without throwing', async () => {
    const onCompleted = vi.fn()

    renderHook(() => useJobStatus({ correlationId: 'corr-123', onCompleted }))

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalled()
    })

    const handler = mockConnection.on.mock.calls[0][1]

    expect(() => handler({ garbage: 'data' })).not.toThrow()
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('should unsubscribe and stop connection on unmount', async () => {
    const { unmount } = renderHook(() =>
      useJobStatus({ correlationId: 'corr-123' })
    )

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalled()
    })

    unmount()

    await waitFor(() => {
      expect(mockConnection.invoke).toHaveBeenCalledWith(
        'UnsubscribeFromJob',
        'corr-123'
      )
    })

    expect(mockConnection.stop).toHaveBeenCalled()
  })

  it('should reconnect with a new connection when correlationId changes', async () => {
    const { rerender } = renderHook(
      ({ correlationId }) => useJobStatus({ correlationId }),
      { initialProps: { correlationId: 'corr-123' } }
    )

    await waitFor(() => {
      expect(mockConnection.start).toHaveBeenCalledTimes(1)
    })

    rerender({ correlationId: 'corr-456' })

    await waitFor(() => {
      expect(mockConnection.stop).toHaveBeenCalled() // old connection torn down
    })

    expect(mockBuilder.build).toHaveBeenCalledTimes(2) // new connection built
  })
})
