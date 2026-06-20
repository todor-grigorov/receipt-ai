'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DropZone from '@/components/upload/DropZone'
import ProcessingStatus, {
  type ProcessingStep,
} from '@/components/upload/ProcessingStatus'
import { useUpload } from '@/hooks/useUpload'
import { useJobStatus } from '@/hooks/useJobStatus'

export default function UploadPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    upload,
    correlationId,
    resultId,
    errorMessage,
    isUploading,
    isProcessing,
    isCompleted,
    isFailed,
    onCompleted,
    onFailed,
    onProcessing,
    reset,
  } = useUpload()

  // Subscribe to live job status once we have a correlationId
  useJobStatus({
    correlationId: isUploading || isProcessing ? correlationId : null,
    onCompleted,
    onFailed,
    onProcessing,
  })

  useEffect(() => {
    if (isCompleted && resultId) {
      router.push(`/receipts/${resultId}`)
    }
  }, [isCompleted, resultId, router])

  const showProcessing = isUploading || isProcessing || isCompleted || isFailed

  const currentStep: ProcessingStep = isFailed
    ? 'failed'
    : isCompleted
      ? 'completed'
      : isProcessing
        ? 'processing'
        : 'uploaded'

  const handleSubmit = () => {
    if (selectedFile) upload(selectedFile)
  }

  const handleTryAgain = () => {
    reset()
    setSelectedFile(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      <h1 className="text-2xl font-semibold text-[#111827] mb-6">
        Upload Receipt
      </h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          {showProcessing ? (
            <ProcessingStatus
              currentStep={currentStep}
              errorMessage={errorMessage}
            />
          ) : (
            <DropZone
              selectedFile={selectedFile}
              onFileSelected={setSelectedFile}
              errorMessage={errorMessage}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 mt-4">
        {!showProcessing && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
          >
            Upload Receipt
          </Button>
        )}

        {isFailed && (
          <Button
            onClick={handleTryAgain}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          >
            Try again
          </Button>
        )}

        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back
        </Button>
      </div>
    </div>
  )
}
