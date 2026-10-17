import { Check, Eye, Minus, X } from 'lucide-react'
import { cn } from '../../utils/cn'

const KIND_STYLE = {
  mandatory: { icon: 'bg-red-50 text-red-600', badge: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  optional:  { icon: 'bg-amber-50 text-amber-600', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
}

function MetricRow({ metric, kind, onViewProof }) {
  const style = KIND_STYLE[kind]
  const isScored = metric.score !== null
  const verdict = metric.present ? 'Compliant' : isScored ? metric.label : 'Missing'
  return (
    <li className={cn(
      'flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-3',
      metric.present && 'hover:border-emerald-300'
    )}>
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
          metric.present ? 'bg-emerald-50 text-emerald-600' : style.icon)} aria-hidden="true">
          {metric.present ? <Check size={12} strokeWidth={3} /> : kind === 'mandatory' ? <X size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-snug text-slate-800">{metric.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{metric.docRef}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-7 sm:pl-0">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold',
          metric.present ? 'bg-emerald-50 text-emerald-700' : style.badge)}>
          {verdict}
        </span>
        {isScored && (
          <button
            type="button"
            onClick={onViewProof}
            className="inline-flex min-h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
          >
            <Eye size={13} /> View Proof<span className="sr-only"> for {metric.name}</span>
          </button>
        )}
      </div>
    </li>
  )
}

/** One bidder's Mandatory (Must) and Optional (Want) criteria — MAIN's `CriteriaGrid`. */
export function CriteriaGrid({ view, onViewProof }) {
  const columns = [
    { title: 'Mandatory criteria', kind: 'mandatory', metrics: view.mandatory },
    { title: 'Optional criteria', kind: 'optional', metrics: view.optional },
  ]
  return (
    <div className="grid grid-cols-1 gap-5 px-4 py-4 lg:grid-cols-2">
      {columns.map(column => {
        const passed = column.metrics.filter(m => m.present).length
        return (
          <section key={column.kind} aria-label={column.title} className="space-y-3">
            <h4 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
              <span className={cn('h-2 w-2 rounded-full', KIND_STYLE[column.kind].dot)} aria-hidden="true" />
              {column.title}
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold normal-case tabular-nums text-slate-500">
                {passed}/{column.metrics.length}
              </span>
            </h4>
            {column.metrics.length === 0 ? (
              <p className="text-xs text-slate-400">No {column.kind === 'mandatory' ? 'Must' : 'Want'} criteria in the matrix.</p>
            ) : (
              <ul className="space-y-2">
                {column.metrics.map(metric => (
                  <MetricRow key={metric.id} metric={metric} kind={column.kind} onViewProof={() => onViewProof(metric)} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
