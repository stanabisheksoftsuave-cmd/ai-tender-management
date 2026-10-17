import { useState } from 'react'
import { ArrowRight, Award, Bot, CheckCircle, ChevronRight, Download, FileText, RotateCcw, UploadCloud, UserCheck, XCircle } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import SearchableSelect from '../ui/SearchableSelect'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { exportFinancialFailReasonPdf } from '../../utils/pqqExports'
import { cn } from '../../utils/cn'
import { StageHeading, ShellFooter } from './PrequalShell'
import { PqqAlert, PqqButton, ReasonDialog, ReasonPopupLink } from './PqqUi'
import { patchBidderIn } from './useTenderPatcher'
import {
  FINANCIAL_SHEET, PQQ_LONG_TEXT_MAX_LENGTH, PQQ_TEXT_LIMIT_MESSAGE, generateAiStage4, markLabel, stage4Overall,
} from './pqqModel'

function AssignedTeamCard({ assignedCes }) {
  const label = assignedCes.map(u => u.name).filter(Boolean).join(', ')
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-[#0089cf]/10 text-[#0089cf]" aria-hidden="true">
        <UserCheck size={15} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Team</span>
        <span className="block text-[11px] text-slate-400">Runs the financial assessment</span>
      </span>
      {label ? (
        <span className="ml-auto inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-3 pl-1">
          <span className="flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-[#0089cf] text-[11px] font-bold text-white" aria-hidden="true">
            {label.trim().charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 text-sm font-semibold break-words text-slate-700">{label}</span>
        </span>
      ) : (
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Not assigned on the CIF
        </span>
      )}
    </div>
  )
}

/*
 * The financial criteria grid. Editable for the Contract Engineer (Pass/Fail
 * with a required reason on Fail, Reset to the AI mark); read-only for the
 * Contract Holder once the assessment has been returned.
 */
function FinancialMatrix({ tender, bidders, canEdit, onSetMark, onReset, onRequestReupload }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white pb-2">
      <table className="w-full min-w-max border-collapse text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-80 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Criteria</th>
            {bidders.map(bidder => {
              const overall = stage4Overall(bidder)
              return (
                <th key={bidder.id} className="border-b border-l border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-1 flex flex-wrap items-center justify-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800">{bidder.name}</span>
                      {overall === 'pass' && <Badge variant="success"><CheckCircle size={10} /> Pass</Badge>}
                      {overall === 'fail' && <Badge variant="error"><XCircle size={10} /> Fail</Badge>}
                    </div>
                    {overall === 'fail' && (
                      <>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onRequestReupload(bidder.id)}
                            className="mt-1 w-full rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 transition-colors hover:bg-amber-100"
                          >
                            Reupload Bidder Documents
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => exportFinancialFailReasonPdf(tender, bidder)}
                          className="mt-1 mb-1 flex w-full items-center justify-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          <Download size={10} /> Export Reason
                        </button>
                      </>
                    )}
                    <span className="text-[10px] font-normal text-slate-400">{[bidder.country, bidder.category].filter(Boolean).join(' · ')}</span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={bidders.length + 1} className="sticky left-0 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
              {FINANCIAL_SHEET.label}
            </td>
          </tr>
          {FINANCIAL_SHEET.criteria.map(c => (
            <tr key={c.id} className="group border-b border-slate-100 transition-colors hover:bg-slate-50">
              <td className="sticky left-0 z-10 border-r border-slate-100 bg-white p-3 group-hover:bg-slate-50">
                <p className="text-xs font-medium text-slate-700">{c.item}</p>
                <p className="mt-0.5 w-72 whitespace-normal text-[10px] text-slate-400">{c.detail}</p>
              </td>
              {bidders.map(bidder => {
                const mark = bidder.stage4Marks?.financial?.[c.id]
                const aiMark = bidder.stage4Ai?.financial?.[c.id]
                const overridden = aiMark != null && mark !== aiMark
                const reason = bidder.stage4Reasons?.financial?.[c.id]
                return (
                  <td key={bidder.id} className="border-l border-slate-100 p-3 text-center align-top">
                    <div className="flex flex-col items-center gap-1.5">
                      {canEdit ? (
                        <div className="flex shrink-0 justify-center gap-1.5">
                          {['pass', 'fail'].map(v => (
                            <button
                              key={v}
                              type="button"
                              aria-pressed={mark === v}
                              onClick={() => onSetMark(bidder, c, v)}
                              className={cn(
                                'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-all',
                                mark === v
                                  ? v === 'pass' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300' : 'border-red-300 bg-red-50 text-red-700 ring-1 ring-red-300'
                                  : v === 'pass' ? 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300' : 'border-slate-200 bg-white text-slate-500 hover:border-red-300',
                              )}
                            >
                              {markLabel(v)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={cn('text-sm font-semibold', mark === 'pass' ? 'text-emerald-700' : mark === 'fail' ? 'text-red-700' : 'text-slate-400')}>
                          {mark ? markLabel(mark) : 'Not yet evaluated'}
                        </span>
                      )}
                      {canEdit && overridden ? (
                        <button type="button" onClick={() => onReset(bidder.id, c.id)} className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700">
                          <RotateCcw size={9} /> Reset
                        </button>
                      ) : !overridden && aiMark != null ? (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400"><Bot size={9} /> AI suggested</span>
                      ) : null}
                      {mark === 'fail' && <ReasonPopupLink subject={`${c.item} for ${bidder.name}`} reason={reason} />}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/*
 * Stage 4 — Financial Assessment. The Contract Engineer owns it (upload each
 * bidder's statements → AI marks → override → Return to Contract Holder); the
 * Contract Holder only looks in (MAIN Stage4Financial's `!canAssess` view) and
 * moves on with "Continue to Final Review" once the CE has handed it back.
 */
export function Stage4Financial({ tender, patch, isCE, assignedCes, isComplete, onReturnToHolder, onContinue }) {
  const [processingId, setProcessingId] = useState(null)
  const [processingPhase, setProcessingPhase] = useState(null)
  const [selectedIdRaw, setSelectedIdRaw] = useState(null)
  const [finalizing, setFinalizing] = useState(false)
  const [reasonTarget, setReasonTarget] = useState(null)

  useAiLockWhile(processingId != null, 'AI assessing financial criteria')

  const all = tender.prequalBidders || []
  const active = all.filter(b => !b.droppedAt)
  const pending = active.filter(b => !b.financialUploaded && String(b.id) !== String(processingId))
  const selectedId = pending.some(b => String(b.id) === String(selectedIdRaw)) ? String(selectedIdRaw) : (pending[0] ? String(pending[0].id) : null)
  const assessed = active.filter(b => b.financialUploaded)
  const allAssessed = active.length > 0 && active.every(b => b.financialUploaded && stage4Overall(b))
  const passers = active.filter(b => stage4Overall(b) === 'pass')

  const patchBidder = (bidderId, fn) => patch(t => ({ prequalBidders: patchBidderIn(t.prequalBidders, bidderId, fn) }))

  const handleFile = (bidderId, file) => {
    if (!file || bidderId == null) return
    setProcessingId(bidderId)
    setProcessingPhase('upload')
    setTimeout(() => {
      setProcessingPhase('ai')
      setTimeout(() => {
        const ai = generateAiStage4()
        patchBidder(bidderId, {
          financialUploaded: true,
          financialFileName: file.name,
          stage4Marks: ai.marks,
          stage4Ai: ai.marks,
          stage4Reasons: ai.reasons,
          stage4AiReasons: ai.reasons,
          financialReuploadRequested: false,
        })
        setProcessingId(null)
        setProcessingPhase(null)
      }, 1100)
    }, 700)
  }

  const writeMark = (bidderId, criterionId, value, reason) => {
    patchBidder(bidderId, b => ({
      stage4Marks: { financial: { ...(b.stage4Marks?.financial || {}), [criterionId]: value } },
      stage4Reasons: { financial: { ...(b.stage4Reasons?.financial || {}), [criterionId]: value === 'fail' ? reason : undefined } },
    }))
  }

  const setMark = (bidder, criterion, value) => {
    if (value === 'fail') {
      setReasonTarget({ bidderId: bidder.id, bidderName: bidder.name, criterionId: criterion.id, criterionLabel: criterion.item })
      return
    }
    writeMark(bidder.id, criterion.id, value)
  }

  const resetMark = (bidderId, criterionId) => {
    patchBidder(bidderId, b => {
      if (!b.stage4Ai) return {}
      const ai = b.stage4Ai.financial?.[criterionId]
      return {
        stage4Marks: { financial: { ...(b.stage4Marks?.financial || {}), [criterionId]: ai } },
        stage4Reasons: { financial: { ...(b.stage4Reasons?.financial || {}), [criterionId]: ai === 'fail' ? b.stage4AiReasons?.financial?.[criterionId] : undefined } },
      }
    })
  }

  const requestReupload = (bidderId) => patchBidder(bidderId, {
    financialUploaded: false,
    financialReuploadRequested: true,
    stage4Marks: { financial: {} },
    stage4Reasons: { financial: {} },
  })

  return (
    <>
      <StageHeading>Stage 4 - Financial Assessment</StageHeading>

      <div className="space-y-6 px-4 pt-5 pb-6 sm:px-6">
        {!isCE ? (
          <>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <FileText size={18} className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">With the Contract Engineer</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Financial assessment is the Contract Engineer&apos;s to run, criteria and all — uploading statements and
                  marking criteria are not yours to do, and the matrix stays hidden here until they&apos;re finished.
                </p>
              </div>
            </div>
            <AssignedTeamCard assignedCes={assignedCes} />
            <div className={cn('flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6', !isComplete && 'opacity-60')}>
              <UserCheck size={18} className={cn('mt-0.5 shrink-0', isComplete ? 'text-emerald-600' : 'text-slate-400')} aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Financial Assessment Complete</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isComplete
                    ? 'Every bidder has a verdict — check the matrix below, then use "Continue to Final Review" to move on.'
                    : 'Waiting on the Contract Engineer to finish every bidder’s criteria and verdict — "Continue to Final Review" stays disabled until then.'}
                </p>
              </div>
            </div>
            {isComplete && assessed.length > 0 ? (
              <FinancialMatrix tender={tender} bidders={assessed} canEdit={false} />
            ) : null}
          </>
        ) : (
          <>
            <PqqAlert tone="info" title="Financial assessment assigned to you">
              Assess each qualified bidder, then return the pre-qualification document to the Contract Holder.
            </PqqAlert>

            {pending.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <UploadCloud size={14} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-semibold text-slate-800">Upload Financial Statement</h3>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-48 flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Bidder</label>
                    <SearchableSelect
                      value={selectedId ?? ''}
                      onChange={v => setSelectedIdRaw(String(v))}
                      options={pending}
                      getValue={b => String(b.id)}
                      getLabel={b => `${b.name}${b.financialReuploadRequested ? ' (Awaiting Re-upload)' : ''}`}
                      getSubLabel={b => [b.country, b.category].filter(Boolean).join(' · ')}
                      disabled={processingId != null}
                      placeholder="Select bidder…"
                      searchPlaceholder="Search bidders…"
                      emptyText="No matching bidders"
                      ariaLabel="Bidder"
                    />
                  </div>
                  <label
                    className={cn('flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity', (processingId != null || selectedId == null) && 'pointer-events-none opacity-50')}
                    style={{ background: 'var(--color-primary)' }}
                  >
                    <UploadCloud size={13} /> Upload Statement
                    <input type="file" className="hidden" onChange={e => { handleFile(selectedId, e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                </div>
                {processingId != null && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <Bot size={12} className="animate-pulse" />
                    {processingPhase === 'upload' ? 'Uploading financial statement…' : 'AI assessing financial criteria…'}
                  </div>
                )}
              </div>
            )}

            {assessed.length > 0 && (
              <FinancialMatrix
                tender={tender}
                bidders={assessed}
                canEdit
                onSetMark={setMark}
                onReset={resetMark}
                onRequestReupload={requestReupload}
              />
            )}

            <div className={cn('rounded-2xl border border-slate-200 bg-white p-4 transition-opacity', !allAssessed && 'opacity-60')}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Award size={14} className="text-[var(--color-primary)]" /> Financial Assessment Complete</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {!allAssessed
                      ? "Upload every bidder's financial statement and mark all criteria before finalising."
                      : `${passers.length} of ${active.length} bidders passed the financial assessment. The Contract Holder decides the final shortlist from both results.`}
                  </p>
                </div>
                <Button disabled={!allAssessed || finalizing} onClick={() => { setFinalizing(true); onReturnToHolder() }}>
                  {finalizing ? 'Processing…' : 'Return to Contract Holder'}
                  {!finalizing && <ChevronRight size={14} />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {!isCE ? (
        <ShellFooter>
          {!isComplete ? <p className="text-xs text-slate-400">The Contract Engineer has not finished the financial assessment yet.</p> : null}
          <PqqButton variant="primary" disabled={!isComplete} onClick={onContinue}>
            Continue to Final Review <ArrowRight size={14} aria-hidden="true" />
          </PqqButton>
        </ShellFooter>
      ) : null}

      {reasonTarget ? (
        <ReasonDialog
          key={`${reasonTarget.bidderId}-${reasonTarget.criterionId}`}
          isOpen
          title={`Reason for marking "${reasonTarget.criterionLabel}" as Fail`}
          description={`This marks ${reasonTarget.bidderName}'s financial statements as "Fail" for this criterion.`}
          reasonLabel="Reason for this mark"
          reasonHint="Required — stored on the audit trail alongside the AI's own mark."
          confirmLabel="Save mark"
          maxLength={PQQ_LONG_TEXT_MAX_LENGTH}
          limitMessage={PQQ_TEXT_LIMIT_MESSAGE}
          onConfirm={reason => { writeMark(reasonTarget.bidderId, reasonTarget.criterionId, 'fail', reason); setReasonTarget(null) }}
          onClose={() => setReasonTarget(null)}
        />
      ) : null}
    </>
  )
}
