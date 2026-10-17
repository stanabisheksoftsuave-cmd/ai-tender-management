import { useState } from 'react'
import {
  AlertTriangle, ArrowRight, Bell, CheckCircle2, ChevronDown, Clock, FileText, Lock, RefreshCw, RotateCcw, Send,
} from 'lucide-react'
import Button from '../ui/Button'
import { ComplianceSummaryTiles, EligibilityBanner } from './ComplianceSummary'
import { CriteriaGrid } from './CriteriaGrid'
import { StatusPicker } from './StatusPicker'
import { SourceProofModal } from './SourceProofModal'
import { ConfirmDialog, ReasonDialog } from './Dialogs'
import { STATUS_CFG, complianceView } from './model'
import { openBidderDocument } from '../../utils/techEvalReport'
import { cn } from '../../utils/cn'

/**
 * Compliance Review — the tab the AI run hands over to (MAIN's
 * `ComplianceReview`). Each bidder row shows its Must/Want counts, View Doc,
 * "Re-run AI extraction" (anything not Compliant), the status chip with the
 * "Set compliance status" override (reason required) and, expanded, every
 * criterion's verdict with its source proof, the Contract Engineer
 * correction request and the evaluator's notes.
 *
 * A bidder notified for a re-upload stays on the board, flagged "Awaiting
 * Contract Engineer re-upload" (§8.B.10), rather than vanishing from it.
 */
