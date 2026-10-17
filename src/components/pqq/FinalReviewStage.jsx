import { useState } from 'react'
import { ArrowLeft, Upload } from 'lucide-react'
import { exportPrequalEvaluationResultsXlsx, exportPrequalSummaryXlsx } from '../../utils/pqqExports'
import { cn } from '../../utils/cn'
import { StageHeading } from './PrequalShell'
import { ConfirmDialog, PqqAlert, PqqButton, Pill, ReasonPopupLink } from './PqqUi'
import { patchBidderIn } from './useTenderPatcher'
import {
  PQQ_LONG_TEXT_MAX_LENGTH, PQQ_TEXT_LIMIT_MESSAGE, computedOverall, financialVerdict, isAtTextLimit,
  overallVerdict, qualificationLabel, stage3Verdict, verdictTone,
} from './pqqModel'

const OVERRIDE_RATIONALE = 'AI suggestion confirmed'

const isHolderExcluded = b => b.droppedAt === 'holder_excluded'

function financialTone(value) {
  if (value === 'fail') return 'danger'
  if (value === 'pending') return 'neutral'
  if (value === 'pass') return 'success'
  return 'warning'
}

/*
 * Final Review (MAIN FinalReviewStage): the combined result per bidder —
 * Technical & QHSE, Financial, Qualification — with the Contract Holder's
 * Selected / Rejected decision, the two Excel exports, and the close-out
 * (Reject the round, or Submit Pre-Qualification).
 *
 * Excluded bidders stay in the table (Rejected filled red, disabled), so an
 * exclusion can be undone through Selected → Restore.
 */
