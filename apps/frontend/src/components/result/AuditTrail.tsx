'use client'

import { useState } from 'react'
import { ChevronDownIcon, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AuditLogResponse, AuditEventType } from '@/types/audit'

interface AuditTrailProps {
  events: AuditLogResponse[]
  isLoading: boolean
}

const eventLabels: Record<AuditEventType, string> = {
  [AuditEventType.ReceiptUploaded]: 'Receipt uploaded',
  [AuditEventType.JobCreated]: 'Job created',
  [AuditEventType.BlobStored]: 'File stored',
  [AuditEventType.JobProcessingStarted]: 'Processing started',
  [AuditEventType.LlmRequestSent]: 'LLM request sent',
  [AuditEventType.LlmResponseReceived]: 'LLM response received',
  [AuditEventType.LlmParsingCompleted]: 'Parsing completed',
  [AuditEventType.JobCompleted]: 'Job completed',
  [AuditEventType.JobFailed]: 'Job failed',
  [AuditEventType.ResultRetrieved]: 'Result retrieved',
}

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function AuditTrailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}

export default function AuditTrail({ events, isLoading }: AuditTrailProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full"
      >
        <h2 className="text-lg font-semibold text-[#111827]">Audit Trail</h2>
        <ChevronDownIcon
          className={cn(
            'h-5 w-5 text-[#6B7280] transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen &&
        (isLoading ? (
          <AuditTrailSkeleton />
        ) : events.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No audit events available.</p>
        ) : (
          <div className="flex flex-col">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  {event.isSuccess ? (
                    <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  ) : (
                    <XCircle className="h-5 w-5 text-[#DC2626]" />
                  )}
                  {index < events.length - 1 && (
                    <div className="w-px flex-1 min-h-6 bg-[#E5E7EB] mt-1" />
                  )}
                </div>
                <div className="flex flex-col pb-4">
                  <span className="text-sm font-medium text-[#111827]">
                    {eventLabels[event.eventType]}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {event.service} &middot; {formatTimestamp(event.createdAt)}
                  </span>
                  {!event.isSuccess && event.errorMessage && (
                    <span className="text-xs text-[#DC2626] mt-1">
                      {event.errorMessage}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
