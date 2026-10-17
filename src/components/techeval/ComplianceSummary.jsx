import { CircleAlert, Clock } from 'lucide-react'
import { cn } from '../../utils/cn'

/** The four compliance tiles — MAIN's `ComplianceSummaryTiles`. */
export function ComplianceSummaryTiles({ total, compliant, partial, nonCompliant }) {
  const tiles = [
    { label: 'Total Bidders', value: total, caption: 'Participating contractors', box: 'border-slate-200 bg-white', tone: 'text-slate-500', value_: 'text-slate-800' },
    { label: 'Compliant', value: compliant, caption: 'Meets every mandatory criterion', box: 'border-emerald-200 bg-emerald-50/60', tone: 'text-emerald-700', value_: 'text-emerald-700' },
    { label: 'Partial Compliant', value: partial, caption: 'Needs an evaluator decision', box: 'border-amber-200 bg-amber-50/60', tone: 'text-amber-700', value_: 'text-amber-700' },
    { label: 'Non-Compliant', value: nonCompliant, caption: 'Eliminated unless overridden', box: 'border-red-200 bg-red-50/60', tone: 'text-red-700', value_: 'text-red-700' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(tile => (
        <div key={tile.label} className={cn('rounded-xl border p-4 shadow-sm', tile.box)}>
          <dt className={cn('text-xs font-semibold uppercase tracking-wide', tile.tone)}>{tile.label}</dt>
          <dd className={cn('mt-1.5 text-2xl font-bold tabular-nums', tile.value_)}>{tile.value}</dd>
          <p className="mt-1 text-[11px] text-slate-500">{tile.caption}</p>
        </div>
      ))}
    </dl>
  )
}

/** "Every bidder is Non-Compliant." / "N bidders need a compliance decision." — MAIN's `EligibilityBanner`. */
export function EligibilityBanner({ eligibleCount, partialCount, totalCount }) {
  if (totalCount === 0) return null
  let tone = null
  if (eligibleCount === 0) {
    tone = {
      icon: <CircleAlert size={18} />,
      title: 'Every bidder is Non-Compliant.',
      body: (
        <>
          Review the gaps below. You can continue to Technical Scoring, set a bidder&apos;s status to{' '}
          <strong className="font-semibold">Compliant</strong> with a recorded reason, or notify the Contract Engineer to
          re-upload the missing documents.
        </>
      ),
    }
  } else if (partialCount > 0) {
    tone = {
      icon: <Clock size={18} />,
      title: `${partialCount} ${partialCount === 1 ? 'bidder needs' : 'bidders need'} a compliance decision.`,
      body: (
        <>
          Set each <strong className="font-semibold">Partial Compliant</strong> bidder to Compliant or Non-Compliant before
          continuing to Technical Scoring.
        </>
      ),
    }
  }
  if (!tone) return null
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-l-4 border-amber-200 border-l-amber-500 bg-amber-50/60 px-4 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
        {tone.icon}
      </span>
      <div className="min-w-0 space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-800">{tone.title}</h3>
        <p className="text-xs leading-relaxed text-slate-500">{tone.body}</p>
      </div>
    </div>
  )
}
