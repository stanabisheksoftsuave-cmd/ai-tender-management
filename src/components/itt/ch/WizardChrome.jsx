import { CheckCircle } from 'lucide-react'
import Badge from '../../ui/Badge'

const ITT_WIZARD_STEPS = ['Project Details', 'AI Generation', 'Review & Redesign', 'Export']

/*
 * The tender header band at the top of the ITT wizard's white container,
 * laid out like the other tender headers (MAIN's WizardStatusBanner /
 * CommercialTenderHeader): the tender title with an "ITT Draft" badge and the
 * cost code, then a caption with the live status and the tender's details
 * (department · bidders · closing date — see tenderHeaderDetails).
 *
 * `reference` is the cost code; an empty one hides the chip, so a brand-new
 * draft shows "New ITT draft" with no code rather than a placeholder.
 */
export function WizardStatusBanner({ statusText, reference, tenderTitle, details = [] }) {
  return (
    <header className="space-y-2 px-4 py-4 sm:px-6 sm:py-5 olng-slide-up">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 break-words text-lg font-bold text-slate-800 dark:text-slate-100">
          {tenderTitle || 'New ITT draft'}
        </h2>
        <Badge variant="info">ITT Draft</Badge>
        {reference ? (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500 dark:bg-slate-800">
            {`Cost Code: ${reference}`}
          </span>
        ) : null}
      </div>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
        <span className="relative flex w-1.5 h-1.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex w-full h-full animate-ping rounded-full bg-[#0089cf]/60" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#0089cf]" />
        </span>
        <span className="font-medium text-slate-800 dark:text-slate-100">{statusText}</span>
        {details.map(detail => (
          <span key={detail} className="contents">
            <span aria-hidden="true">·</span>
            <span>{detail}</span>
          </span>
        ))}
      </p>
    </header>
  )
}

/* Project Details → AI Generation → Review & Redesign → Export. */
export function IttWizardStepper({ current }) {
  return (
    <div className="overflow-x-auto px-1.5 py-1.5">
      <div className="flex min-w-max items-center olng-slide-up" style={{ animationDelay: '60ms' }}>
        {ITT_WIZARD_STEPS.map((label, i) => {
          const isDone = i < current
          const isActive = i === current
          const isLast = i === ITT_WIZARD_STEPS.length - 1
          return (
            <div
              key={label}
              role="group"
              aria-label={`${label}: ${isDone ? 'completed' : isActive ? 'current' : 'pending'}`}
              aria-current={isActive ? 'step' : undefined}
              className="flex items-center"
              style={{ flex: isLast ? 'none' : 1 }}
            >
              <div className="flex shrink-0 items-center gap-2.5">
                <span
                  className="relative z-10 flex w-7 h-7 items-center justify-center rounded-full text-xs font-semibold transition-colors"
                  style={isActive
                    ? { background: '#1b4c6f', color: '#fff', boxShadow: '0 0 0 4px rgba(0,137,207,0.35)' }
                    : isDone
                      ? { background: '#0089cf', color: '#fff' }
                      : { background: '#fff', color: '#94a3b8', border: '1px solid #e2e8f0' }}
                >
                  {isDone ? <CheckCircle size={16} aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-sm ${isActive ? 'font-semibold' : isDone ? 'font-medium' : ''}`}
                  style={{ color: isActive ? '#1e293b' : isDone ? '#0089cf' : '#94a3b8' }}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-1.5 h-px flex-1 rounded-full transition-colors" style={{ background: isDone ? '#0089cf' : '#e2e8f0', minWidth: 24 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
