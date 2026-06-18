import { Badge } from '@/components/ui/badge'
import { JobStatus } from '@/types/job'

interface StatusBadgeProps {
  status: JobStatus
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  [JobStatus.Pending]: {
    label: 'Pending',
    className: 'bg-[#6B7280] hover:bg-[#6B7280] text-white',
  },
  [JobStatus.Processing]: {
    label: 'Processing',
    className: 'bg-[#D97706] hover:bg-[#D97706] text-white',
  },
  [JobStatus.Completed]: {
    label: 'Completed',
    className: 'bg-[#16A34A] hover:bg-[#16A34A] text-white',
  },
  [JobStatus.Failed]: {
    label: 'Failed',
    className: 'bg-[#DC2626] hover:bg-[#DC2626] text-white',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return <Badge className={config.className}>{config.label}</Badge>
}
