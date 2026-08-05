import { Check, Circle, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import Card from './Card'
import { cn } from '../../utils/cn'

/** Rows visible before the step list scrolls instead of growing the card. */
const VISIBLE_STEP_COUNT = 4

const STEP_ICON_STYLES = {
  complete: 'bg-emerald-50 text-emerald-600',
  active:   'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  pending:  'bg-slate-100 text-slate-400',
}

/** Rows fade out the further they sit past the active step, capped at 3+ away. */
const STEP_FADE_CLASSES = ['opacity-100', 'opacity-70', 'opacity-45', 'opacity-25']

function stepFadeClass(distanceFromActive) {
  return STEP_FADE_CLASSES[Math.min(Math.max(distanceFromActive, 0), 3)]
}

const StepIcon = ({ status }) => (
  <span className={cn('flex w-6 h-6 shrink-0 items-center justify-center rounded-full', STEP_ICON_STYLES[status])}>
    {status === 'complete' && <Check size={14} />}
    {status === 'active' && <Loader2 size={14} className="animate-spin" />}
    {status === 'pending' && <Circle size={14} />}
  </span>
)

const TypingDots = () => (
  <span className="ml-auto flex items-center gap-0.5" aria-hidden="true">
    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] animate-bounce" />
    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:0.15s]" />
    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:0.3s]" />
  </span>
)

/**
 * Step-by-step "AI is working" card — the shared shell for any long-running
 * AI task (SOW/ITT/PSF generation, template prefill, compliance scoring, …).
 * Callers own the copy and the step list; this component only owns the
 * progress chrome, so every AI wait in the app looks and behaves the same.
 */
export default function AiAnalysisLoader({ title, description, progress, steps, helperText, className }) {
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)))
  const hasOverflow = steps.length > VISIBLE_STEP_COUNT
  const activeStepId = steps.find(step => step.status === 'active')?.id
  const activeStepIndex = steps.findIndex(step => step.id === activeStepId)
  const activeStepRef = useRef(null)

  useEffect(() => {
    activeStepRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  }, [activeStepId])

  return (
    <Card className={cn('w-full', className)}>
      <div className="space-y-5 py-8 px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="flex w-14 h-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Sparkles size={24} />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{description}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-primary)]">
            <span>Progress</span>
            <span>{roundedProgress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={roundedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500"
              style={{ width: `${roundedProgress}%` }}
            />
          </div>
        </div>

        <div className="relative">
          <ul
            className={cn(
              'space-y-1 text-left [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              hasOverflow && 'max-h-44 overflow-y-auto scroll-smooth'
            )}
          >
            {steps.map((step, index) => {
              const distanceFromActive = activeStepIndex === -1 ? 0 : index - activeStepIndex
              return (
                <li
                  key={step.id}
                  ref={step.id === activeStepId ? activeStepRef : null}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-opacity duration-300',
                    step.status === 'active' && 'bg-[var(--color-primary)]/8',
                    stepFadeClass(distanceFromActive)
                  )}
                >
                  <StepIcon status={step.status} />
                  <span className={cn('text-xs font-medium', step.status === 'pending' ? 'text-slate-400' : 'text-slate-800')}>
                    {step.label}
                  </span>
                  {step.status === 'active' && <TypingDots />}
                </li>
              )
            })}
          </ul>
          {hasOverflow && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-lg bg-gradient-to-t from-[var(--color-surface)] to-transparent" />
          )}
        </div>

        {helperText && (
          <p className="border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-400">{helperText}</p>
        )}
      </div>
    </Card>
  )
}
