'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ReceiptDetails from '@/components/result/ReceiptDetails'
import AuditTrail from '@/components/result/AuditTrail'
import { useReceipt } from '@/hooks/useReceipt'
import { useAuditTrail } from '@/hooks/useAuditTrail'

export default function ResultPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const { receipt, isLoading, isError, errorMessage } = useReceipt(params.id)

  const { auditTrail, isLoading: isAuditLoading } = useAuditTrail(
    receipt?.jobId ?? null
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] self-start"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Dashboard
      </button>

      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-6 w-32 self-end" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-base font-medium text-[#111827]">
              Receipt not found
            </p>
            <p className="text-sm text-[#6B7280]">
              {errorMessage ?? 'This receipt could not be loaded.'}
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : receipt ? (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <ReceiptDetails receipt={receipt} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <AuditTrail events={auditTrail} isLoading={isAuditLoading} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
