import { Fragment, useRef, useState } from 'react'
import {
  AlertTriangle, Bot, CheckCircle2, Clock, Download, FileText, RotateCcw, Save, Send, Upload, User, XCircle,
} from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { ReasonDialog } from './Dialogs'
import { ScoreRationaleModal } from './ScoreRationaleModal'
import {
  CLARIFY_AT_OR_BELOW, INTERIM_STEP_LABEL, MAX_REUPLOAD_BYTES,
  belowBandFor, evidenceFor, failureRowsFor, formatPassMark, formatPercent, hasAnyScore, hseBanding,
  isFullyScored, mustFailures, partTotalFor, rawScore, scoreKey, totalFor, weightedFor,
} from './model'
import { openEvaluationReport, openFailReasonDocument } from '../../utils/techEvalReport'
import { cn } from '../../utils/cn'

const STICKY = 'sticky left-0 border-r border-slate-100'
const HEAD = 'px-2 py-3 text-center text-xs font-semibold text-slate-500'

/**
 * Technical Scoring — the Appendix I weighted matrix (MAIN's
 * `TechnicalScoring`). Rows are the matrix criteria grouped by part, one
 * column per eligible bidder. Every cell starts as the AI's calculated score
 * (Bot badge until a human reviews it); changing it to anything other than
 * the calculated score opens "Override calculated score", which needs a
 * rationale. Totals, part subtotals, QHSE banding and Pass/Fail are all
 * derived from the final scores, so a saved change moves everything at once.
 */
