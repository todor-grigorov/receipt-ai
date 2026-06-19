import { Loader2, CheckCircle2, Circle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProcessingStep = 'uploaded' | 'processing' | 'completed' | 'failed'

interface ProcessingStatusProps {
  currentStep: ProcessingStep
  errorMessage?: string | null
}

const steps: { key: ProcessingStep; label: string }[] = [
  { key: 'uploaded', label: 'Uploaded' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
]

function getStepState(
  stepKey: ProcessingStep,
  currentStep: ProcessingStep
): 'done' | 'active' | 'pending' {
  const order: ProcessingStep[] = ['uploaded', 'processing', 'completed']
  const currentIndex = order.indexOf(
    currentStep === 'failed' ? 'processing' : currentStep
  )
  const stepIndex = order.indexOf(stepKey)

  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

export default function ProcessingStatus({
  currentStep,
  errorMessage,
}: ProcessingStatusProps) {
  if (currentStep === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <XCircle className="h-10 w-10 text-[#DC2626]" />
        <p className="text-base font-medium text-[#111827]">
          Processing failed
        </p>
        {errorMessage && (
          <p className="text-sm text-[#6B7280] text-center max-w-sm">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Loader2 className="h-10 w-10 text-[#2563EB] animate-spin" />
      <p className="text-base font-medium text-[#111827]">
        Processing your receipt...
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {steps.map((step, index) => {
          const state = getStepState(step.key, currentStep)
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className="relative flex flex-col items-center">
                {state === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                ) : state === 'active' ? (
                  <div className="h-5 w-5 rounded-full bg-[#2563EB]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#D1D5DB]" />
                )}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-5 w-px h-6',
                      state === 'done' ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-sm',
                  state === 'pending'
                    ? 'text-[#9CA3AF]'
                    : 'text-[#111827] font-medium'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