export function FinalReviewStage({ tender, patch, userName, readOnly = false, onSubmit, onReject, onBackToTemplates }) {
  const [activeAction, setActiveAction] = useState(null) // { type: 'exclude'|'override'|'restore', bidderId }
  const [excludeRationale, setExcludeRationale] = useState('')
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false)
  const [exportError, setExportError] = useState(null)

  const all = tender.prequalBidders || []
  const rows = all.filter(b => !b.droppedAt || isHolderExcluded(b) || (readOnly && b.droppedAt === 'not_qualified'))
  const qualified = rows.filter(b => !isHolderExcluded(b) && !b.droppedAt && overallVerdict(tender, b) === 'pass')
  const target = activeAction ? all.find(b => String(b.id) === String(activeAction.bidderId)) : null

  const patchBidder = (bidderId, fn) => patch(t => ({ prequalBidders: patchBidderIn(t.prequalBidders, bidderId, fn) }))
  const closeAction = () => { setActiveAction(null); setExcludeRationale('') }

  const commitOverride = () => {
    if (!target) return
    patchBidder(target.id, b => ({
      pqOverallOverride: {
        value: 'pass',
        computedValue: computedOverall(tender, b),
        rationale: OVERRIDE_RATIONALE,
        by: userName,
        at: new Date().toISOString(),
      },
    }))
    closeAction()
  }

  const handleExclude = () => {
    const rationale = excludeRationale.trim()
    if (!target || !rationale) return
    patchBidder(target.id, { droppedAt: 'holder_excluded', pqExcludeRationale: rationale, pqExcludedBy: userName })
    closeAction()
  }

  const handleRestore = () => {
    if (!target) return
    patchBidder(target.id, { droppedAt: undefined, pqExcludeRationale: undefined, pqExcludedBy: undefined, pqOverallOverride: undefined })
    closeAction()
  }

  const runExport = (fn, label) => {
    setExportError(null)
    try { fn(tender) } catch (err) { setExportError(`Could not download the ${label}. ${err?.message || ''}`.trim()) }
  }

  return (
    <>
      <StageHeading>Final Review</StageHeading>
      <div className="space-y-6 px-4 pt-5 pb-6 sm:px-6">
        <p className="max-w-4xl text-sm leading-relaxed text-slate-500">
          The combined pre-qualification result for every bidder still in review — the technical and QHSE marks alongside
          the financial verdict.
        </p>

        {readOnly ? (
          <PqqAlert tone="info" title="This run is already submitted">
            Pre-qualification has already been submitted for this tender. This run is locked, so it cannot be submitted or rejected again.
          </PqqAlert>
        ) : null}

        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">No bidder responses are in review yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-max border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="border-b border-slate-200 bg-slate-50 p-3">Bidder</th>
                  <th scope="col" className="border-b border-slate-200 bg-slate-50 p-3">Technical &amp; QHSE</th>
                  <th scope="col" className="border-b border-slate-200 bg-slate-50 p-3">Financial</th>
                  <th scope="col" className="border-b border-slate-200 bg-slate-50 p-3">Qualification</th>
                  {!readOnly ? <th scope="col" className="border-b border-slate-200 bg-slate-50 p-3">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map(b => {
                  const isExcluded = isHolderExcluded(b)
                  const overall = overallVerdict(tender, b)
                  const isSelected = !isExcluded && overall === 'pass'
                  const isRejected = isExcluded || overall === 'fail'
                  const fin = financialVerdict(tender, b)
                  const s3 = stage3Verdict(b)
                  return (
                    <tr key={b.id} className="border-b border-slate-100 last:border-b-0">
                      <th scope="row" className="p-3 text-sm font-medium text-slate-800">
                        {b.name}
                        <span className="block text-[10px] font-normal text-slate-400">{[b.country, b.category].filter(Boolean).join(' · ')}</span>
                      </th>
                      <td className="p-3"><Pill tone={verdictTone(s3)}>{s3}</Pill></td>
                      <td className="p-3 text-sm">
                        {fin === null ? <span className="text-slate-400">Not assessed</span> : <Pill tone={financialTone(fin)}>{fin}</Pill>}
                      </td>
                      <td className="p-3 text-sm font-semibold text-slate-800">
                        <span className="flex flex-col gap-1">
                          {isExcluded ? 'Rejected' : qualificationLabel(overall)}
                          {isExcluded ? <span className="text-xs font-normal text-slate-400">Excluded by the Contract Holder</span> : null}
                          {b.pqOverallOverride ? (
                            <span className="flex flex-wrap items-center gap-x-2 text-xs font-normal text-slate-400">
                              <span>{`Overridden from ${b.pqOverallOverride.computedValue}`}</span>
                              <ReasonPopupLink subject={`${b.name} qualification`} reason={b.pqOverallOverride.rationale} />
                            </span>
                          ) : null}
                        </span>
                      </td>
                      {!readOnly ? (
                        <td className="p-3">
                          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              aria-label={`Mark ${b.name} as selected`}
                              onClick={() => setActiveAction({ type: isExcluded ? 'restore' : 'override', bidderId: b.id })}
                              className={cn(
                                'px-3 py-1.5 text-[11px] font-semibold transition-colors',
                                isSelected ? 'bg-[#0089cf] text-white' : 'bg-white text-slate-500 hover:bg-[#0089cf]/5 hover:text-[#0089cf]',
                              )}
                            >
                              Selected
                            </button>
                            <button
                              type="button"
                              aria-pressed={isRejected}
                              aria-label={`Mark ${b.name} as rejected`}
                              disabled={isExcluded}
                              onClick={() => { setExcludeRationale(''); setActiveAction({ type: 'exclude', bidderId: b.id }) }}
                              className={cn(
                                'border-l border-slate-200 px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed',
                                isRejected ? 'bg-red-600 text-white disabled:opacity-100' : 'bg-white text-red-600 hover:bg-red-50',
                              )}
                            >
                              Rejected
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!readOnly && activeAction?.type === 'exclude' && target ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h3 className="text-sm font-bold break-words text-slate-800">{`Exclude ${target.name}`}</h3>
            <div>
              <label htmlFor="pqq-exclude-rationale" className="mb-1 block text-xs font-medium text-slate-600">
                Rationale for excluding this bidder <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <textarea
                id="pqq-exclude-rationale"
                rows={3}
                required
                maxLength={PQQ_LONG_TEXT_MAX_LENGTH}
                value={excludeRationale}
                onChange={e => setExcludeRationale(e.target.value)}
                placeholder="e.g. Withdrew from the tender after Stage 3 closed."
                className="olng-input w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30"
              />
              {isAtTextLimit(excludeRationale, PQQ_LONG_TEXT_MAX_LENGTH) ? (
                <p className="mt-1 text-[11px] text-red-600">{PQQ_TEXT_LIMIT_MESSAGE}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <PqqButton variant="danger" disabled={excludeRationale.trim() === ''} onClick={handleExclude}>Confirm Exclude</PqqButton>
              <PqqButton variant="secondary" onClick={closeAction}>Cancel</PqqButton>
            </div>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <p className="text-sm text-slate-500">
              Qualification follows the overall verdict, which already accounts for each bidder&apos;s financial assessment.
            </p>
            {exportError ? <PqqAlert tone="danger">{exportError}</PqqAlert> : null}
            <div className="flex flex-wrap gap-3">
              <PqqButton variant="outline" onClick={() => runExport(exportPrequalEvaluationResultsXlsx, 'results')}>
                <Upload size={14} aria-hidden="true" /> Export Evaluation Results (.xlsx)
              </PqqButton>
              <PqqButton variant="outline" onClick={() => runExport(exportPrequalSummaryXlsx, 'summary')}>
                <Upload size={14} aria-hidden="true" /> Export Pre-Qual Summary (.xlsx)
              </PqqButton>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PqqButton variant="secondary" onClick={onBackToTemplates}>
                <ArrowLeft size={14} aria-hidden="true" /> Back to Strategy Templates
              </PqqButton>
              {!readOnly ? (
                <div className="flex flex-wrap items-center gap-3">
                  {qualified.length === 0 ? (
                    <span className="text-xs text-slate-400">No bidder is qualified — select at least one, or reject this round.</span>
                  ) : null}
                  <PqqButton variant="danger" onClick={() => setIsRejectConfirmOpen(true)}>Reject</PqqButton>
                  <PqqButton variant="primary" disabled={qualified.length === 0} onClick={() => onSubmit(qualified)}>
                    Submit Pre-Qualification
                  </PqqButton>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={isRejectConfirmOpen}
        title="Reject this pre-qualification round?"
        description="This round will be rejected and archived. The run stays on record — you can review it afterwards from the tender."
        confirmLabel="Reject"
        confirmVariant="danger"
        onConfirm={() => { setIsRejectConfirmOpen(false); onReject() }}
        onClose={() => setIsRejectConfirmOpen(false)}
      />

      {!readOnly && activeAction?.type === 'override' && target ? (
        <ConfirmDialog
          isOpen
          title={`Mark ${target.name} as selected?`}
          description={`${target.name} will be recorded as qualified, overriding the computed pre-qualification verdict. The change is recorded against your name.`}
          confirmLabel="Confirm Selection"
          onConfirm={commitOverride}
          onClose={closeAction}
        />
      ) : null}

      {!readOnly && activeAction?.type === 'restore' && target ? (
        <ConfirmDialog
          isOpen
          title={`Restore ${target.name}?`}
          description={`${target.name} was excluded at this review. Restoring undoes the exclusion and returns the bidder to their computed pre-qualification verdict.`}
          confirmLabel="Restore Bidder"
          onConfirm={handleRestore}
          onClose={closeAction}
        />
      ) : null}
    </>
  )
}
