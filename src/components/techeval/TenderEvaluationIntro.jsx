import { useState } from 'react'
import { ClipboardCheck, ScanSearch, ShieldCheck, Sparkles, UserCheck, Users, Zap } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { ConfirmDialog } from './Dialogs'

/**
 * Pre-start landing for one tender's technical evaluation — MAIN's
 * `TenderEvaluationIntro`: four stat tiles, the AI Compliance Engine note and
 * "Start Evaluation" behind a "Start the AI evaluation?" confirm.
 *
 * `invited` = bidders linked to the tender; `ready` = those with a submission
 * on record (the ingestion bidder list) — the ones extraction runs against.
 */
export function TenderEvaluationIntro({ tender, invited, ready, mustCount, wantCount, isStarting, onStart }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const hasEligibleBidders = ready > 0

  const stats = [
    { icon: Users, label: 'Invited Bidders', value: invited },
    { icon: UserCheck, label: 'Ready to Evaluate', value: ready },
    { icon: ShieldCheck, label: 'Mandatory checks', value: mustCount },
    { icon: ClipboardCheck, label: 'Optional checks', value: wantCount },
  ]

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 shadow-sm shadow-black/[0.03] sm:px-10 sm:py-10">
      <div
        className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-7 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0089cf] to-[#1b4c6f] text-white shadow-lg shadow-[#0089cf]/30">
          <ScanSearch size={32} />
        </span>

        <div className="space-y-2.5">
          <Badge variant="tech_eval">Technical Evaluation</Badge>
          <h2 className="break-words text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl">{tender.title}</h2>
          <p className="text-sm text-slate-500">{tender.department} · Deadline: {tender.deadline || '—'}</p>
        </div>

        <dl className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-4">
              <stat.icon size={16} className="mx-auto mb-2 text-[var(--color-primary)]" />
              <dd className="text-2xl font-extrabold tabular-nums text-slate-800">{stat.value}</dd>
              <dt className="mt-0.5 text-xs text-slate-500">{stat.label}</dt>
            </div>
          ))}
        </dl>

        {invited === 0 && (
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
            <p className="font-semibold">No bidders have been invited to this tender yet</p>
            <p className="mt-0.5">Bidders appear here once the Contract Engineer links them to the tender at Bid Ingestion.</p>
          </div>
        )}

        <div className="w-full max-w-md rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-5 py-4 text-left">
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles size={15} className="text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#1b4c6f]">AI Compliance Engine</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-500">
            Starting the evaluation parses every bidder submission, extracts the compliance documents and builds the
            evaluation matrix. Progress is shown while the run completes.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="px-8"
            disabled={isStarting || !hasEligibleBidders}
            title={hasEligibleBidders ? undefined : 'No bidder is ready for evaluation yet'}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Zap size={15} /> Start Evaluation
          </Button>
          {!hasEligibleBidders && (
            <p className="text-xs text-slate-500">
              Each bidder needs a submitted, indexed technical document before an evaluation can start.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        icon={Sparkles}
        title="Start the AI evaluation?"
        description="The AI Compliance Engine will analyse every bidder submission. This screen is disabled until the run finishes."
        confirmLabel="Confirm"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { setIsConfirmOpen(false); onStart() }}
      />
    </section>
  )
}
