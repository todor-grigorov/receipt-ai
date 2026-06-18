import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type ReceiptResponse } from '@/types/receipt'
import { type JobStatusResponse } from '@/types/job'
import StatusBadge from './StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'

interface ReceiptTableProps {
  receipts: ReceiptResponse[]
  jobs: JobStatusResponse[]
  isLoading: boolean
}

function ReceiptTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-16 text-[#6B7280]">
        No receipts yet. Upload your first receipt to get started.
      </TableCell>
    </TableRow>
  )
}

export default function ReceiptTable({
  receipts,
  jobs,
  isLoading,
}: ReceiptTableProps) {
  const jobMap = new Map(jobs.map((job) => [job.id, job]))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Merchant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <ReceiptTableSkeleton />
        ) : receipts.length === 0 ? (
          <EmptyState />
        ) : (
          receipts.map((receipt) => {
            const job = jobMap.get(receipt.jobId)
            return (
              <TableRow
                key={receipt.id}
                className="cursor-pointer hover:bg-[#F9FAFB]"
              >
                <TableCell>
                  <Link
                    href={`/receipts/${receipt.id}`}
                    className="block w-full"
                  >
                    {receipt.merchantName ?? 'Unknown merchant'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/receipts/${receipt.id}`}
                    className="block w-full text-[#6B7280]"
                  >
                    {receipt.receiptDate ?? '—'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/receipts/${receipt.id}`}
                    className="block w-full"
                  >
                    {receipt.currency ?? 'CHF'} {receipt.total.toFixed(2)}
                  </Link>
                </TableCell>
                <TableCell>
                  {job && <StatusBadge status={job.status} />}
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
