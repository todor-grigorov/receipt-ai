import { useState, useCallback } from 'react'
import { receiptService } from '@/lib/services/receiptService'
import { ApiErrorResponse } from '@/lib/errors/apiError'
import { error } from '@/lib/logger'

export enum UploadStatus {
  Idle = 'Idle',
  Uploading = 'Uploading',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
}

interface UseUploadState {
  status: UploadStatus
  correlationId: string | null
  resultId: string | null
  errorMessage: string | null
}

export function useUpload() {
  const [state, setState] = useState<UseUploadState>({
    status: UploadStatus.Idle,
    correlationId: null,
    resultId: null,
    errorMessage: null,
  })

  const upload = useCallback(async (file: File) => {
    setState({
      status: UploadStatus.Uploading,
      correlationId: null,
      resultId: null,
      errorMessage: null,
    })

    try {
      const response = await receiptService.upload(file)

      setState((prev) => ({
        ...prev,
        status: UploadStatus.Processing,
        correlationId: response.correlationId,
      }))
    } catch (err) {
      let errorMessage = 'Upload failed. Please try again.'

      if (err instanceof ApiErrorResponse) {
        if (err.isValidationError()) {
          errorMessage =
            'Invalid file type or size. Please upload a JPEG, PNG, WEBP or PDF file under 10MB.'
        } else if (err.isForbidden()) {
          errorMessage = 'You do not have permission to upload receipts.'
        } else {
          errorMessage = 'Upload failed. Please try again.'
        }
      }

      error('Upload failed:', err)
      setState({
        status: UploadStatus.Failed,
        correlationId: null,
        resultId: null,
        errorMessage,
      })
    }
  }, [])

  const onCompleted = useCallback((resultId: string) => {
    setState((prev) => ({
      ...prev,
      status: UploadStatus.Completed,
      resultId,
    }))
  }, [])

  const onFailed = useCallback((message: string) => {
    setState({
      status: UploadStatus.Failed,
      correlationId: null,
      resultId: null,
      errorMessage: message,
    })
  }, [])

  const onProcessing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: UploadStatus.Processing,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      status: UploadStatus.Idle,
      correlationId: null,
      resultId: null,
      errorMessage: null,
    })
  }, [])

  return {
    status: state.status,
    correlationId: state.correlationId,
    resultId: state.resultId,
    errorMessage: state.errorMessage,
    isIdle: state.status === UploadStatus.Idle,
    isUploading: state.status === UploadStatus.Uploading,
    isProcessing: state.status === UploadStatus.Processing,
    isCompleted: state.status === UploadStatus.Completed,
    isFailed: state.status === UploadStatus.Failed,
    upload,
    onCompleted,
    onFailed,
    onProcessing,
    reset,
  }
}
