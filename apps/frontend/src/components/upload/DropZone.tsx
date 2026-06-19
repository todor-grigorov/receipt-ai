'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadIcon, FileIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

interface DropZoneProps {
  selectedFile: File | null
  onFileSelected: (file: File | null) => void
  errorMessage?: string | null
}

export default function DropZone({
  selectedFile,
  onFileSelected,
  errorMessage,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, WEBP and PDF files are accepted.'
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File size cannot exceed 10MB.'
    }
    return null
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        setValidationError(error)
        onFileSelected(null)
        return
      }
      setValidationError(null)
      onFileSelected(file)
    },
    [validateFile, onFileSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onFileSelected(null)
      setValidationError(null)
    },
    [onFileSelected]
  )

  const displayError = validationError ?? errorMessage

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors bg-white',
          isDragging
            ? 'border-[#2563EB] bg-[#EFF6FF]'
            : 'border-[#E5E7EB] hover:border-[#2563EB]'
        )}
      >
        {selectedFile ? (
          <>
            <FileIcon className="h-8 w-8 text-[#2563EB]" />
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[#111827] truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <button
                onClick={handleRemove}
                className="text-[#6B7280] hover:text-[#DC2626]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Click to choose a different file
            </p>
          </>
        ) : (
          <>
            <UploadIcon className="h-8 w-8 text-[#6B7280]" />
            <p className="text-base font-medium text-[#111827]">
              Drag and drop your receipt here
            </p>
            <p className="text-sm text-[#6B7280]">or click to browse</p>
            <p className="text-xs text-[#9CA3AF]">
              JPEG, PNG, WEBP, PDF. For multi-page receipts use PDF.
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {displayError && <p className="text-sm text-[#DC2626]">{displayError}</p>}
    </div>
  )
}
