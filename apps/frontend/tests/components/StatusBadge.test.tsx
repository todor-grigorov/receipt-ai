import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { JobStatus } from '@/types/job'

describe('StatusBadge', () => {
  it('should render "Pending" label for JobStatus.Pending', () => {
    render(<StatusBadge status={JobStatus.Pending} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('should render "Processing" label for JobStatus.Processing', () => {
    render(<StatusBadge status={JobStatus.Processing} />)

    expect(screen.getByText('Processing')).toBeInTheDocument()
  })

  it('should render "Completed" label for JobStatus.Completed', () => {
    render(<StatusBadge status={JobStatus.Completed} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should render "Failed" label for JobStatus.Failed', () => {
    render(<StatusBadge status={JobStatus.Failed} />)

    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('should apply the gray background class for Pending status', () => {
    render(<StatusBadge status={JobStatus.Pending} />)

    expect(screen.getByText('Pending')).toHaveClass('bg-[#6B7280]')
  })

  it('should apply the amber background class for Processing status', () => {
    render(<StatusBadge status={JobStatus.Processing} />)

    expect(screen.getByText('Processing')).toHaveClass('bg-[#D97706]')
  })

  it('should apply the green background class for Completed status', () => {
    render(<StatusBadge status={JobStatus.Completed} />)

    expect(screen.getByText('Completed')).toHaveClass('bg-[#16A34A]')
  })

  it('should apply the red background class for Failed status', () => {
    render(<StatusBadge status={JobStatus.Failed} />)

    expect(screen.getByText('Failed')).toHaveClass('bg-[#DC2626]')
  })
})
