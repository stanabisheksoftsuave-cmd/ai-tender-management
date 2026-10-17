import { CheckCircle } from 'lucide-react'

const ITT_WIZARD_STEPS = ['Project Details', 'AI Generation', 'Review & Redesign', 'Export']

/*
 * "ITT Draft · {status}" pill plus the tender reference badge — shared by the
 * Project Details form and the section workbench (MAIN's WizardStatusBanner).
 */
export function WizardStatusBanner({ statusText, reference }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 olng-slide-up">
      <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
        <span className="relative flex w-1.5 h-1.5 shrink-0">
          <span className="absolute inline-flex w-full h-full animate-ping rounded-full" style={{ background: 'rgba(0,137,207,0.6)' }} />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: '#0089cf' }} />
        </span>
        <span className="shrink-0 text-xs font-semibold" style={{ color: '#1e293b' }}>ITT Draft</span>
        <span className="shrink-0 text-slate-400">·</span>
        <span className="truncate text-xs text-slate-500">{statusText}</span>
      </div>
      {reference ? (
        <span className="shrink-0 rounded-lg px-2.5 py-1 font-secondary text-xs font-medium" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}>
          {reference}
        </span>
      ) : null}
    </div>
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