export function TechnicalScoring({
  parts, criteria, bidders, eligible, state, scores, passingScore, passIsDefault,
  submitted, canEdit, interim, isApprovingAll, draftSaved, evaluationMode,
  tenderLabel, tenderTitle, tenderDepartment, resultFor, showToast,
  onSetScore, onApproveAll, onInterimUpload, onSubmit, onSaveDraft,
}) {
  const [pendingValues, setPendingValues] = useState({})
  const [reasonTarget, setReasonTarget] = useState(null)
  const [rationale, setRationale] = useState(null)
  const fileInputs = useRef({})

  const uploads = state.uploads || {}
  const clearPending = (key) => setPendingValues(prev => { const next = { ...prev }; delete next[key]; return next })

  const scoredFailedIds = eligible
    .filter(b => isFullyScored(scores, b.key, criteria) &&
      (resultFor(b.key) === 'FAIL' || belowBandFor(scores, b.key, criteria).length > 0))
    .map(b => b.key)
  const reEvaluatingIds = interim ? [interim.bidderKey] : []
  const interimIds = new Set([...scoredFailedIds, ...reEvaluatingIds])
  const mustFailingIds = new Set(eligible.filter(b => mustFailures(scores, b.key, criteria).length > 0).map(b => b.key))

  const setScore = (bidder, criterion, value) => {
    const key = scoreKey(bidder.key, criterion.id)
    const entry = state.scores?.[key]
    if (!entry) return
    if (value === '') { setPendingValues(prev => ({ ...prev, [key]: '' })); return }
    const finalScore = Number(value)
    // Reject, never coerce: a typed 7 or 2.5 is not saved as something else.
    if (!Number.isInteger(finalScore) || finalScore < 0 || finalScore > 3) return
    if (finalScore === entry.final) { clearPending(key); return }
    setPendingValues(prev => ({ ...prev, [key]: finalScore }))
    // FR-8.8 — a score that departs from the calculated one needs a rationale.
    if (finalScore !== entry.calc) { setReasonTarget({ bidder, criterion, entry, finalScore }); return }
    onSetScore(bidder, criterion, finalScore, null)
    clearPending(key)
  }

  const allExcluded = bidders.length > 0 && eligible.length === 0
  const allScored = allExcluded || (eligible.length > 0 && eligible.every(b => isFullyScored(scores, b.key, criteria)))
  const interimCount = interimIds.size
  const canSubmit = allScored && canEdit && !isApprovingAll && !interim
  const columnCount = 4 + eligible.length

  return (
    <>
      <Card className="isolate overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Evaluation Model</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Score 0–3 per criterion (0 No info · 1 · 2 · 3 Best). Weighted contribution = (score ÷ 3) × weight; the total is a
              percentage of the maximum weighted score.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {passIsDefault && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <AlertTriangle size={11} /> Pass score not set in Contract Strategy
              </span>
            )}
            <p className="text-xs text-slate-700">
              Overall pass ≥ <strong className="font-semibold">{passingScore}%</strong>{passIsDefault ? ' (default)' : ''}
            </p>
            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={!canEdit || isApprovingAll || submitted}
              title="Calculated scores applied. Review and adjust individual scores below if needed before submitting."
              onClick={onApproveAll}
            >
              {isApprovingAll ? 'Approving…' : 'Approve calculated scores'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className={cn(STICKY, 'z-20 min-w-40 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-500 sm:min-w-56')}>Criterion</th>
                <th className={cn(HEAD, 'hidden w-16 sm:table-cell')}>Type</th>
                <th className={cn(HEAD, 'hidden w-14 sm:table-cell')}>Weight</th>
                <th className={cn(HEAD, 'hidden w-12 sm:table-cell')}>Min</th>
                {eligible.map(bidder => {
                  const key = bidder.key
                  const reEvaluating = interim?.bidderKey === key
                  const wasRescored = !!uploads[key] && !reEvaluating
                  const failing = !reEvaluating && interimIds.has(key)
                  const canInterimUpload = !reEvaluating && (failing || mustFailingIds.has(key))
                  const stillFailing = canInterimUpload && wasRescored
                  const resolved = wasRescored && !failing && !canInterimUpload
                  return (
                    <th key={key} className={cn(HEAD, 'min-w-32')}>
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-1 flex flex-wrap items-center justify-center gap-1.5">
                          <span>{bidder.name}</span>
                          {failing && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                              <XCircle size={10} /> Fail
                            </span>
                          )}
                        </div>
                        {reEvaluating && (
                          <span className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-2 py-0.5 text-[11px] font-semibold normal-case text-[var(--color-primary)]">
                            <RotateCcw size={10} className="shrink-0 animate-spin" />
                            <span className="truncate">{INTERIM_STEP_LABEL[interim.phase]}</span>
                          </span>
                        )}
                        {canInterimUpload && !submitted && (
                          <>
                            {stillFailing && (
                              <span className="mt-1 block text-[11px] font-semibold normal-case leading-tight text-red-600">Re-evaluated — still not resolved</span>
                            )}
                            <button
                              type="button"
                              disabled={!canEdit || interim !== null}
                              title={!canEdit ? 'You do not have permission to upload documents for this evaluation.'
                                : interim !== null ? 'Another corrected document is still being uploaded or re-scored.' : undefined}
                              onClick={() => fileInputs.current[key]?.click()}
                              className="mt-1 w-full rounded-md border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-2 py-1 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reupload Bidders Documents
                            </button>
                            <input
                              ref={(el) => { fileInputs.current[key] = el }}
                              type="file"
                              accept=".pdf,.docx"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                event.target.value = ''
                                if (!file) return
                                if (!/\.(pdf|docx)$/i.test(file.name)) {
                                  showToast({ tone: 'danger', message: `${file.name} is not a .pdf or .docx document.` })
                                  return
                                }
                                if (file.size > MAX_REUPLOAD_BYTES) {
                                  showToast({ tone: 'danger', message: `${file.name} is larger than the 20 MB upload limit.` })
                                  return
                                }
                                onInterimUpload(key, file)
                              }}
                            />
                          </>
                        )}
                        {failing && (
                          <button
                            type="button"
                            onClick={() => openFailReasonDocument(bidder, {
                              tenderRef: tenderLabel,
                              tenderTitle,
                              total: totalFor(scores, key, criteria),
                              passingScore,
                              result: resultFor(key),
                              threshold: CLARIFY_AT_OR_BELOW,
                              failures: failureRowsFor(scores, key, criteria),
                            })}
                            className="mb-1 mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-[var(--color-primary)]/30 bg-white px-2 py-1 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/5"
                          >
                            <Upload size={10} /> Export Reason
                          </button>
                        )}
                        {resolved && (
                          <span title={uploads[key] ? `Re-evaluated · ${uploads[key]}` : 'Re-evaluated'}
                            className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold normal-case text-emerald-700">
                            <CheckCircle2 size={10} className="shrink-0" /> Resolved
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {parts.map(part => (
                <Fragment key={part.id}>
                  <tr className="bg-slate-50/70">
                    <td colSpan={columnCount} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <div className="sticky left-4 w-max max-w-[calc(100vw-6rem)]">
                        {part.title} <span className="font-semibold text-slate-400">· section weight {part.sectionWeight}</span>
                      </div>
                    </td>
                  </tr>

                  {part.criteria.map(criterion => (
                    <tr key={criterion.id} className="align-top">
                      <td className={cn(STICKY, 'z-10 bg-white px-4 py-3')}>
                        <p className="text-xs font-semibold text-slate-800">{criterion.criterion}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 sm:hidden">
                          <span className={cn('rounded-full border px-2 py-0.5 font-semibold',
                            criterion.type === 'Must' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-100 text-slate-500')}>
                            {criterion.type}
                          </span>
                          <span>{criterion.weight}% weight</span>
                          {criterion.minScore != null && <span>min {criterion.minScore}</span>}
                        </p>
                        {criterion.detail && <p className="mt-0.5 max-w-xs whitespace-normal text-[11px] text-slate-400">{criterion.detail}</p>}
                      </td>
                      <td className="hidden px-2 py-3 text-center sm:table-cell">
                        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                          criterion.type === 'Must' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-100 text-slate-500')}>
                          {criterion.type}
                        </span>
                      </td>
                      <td className="hidden px-2 py-3 text-center sm:table-cell">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{criterion.weight}%</span>
                      </td>
                      <td className="hidden px-2 py-3 text-center text-xs text-slate-500 sm:table-cell">{criterion.minScore ?? '—'}</td>

                      {eligible.map(bidder => {
                        const key = scoreKey(bidder.key, criterion.id)
                        const entry = state.scores?.[key]
                        const pending = pendingValues[key]
                        const value = pending ?? scores[key]
                        const hasValue = value !== undefined && value !== ''
                        const belowMin = criterion.type === 'Must' && criterion.minScore != null && hasValue && Number(value) < criterion.minScore
                        const needsClarify = hasValue && !belowMin && Number(value) <= CLARIFY_AT_OR_BELOW
                        const isAiValue = hasValue && pending === undefined && entry && !entry.reviewed
                        const isOverridden = entry?.overridden === true
                        const overrideReason = entry?.reason ?? null
                        const isLocked = !canEdit || !entry || isApprovingAll || submitted || interim?.bidderKey === bidder.key
                        return (
                          <td key={bidder.key} className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="relative">
                                <input
                                  type="number" min={0} max={3} step={1}
                                  value={value ?? ''}
                                  placeholder="—"
                                  disabled={isLocked}
                                  aria-label={`${bidder.name} — ${criterion.criterion} score`}
                                  title={hasValue ? criterion.bands?.[Number(value)] || undefined : undefined}
                                  onChange={(e) => setScore(bidder, criterion, e.target.value)}
                                  onBlur={() => { if (pending === '') clearPending(key) }}
                                  className={cn('h-8 w-12 rounded-lg text-center text-sm font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:cursor-not-allowed',
                                    belowMin ? 'border-2 border-red-300 bg-red-50'
                                      : needsClarify ? 'border-2 border-amber-300 bg-amber-50'
                                        : isAiValue ? 'border-2 border-blue-300 bg-blue-50/40'
                                          : 'border border-slate-200')}
                                />
                                {isAiValue && !belowMin && !needsClarify && !isOverridden && (
                                  <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white"><Bot size={8} /></div>
                                )}
                                {isOverridden && (
                                  <div title="Overridden by the evaluator, with a reason on file"
                                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                                    <User size={8} />
                                  </div>
                                )}
                              </div>
                              {hasValue && (
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span className="font-semibold tabular-nums">
                                    {weightedFor(scores, bidder.key, criterion).toFixed(1)}<span className="font-normal text-slate-300">/{criterion.weight}</span>
                                  </span>
                                  <button
                                    type="button"
                                    title={isOverridden ? "Show the evaluator's reason and the AI's original justification" : 'Show the AI justification for this score'}
                                    onClick={() => setRationale({
                                      kind: 'score',
                                      bidderName: bidder.name,
                                      criterion: criterion.criterion,
                                      criterionType: criterion.type,
                                      score: Number(value),
                                      weight: criterion.weight,
                                      band: criterion.bands?.[Number(value)],
                                      minScore: criterion.minScore,
                                      evidence: entry ? evidenceFor(bidder, criterion, entry.calc) : null,
                                      isOverridden,
                                      overrideReason,
                                    })}
                                    className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                                  >
                                    <FileText size={10} /> {isOverridden ? 'Reason' : 'Rationale'}
                                  </button>
                                </div>
                              )}
                              {belowMin && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">Below min</span>}
                              {needsClarify && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">Clarification</span>}
                              {overrideReason && (
                                <div title={overrideReason} className="w-full max-w-28 rounded border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-1 text-left">
                                  <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]"><User size={8} /> Reason</span>
                                  <p className="line-clamp-2 text-[11px] leading-tight text-slate-700">{overrideReason}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  <tr className="border-t border-slate-100 bg-white">
                    <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-2 text-[11px] font-semibold uppercase text-slate-500">
                      {part.title} subtotal <span className="text-slate-400">/ {part.sectionWeight} pts</span>
                    </td>
                    <td colSpan={3} className="hidden sm:table-cell" />
                    {eligible.map(bidder => (
                      <td key={bidder.key} className="px-3 py-2 text-center text-sm font-semibold text-slate-700">
                        {partTotalFor(scores, bidder.key, part.id, criteria).toFixed(1)}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t border-slate-100">
                <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-2 text-[11px] font-semibold uppercase text-slate-500">Contractor QHSE Banding</td>
                <td colSpan={3} className="hidden sm:table-cell" />
                {eligible.map(bidder => {
                  const band = hseBanding(scores, bidder.key, criteria)
                  const cls = band === 'Green' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : band === 'Amber' ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : band === 'Red' ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                  return (
                    <td key={bidder.key} className="px-3 py-2 text-center">
                      <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-bold', cls)}>{band}</span>
                    </td>
                  )
                })}
              </tr>
              <tr className="border-t-2 border-slate-200 bg-white">
                <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-3 text-xs font-bold uppercase text-slate-700">
                  Total Weighted Score <span className="text-slate-400">/ 100</span>
                </td>
                <td colSpan={3} className="hidden sm:table-cell" />
                {eligible.map(bidder => {
                  const total = totalFor(scores, bidder.key, criteria)
                  return (
                    <td key={bidder.key} className="px-3 py-3 text-center">
                      {hasAnyScore(scores, bidder.key, criteria)
                        ? <span className={cn('text-lg font-bold', total >= passingScore ? 'text-emerald-600' : 'text-amber-600')}>{total.toFixed(2)}</span>
                        : <span className="text-xs text-slate-300">—</span>}
                    </td>
                  )
                })}
              </tr>
              <tr className="bg-white">
                <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-3 text-xs font-bold uppercase text-slate-700">
                  Result{' '}
                  <span className="font-medium normal-case text-slate-400">
                    (all Musts ≥ min · total ≥ {passingScore}% · every criterion above {CLARIFY_AT_OR_BELOW} to skip clarification)
                  </span>
                </td>
                <td colSpan={3} className="hidden sm:table-cell" />
                {eligible.map(bidder => {
                  if (!isFullyScored(scores, bidder.key, criteria)) {
                    return <td key={bidder.key} className="px-3 py-3 text-center"><span className="text-xs text-slate-300">—</span></td>
                  }
                  const total = totalFor(scores, bidder.key, criteria)
                  const result = resultFor(bidder.key)
                  const fails = mustFailures(scores, bidder.key, criteria)
                  const failIds = new Set(fails.map(c => c.id))
                  const underBand = belowBandFor(scores, bidder.key, criteria).filter(c => !failIds.has(c.id))
                  return (
                    <td key={bidder.key} className="px-3 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                        result === 'PASS' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700')}>
                        {result === 'PASS' ? <><CheckCircle2 size={10} /> Pass</> : <><XCircle size={10} /> Fail</>}
                      </span>
                      {result === 'FAIL' && fails.length > 0 && <p className="mt-1 text-[11px] text-red-600">Must below min: {fails.length}</p>}
                      {result === 'FAIL' && fails.length === 0 && total < passingScore && (
                        <p className="mt-1 text-[11px] text-red-600">Total {formatPercent(total)} is below the pass mark {formatPassMark(passingScore)}</p>
                      )}
                      {underBand.length > 0 && (
                        <p className="mt-1 text-[11px] text-amber-600">
                          {underBand.length} {underBand.length === 1 ? 'criterion' : 'criteria'} at or below {CLARIFY_AT_OR_BELOW} — clarification required
                        </p>
                      )}
                      {result === 'FAIL' && (
                        <button
                          type="button"
                          title="Show why this bidder failed"
                          onClick={() => setRationale({
                            kind: 'fail',
                            bidderName: bidder.name,
                            total,
                            passingScore,
                            fails: fails.map(c => ({
                              criterion: c.criterion,
                              score: rawScore(scores, bidder.key, c.id),
                              minScore: c.minScore,
                              band: c.bands?.[rawScore(scores, bidder.key, c.id)],
                            })),
                          })}
                          className="mx-auto mt-1 flex items-center gap-0.5 text-[11px] font-semibold text-red-600 underline-offset-2 hover:underline"
                        >
                          <FileText size={9} /> Fail reasoning
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {!submitted ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800">Finalise Technical Evaluation</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {allExcluded
                  ? 'Every bidder was set Non-Compliant at compliance, so there is nothing to score. Approve the calculated scores, then submit to record the exclusions and complete the evaluation.'
                  : !allScored && interimCount === 0
                    ? `Score all ${eligible.length} eligible bidder${eligible.length !== 1 ? 's' : ''} across all ${criteria.length} criteria.`
                    : interimCount > 0
                      ? `${interimCount} bidder${interimCount !== 1 ? 's' : ''} failed or need clarification — they will be listed as excluded when you submit.`
                      : `All criteria scored and every criterion is above the clarification threshold (${CLARIFY_AT_OR_BELOW}). Submit to generate the evaluation report.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {draftSaved && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 size={12} /> Draft saved</span>
              )}
              <Button type="button" variant="secondary" size="sm" disabled={!canEdit} onClick={onSaveDraft}>
                <Save size={13} /> Save as Draft
              </Button>
              <Button type="button" variant="brand" size="sm" disabled={!canSubmit} onClick={onSubmit}>
                <Send size={13} /> Submit &amp; Export Report
              </Button>
            </div>
          </div>
          {interimCount > 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle size={12} className="shrink-0" />
              <span>
                {interimCount} bidder{interimCount !== 1 ? 's' : ''} failed or carry a criterion at or below {CLARIFY_AT_OR_BELOW}. Submitting lists them as
                <strong className="mx-1">excluded</strong>; raise a clarification first if a corrected document could change that.
              </span>
            </div>
          ) : !allScored && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle size={12} className="shrink-0" />
              <span>Score all {eligible.length} eligible bidder{eligible.length !== 1 ? 's' : ''} across all {criteria.length} criteria before submitting.</span>
            </div>
          )}
        </Card>
      ) : (
        <Card className="space-y-3 p-5">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Technical Evaluation Submitted</p>
              <p className="mt-0.5 text-xs text-emerald-700">The scores are recorded on the tender. Download the report for your records.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <Clock size={13} className="shrink-0" />
            {evaluationMode === 'parallel'
              ? <span>Parallel evaluation — the tender moves to the <strong className="mx-1">SCM Award Gate</strong> once the Contract Engineer also submits the commercial side.</span>
              : <span>Tender is now with <strong className="mx-1">Supply Chain — Technical Gate</strong>, which releases Commercial Evaluation on approval.</span>}
          </div>
          <Button
            type="button"
            variant="brand"
            size="sm"
            className="w-full justify-center"
            onClick={() => openEvaluationReport({
              tenderRef: tenderLabel,
              tenderTitle,
              department: tenderDepartment,
              bidders: eligible,
              scores,
              passingScore,
              criteria,
              resultFor,
            })}
          >
            <Download size={13} /> Download Evaluation Report
          </Button>
        </Card>
      )}

      <ScoreRationaleModal rationale={rationale} onClose={() => setRationale(null)} />

      {reasonTarget && (
        <ReasonDialog
          key={`${reasonTarget.bidder.key}-${reasonTarget.criterion.id}-${reasonTarget.finalScore}`}
          isOpen
          title="Override calculated score"
          description={`${reasonTarget.bidder.name} · ${reasonTarget.criterion.criterion}: calculated ${reasonTarget.entry.calc}, new score ${reasonTarget.finalScore}.`}
          reasonLabel="Rationale"
          confirmLabel="Save override"
          onConfirm={(reason) => {
            const t = reasonTarget
            setReasonTarget(null)
            onSetScore(t.bidder, t.criterion, t.finalScore, reason)
            clearPending(scoreKey(t.bidder.key, t.criterion.id))
          }}
          onClose={() => {
            clearPending(scoreKey(reasonTarget.bidder.key, reasonTarget.criterion.id))
            setReasonTarget(null)
          }}
        />
      )}
    </>
  )
}
