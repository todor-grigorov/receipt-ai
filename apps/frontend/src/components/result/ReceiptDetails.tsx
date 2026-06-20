import { type ReceiptResponse } from '@/types/receipt'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileIcon } from 'lucide-react'

interface ReceiptDetailsProps {
  receipt: ReceiptResponse
}

function formatCurrency(value: number, currency: string | null): string {
  const sign = value < 0 ? '-' : ''
  return `${sign}${currency ?? 'CHF'} ${Math.abs(value).toFixed(2)}`
}

export default function ReceiptDetails({ receipt }: ReceiptDetailsProps) {
  const subtotal = receipt.lineItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  )

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <h2 className="text-xl font-semibold text-[#111827]">
          {receipt.merchantName ?? 'Unknown merchant'}
        </h2>
        <div className="text-sm text-[#6B7280] sm:text-right">
          <p>{receipt.receiptDate ?? '—'}</p>
          <p>{receipt.currency ?? 'CHF'}</p>
        </div>
      </div>

      {/* ── Line Items Table ── */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipt.lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.unitPrice, receipt.currency)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.totalPrice, receipt.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ── Summary ── */}
      <div className="flex flex-col gap-2 self-end w-full sm:w-64">
        <div className="flex justify-between text-sm text-[#6B7280]">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, receipt.currency)}</span>
        </div>
        {receipt.tax !== null && (
          <div className="flex justify-between text-sm text-[#6B7280]">
            <span>Tax</span>
            <span>{formatCurrency(receipt.tax, receipt.currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold text-[#111827] pt-2 border-t border-[#E5E7EB]">
          <span>Total</span>
          <span>{formatCurrency(receipt.total, receipt.currency)}</span>
        </div>
      </div>

      {/* ── View Original ── */}
      {receipt.blobUrl && (
        <a
          href={receipt.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[#2563EB] hover:underline self-start"
        >
          <FileIcon className="h-4 w-4" />
          View original receipt
        </a>
      )}
    </div>
  )
}
