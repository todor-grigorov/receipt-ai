import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import StatusBadge from './StatusBadge'
import { type ReceiptWithStatus } from '@/types/receipt'

interface ReceiptCardProps {
  receipt: ReceiptWithStatus
}

export default function ReceiptCard({ receipt }: ReceiptCardProps) {
  return (
    <Link href={`/receipts/${receipt.id}`}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#111827] truncate">
              {receipt.merchantName ?? 'Unknown merchant'}
            </span>
            <StatusBadge status={receipt.status} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#6B7280]">
              {receipt.receiptDate ?? '—'}
            </span>
            <span className="text-sm font-medium text-[#111827]">
              {receipt.currency ?? 'CHF'} {receipt.total.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