export function ComplianceReview({
  bidders, criteria, state, statusOf, tenderLabel, pendingIds, canEdit, isBusy, userName,
  scoringLocked, statusCounts, eligibleCount,
  onSetOverride, onClearOverride, onNotify, onRerun, onAddNote, onContinue,
}) {
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [proof, setProof] = useState(null)
  const [overrideTarget, setOverrideTarget] = useState(null)
  const [rerunTarget, setRerunTarget] = useState(null)

  const helperText = scoringLocked
    ? 'Set every Partial Compliant bidder to Compliant or Non-Compliant to unlock scoring.'
    : 'Compliance gates met. Continue to the weighted scoring matrix.'

  return (
    <>
      <ComplianceSummaryTiles
        total={bidders.length}
        compliant={statusCounts.compliant}
        partial={statusCounts.partial_compliant}
        nonCompliant={statusCounts.non_compliant}
      />
      <EligibilityBanner eligibleCount={eligibleCount} partialCount={statusCounts.partial_compliant} totalCount={bidders.length} />

      <div className="space-y-3">
        {bidders.map(bidder => {
          const view = complianceView(state, bidder, criteria)
          const status = statusOf(bidder)
          const isOpen = expanded === bidder.key
          const panelId = `bidder-panel-${bidder.key}`
          const missing = { mandatory: view.mandatory.filter(m => !m.present), optional: view.optional.filter(m => !m.present) }
          const missingCount = missing.mandatory.length + missing.optional.length
          const canNotify = status !== 'compliant'
          const isNotified = pendingIds.has(bidder.key)
          const override = state.compliance?.[bidder.key]
          const counts = { mandatory: view.mandatory.filter(m => m.present).length, optional: view.optional.filter(m => m.present).length }
          const notes = state.notes?.[bidder.key] || []

          return (
            <article key={bidder.key} className={cn('rounded-2xl border bg-white shadow-sm transition-shadow',
              isOpen ? 'border-[var(--color-primary)]/40 shadow-md ring-2 ring-[var(--color-primary)]/10' : 'border-slate-200 hover:border-slate-300')}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setExpanded(isOpen ? null : bidder.key)}
                  className="flex min-w-0 flex-1 basis-64 items-center gap-3 rounded-xl text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]" aria-hidden="true">
                    {bidder.name[0]}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 break-words text-sm font-semibold text-slate-800">{bidder.name}</span>
                      {bidder.country && <span className="text-xs text-slate-400">{bidder.country}</span>}
                      {isNotified && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-300">
                          <Clock size={9} /> Awaiting Contract Engineer re-upload
                        </span>
                      )}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        counts.mandatory === view.mandatory.length ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200')}>
                        {counts.mandatory}/{view.mandatory.length} Mandatory
                      </span>
                      <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        counts.optional === view.optional.length ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200')}>
                        {counts.optional}/{view.optional.length} Optional
                      </span>
                    </span>
                  </span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openBidderDocument(bidder, view, status, tenderLabel)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                  >
                    <FileText size={13} /> View Doc<span className="sr-only"> for {bidder.name}</span>
                  </button>
                  {canEdit && status !== 'compliant' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setRerunTarget(bidder)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw size={13} /> Re-run AI extraction<span className="sr-only"> for {bidder.name}</span>
                    </button>
                  )}
                  <StatusPicker
                    bidderName={bidder.name}
                    status={status}
                    disabled={!canEdit}
                    hasOverride={!!override}
                    onSelect={(next) => setOverrideTarget({ bidder, status: next })}
                    onReset={() => onClearOverride(bidder)}
                  />
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setExpanded(isOpen ? null : bidder.key)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div id={panelId} className="border-t border-slate-100">
                  {override && (
                    <div className="p-4 pb-0">
                      <p className="flex items-start gap-1.5 text-xs font-medium text-slate-500">
                        <RotateCcw size={12} className="mt-0.5 shrink-0" />
                        Status manually set by evaluator, overriding the AI-derived result: &ldquo;{override.reason}&rdquo;
                      </p>
                    </div>
                  )}

                  <CriteriaGrid view={view} onViewProof={(metric) => setProof({ metric, bidderName: bidder.name })} />

                  {canNotify && (
                    <div className="px-4 pb-4">
                      <div className={cn('flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                        isNotified ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/60')}>
                        <div className="flex items-center gap-2.5 text-xs">
                          {isNotified ? (
                            <>
                              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                              <span className="text-slate-500">Correction request sent to the Contract Engineer. Awaiting re-upload.</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={15} className="shrink-0 text-amber-500" />
                              <span className="font-medium text-slate-700">{missingCount} document{missingCount !== 1 ? 's' : ''} require vendor attention.</span>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isNotified || !canEdit}
                          onClick={() => { if (!pendingIds.has(bidder.key)) onNotify(bidder, missing) }}
                          className={cn('inline-flex min-h-8 items-center gap-1.5 whitespace-normal rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors sm:whitespace-nowrap disabled:cursor-not-allowed',
                            isNotified ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50')}
                        >
                          {isNotified ? <RotateCcw size={13} /> : <Bell size={13} />}
                          {isNotified ? 'Notified' : 'Notify Contract Engineer to Re-upload'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="px-4 pb-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
                        <FileText size={13} className="text-[var(--color-primary)]" />
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Evaluator Notes</span>
                      </div>
                      {notes.length > 0 && (
                        <ul className="max-h-40 space-y-2 overflow-y-auto px-4 py-3">
                          {notes.map(note => (
                            <li key={note.id} className="rounded-xl border border-slate-200 px-3 py-2">
                              <p className="break-words text-xs leading-relaxed text-slate-700">{note.text}</p>
                              <p className="mt-1 text-xs text-slate-400">{note.by || userName || 'Evaluator'} · {note.timestamp}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-end">
                        <label className="sr-only" htmlFor={`notes-${bidder.key}`}>Evaluation note for {bidder.name}</label>
                        <textarea
                          id={`notes-${bidder.key}`}
                          rows={2}
                          value={drafts[bidder.key] ?? ''}
                          disabled={!canEdit}
                          onChange={(e) => setDrafts(prev => ({ ...prev, [bidder.key]: e.target.value }))}
                          placeholder="Write your evaluation notes, suggestions, or re-upload requirements…"
                          className="olng-input min-h-16 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <Button
                          type="button"
                          variant="brand"
                          size="sm"
                          disabled={!canEdit || !drafts[bidder.key]?.trim()}
                          onClick={() => {
                            const text = drafts[bidder.key]?.trim()
                            if (!text) return
                            onAddNote(bidder, text)
                            setDrafts(prev => ({ ...prev, [bidder.key]: '' }))
                          }}
                        >
                          <Send size={13} /> Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="-mx-4 -mb-4 flex flex-wrap items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6">
        {scoringLocked && <p id="scoring-locked-hint" className="text-xs text-slate-500">{helperText}</p>}
        <Button
          type="button"
          variant="brand"
          size="sm"
          disabled={scoringLocked}
          title={helperText}
          aria-describedby={scoringLocked ? 'scoring-locked-hint' : undefined}
          onClick={onContinue}
        >
          {scoringLocked && <Lock size={13} />} Technical Scoring {!scoringLocked && <ArrowRight size={13} />}
        </Button>
      </div>

      <SourceProofModal metric={proof?.metric} bidderName={proof?.bidderName} onClose={() => setProof(null)} />

      <ConfirmDialog
        isOpen={rerunTarget !== null}
        icon={RefreshCw}
        title={rerunTarget ? `Re-run AI extraction for ${rerunTarget.name}?` : 'Re-run AI extraction'}
        description="The AI re-reads this bidder's current documents and scores its criteria again. Other bidders are not affected."
        confirmLabel="Re-run"
        onConfirm={() => { const b = rerunTarget; setRerunTarget(null); if (b) onRerun(b) }}
        onClose={() => setRerunTarget(null)}
      />

      {overrideTarget && (
        <ReasonDialog
          key={`${overrideTarget.bidder.key}-${overrideTarget.status}`}
          isOpen
          title={`Set ${overrideTarget.bidder.name} to ${STATUS_CFG[overrideTarget.status].label}?`}
          description="This overrides the AI-derived result and is authoritative. A Non-Compliant override excludes this bidder from ranking when the evaluation is completed."
          reasonLabel="Reason"
          reasonHint="Required - recorded with the override."
          confirmLabel="Set Status"
          onConfirm={(reason) => { onSetOverride(overrideTarget.bidder, overrideTarget.status, reason); setOverrideTarget(null) }}
          onClose={() => setOverrideTarget(null)}
        />
      )}
    </>
  )
}
