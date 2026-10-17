import { ChevronLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

/*
 * The single card every pre-qualification stage renders inside (MAIN
 * PrequalShell): breadcrumb with the back chevron, the grey cost-code chip and
 * the cyan stage pill, then the title and "· department". The stage below
 * draws its own bands into the same card.
 */
export function PrequalShell({ costCode, stageLabel, title, department, onBack, isBackDisabled = false, children }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: '0 1px 4px rgba(27,76,111,0.08), 0 4px 16px rgba(27,76,111,0.12)' }}
    >
      <header className="border-b px-4 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isBackDisabled}
            aria-label="Back one step"
            title={isBackDisabled ? 'AI is running — please wait for it to finish' : 'Back'}
            className="flex w-6 h-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          {costCode ? (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">{costCode}</span>
          ) : null}
          <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.025em] text-cyan-700 ring-1 ring-cyan-200">
            {stageLabel}
          </span>
        </div>
        <h2 className="text-base font-semibold break-words text-slate-800">{title}</h2>
        <p className="mt-0.5 text-xs break-words text-slate-500">· {department}</p>
      </header>
      {children}
    </section>
  )
}

// One stage's heading band ("Stage 1 - Bidder Matching").
export function StageHeading({ children, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-800">{children}</h2>
      {action}
    </div>
  )
}

// The stage's own forward navigation, inside the card rather than loose below it.
export function ShellFooter({ children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-3 border-t px-4 py-4 sm:px-6', className)} style={{ borderColor: 'var(--color-border)' }}>
      {children}
    </div>
  )
}
