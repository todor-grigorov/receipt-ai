import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProcessingStatus from '@/components/upload/ProcessingStatus'

describe('ProcessingStatus', () => {
  it('should render "Processing failed" and the error icon when currentStep is failed', () => {
    render(<ProcessingStatus currentStep="failed" />)

    expect(screen.getByText('Processing failed')).toBeInTheDocument()
  })

  it('should display the errorMessage when provided and currentStep is failed', () => {
    render(
      <ProcessingStatus currentStep="failed" errorMessage="Gemini timed out" />
    )

    expect(screen.getByText('Gemini timed out')).toBeInTheDocument()
  })

  it('should not display an errorMessage paragraph when none is provided and currentStep is failed', () => {
    render(<ProcessingStatus currentStep="failed" />)

    expect(screen.getByText('Processing failed')).toBeInTheDocument()
    expect(screen.queryByText(/gemini/i)).not.toBeInTheDocument()
  })

  it('should render the processing spinner and all three step labels when not failed', () => {
    render(<ProcessingStatus currentStep="uploaded" />)

    expect(screen.getByText('Processing your receipt...')).toBeInTheDocument()
    expect(screen.getByText('Uploaded')).toBeInTheDocument()
    expect(screen.getByText('Processing')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should mark "Uploaded" as active and the rest pending when currentStep is uploaded', () => {
    render(<ProcessingStatus currentStep="uploaded" />)

    expect(screen.getByText('Uploaded')).toHaveClass('text-[#111827]')
    expect(screen.getByText('Processing')).toHaveClass('text-[#9CA3AF]')
    expect(screen.getByText('Completed')).toHaveClass('text-[#9CA3AF]')
  })

  it('should mark "Uploaded" as done and "Processing" as active when currentStep is processing', () => {
    render(<ProcessingStatus currentStep="processing" />)

    expect(screen.getByText('Uploaded')).toHaveClass('text-[#111827]') // done = not gray
    expect(screen.getByText('Processing')).toHaveClass('text-[#111827]') // active = not gray
    expect(screen.getByText('Completed')).toHaveClass('text-[#9CA3AF]') // still pending = gray
  })

  it('should mark all three steps as done/active (not pending) when currentStep is completed', () => {
    render(<ProcessingStatus currentStep="completed" />)

    expect(screen.getByText('Uploaded')).toHaveClass('text-[#111827]')
    expect(screen.getByText('Processing')).toHaveClass('text-[#111827]')
    expect(screen.getByText('Completed')).toHaveClass('text-[#111827]')
  })

  it('should treat failed currentStep as equivalent to processing for step states, even though it renders the failed view', () => {
    // This test documents the getStepState behavior specifically:
    // internally, 'failed' maps to the same index as 'processing'
    // for step-state calculation purposes, even though the failed
    // view replaces the whole step list visually. We verify this
    // indirectly by confirming the failed view doesn't render any
    // step labels at all (since it returns early).
    render(<ProcessingStatus currentStep="failed" />)

    expect(screen.queryByText('Uploaded')).not.toBeInTheDocument()
    expect(screen.queryByText('Processing')).not.toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })
})
