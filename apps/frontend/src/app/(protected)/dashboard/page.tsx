'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UploadIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import ReceiptTable from '@/components/dashboard/ReceiptTable'
import ReceiptCard from '@/components/dashboard/ReceiptCard'
import { useReceipts } from '@/hooks/useReceipts'
import { useJobs } from '@/hooks/useJobs'
import { type ReceiptWithStatus } from '@/types/receipt'
import { JobStatus } from '@/types/job'

const PAGE_SIZE = 10

export default function DashboardPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)

  const {
    receipts,
    pagination,
    isLoading: receiptsLoading,
  } = useReceipts({ page, pageSize: PAGE_SIZE })

  const { jobs, isLoading: jobsLoading } = useJobs({
    page,
    pageSize: PAGE_SIZE,
  })

  const isLoading = receiptsLoading || jobsLoading

  // Merge receipts with their job status
  const jobMap = new Map(jobs.map((job) => [job.correlationId, job]))

  const receiptsWithStatus: ReceiptWithStatus[] = receipts.map((receipt) => ({
    ...receipt,
    status: jobMap.get(receipt.correlationId)?.status ?? JobStatus.Pending,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#111827]">My Receipts</h1>
        <Button
          onClick={() => router.push('/upload')}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white gap-2"
        >
          <UploadIcon className="h-4 w-4" />
          Upload Receipt
        </Button>
      </div>

      {/* ── Desktop Table ── */}
      <Card className="border-0 shadow-sm hidden lg:block">
        <CardContent className="p-0">
          <ReceiptTable receipts={receiptsWithStatus} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* ── Mobile Cards ── */}
      <div className="flex flex-col gap-3 lg:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-gray-100 animate-pulse"
            />
          ))
        ) : receiptsWithStatus.length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            No receipts yet. Upload your first receipt to get started.
          </div>
        ) : (
          receiptsWithStatus.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-[#6B7280]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
