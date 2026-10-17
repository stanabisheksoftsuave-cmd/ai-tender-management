import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Ban, ChevronRight, FileText, ShieldOff, Undo2, Users, Wallet } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/NavigationContext'
import { useAiLock } from '../context/aiLockStore'
import { useHomePath } from '../utils/permissions'
import { tenderRef } from '../utils/tenderRef'
import { PrequalShell, ShellFooter } from '../components/pqq/PrequalShell'
import { PqqButton } from '../components/pqq/PqqUi'
import { Stage1BidderMatching } from '../components/pqq/Stage1BidderMatching'
import { Stage2Questionnaire } from '../components/pqq/Stage2Questionnaire'
import { Stage3ResponseReview } from '../components/pqq/Stage3ResponseReview'
import { Stage4Financial } from '../components/pqq/Stage4Financial'
import { FinalReviewStage } from '../components/pqq/FinalReviewStage'
import { useTenderPatcher } from '../components/pqq/useTenderPatcher'
import {
  PREQUAL_STATUSES, STAGE_LABEL, STAGE_ORDER, STAGE_OWNER, bidderRowFromMatch, stage3Overall,
  stage4Overall, today,
} from '../components/pqq/pqqModel'

const REJECT_RATIONALE = 'Round rejected at final review by the Contract Holder'

// The stages this tender actually walks: Stage 4 only when a financial
// assessment was asked for (or has already happened).
function stageFlowFor(tender) {
  const hasStage4 = tender?.status === 'prequal_stage4'
    || Boolean(tender?.financialAssessmentCompletedAt)
    || (tender?.financialAssessmentRequired === true && tender?.status === 'prequal_final_review')
  return STAGE_ORDER.filter(s => s !== 'prequal_stage4' || hasStage4)
}

const FORWARD_LABEL = {
  prequal_stage2: 'Back to Questionnaire',
  prequal_stage3: 'Continue to Response Review',
  prequal_stage4: 'Continue to Financial Assessment',
  prequal_final_review: 'Continue to Final Review',
}

export default function PreQualification() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const home = useHomePath()
  const { tenders, updateTender } = useTenders()
  const { isGenerating: isAiRunning } = useAiLock()
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null
  const { patch, getLatest } = useTenderPatcher(tender, updateTender)

  // A look-back view of an earlier stage. Back never writes tender.status
  // (prototype bug §8.A-8): it only changes which stage is on screen, and the
  // forward buttons walk the view back up to where the tender really is.
  const [view, setView] = useState({ tenderId: null, status: null })

  const roleId = user?.role?.id
  // The Contract Engineer is here only for the financial assessment he owns.
  const isCE = roleId === 'pof'
  const userName = user?.name || (isCE ? 'Contract Engineer' : 'Contract Holder')

  // The Contract Engineer(s) who pick up the financial assessment are set once
  // at the Contract Initiating Form — read here, never re-assigned.
  const assignedCes = Array.isArray(tender?.assignedContractEngineers)
    ? tender.assignedContractEngineers
    : tender?.assignedContractEngineer ? [tender.assignedContractEngineer] : []

  const actual = tender?.status
  const flow = stageFlowFor(tender)
  const viewing = view.tenderId === tenderId ? view.status : null
  const displayed = viewing && flow.includes(viewing) && flow.indexOf(viewing) < flow.indexOf(actual) ? viewing : actual
  const isPast = displayed !== actual

  const setViewStatus = (status) => setView({ tenderId, status })

  // One stage back per press, down the same ladder the forward buttons walk
  // up. Returns false once there is nothing left to step back to, so the
  // route-level Back takes over. Never moves into a stage by writing status.
  const goBackOneStep = () => {
    if (isAiRunning) return true
    if (!tender || isCE) return false
    const i = flow.indexOf(displayed)
    if (i <= 0) return false
    setViewStatus(flow[i - 1])
    return true
  }
  useBackHandler(goBackOneStep)

  const stepForward = () => {
    const i = flow.indexOf(displayed)
    const next = flow[i + 1]
    setViewStatus(!next || next === actual ? null : next)
  }

  const leavePage = () => navigate(isCE ? '/pre-qualification' : `/strategy-templates/${tender?.id}`)
  const onShellBack = () => { if (!goBackOneStep()) leavePage() }

  if (roleId !== 'contract_holder' && !isCE) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Holders and Contract Engineers can access this page.</p>
    </div>
  )

  if (!tenderId) {
    if (isCE) {
      const assignments = tenders.filter(t =>
        t.status === 'prequal_stage4' || (PREQUAL_STATUSES.includes(t.status) && STAGE_OWNER[t.status] === 'pof'))
      return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="p-4 sm:p-5 flex items-start justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Wallet size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Financial Assessment</h2>
                <p className="text-xs text-slate-500 mt-0.5">Pre-qualification runs awaiting your financial assessment</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-medium tabular-nums">
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
            </span>
          </div>

          {/* List or Empty State */}
          <div className="p-4 sm:p-5">
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 p-6 text-center sm:p-10">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Wallet size={18} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-slate-800">No pre-qualifications awaiting your financial assessment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(item => {
                  const bidderCount = item.bidderCount ?? (item.prequalBidders?.length ?? 0)
                  const assessedCount = item.assessedCount ?? (item.prequalBidders?.filter(b => b.stage4?.result).length ?? 0)
                  const isReturned = Boolean(item.returnedToHolder || item.financialReturnedToHolderAt)

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/pre-qualification/${item.id}`)}
                      className="group block rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#0089cf]/40 hover:bg-[#0089cf]/[0.03] transition-all cursor-pointer shadow-none"
                    >
                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">{item.title}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide animate-pulse">
                              SUBMITTED
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Users className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
                              {assessedCount} of {bidderCount} bidder{bidderCount === 1 ? '' : 's'} assessed
                            </span>
                            {isReturned && (
                              <span className="flex items-center gap-1.5 text-slate-500">
                                <Undo2 className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
                                Returned to the Contract Holder - no further action needed unless it comes back.
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#0089cf]" aria-hidden="true" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer with Rows per page */}
          {assignments.length > 0 && (
            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select className="border border-slate-200 rounded px-2 py-0.5 bg-white text-slate-700 font-medium text-xs">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )
    }

    const list = tenders.filter(t => PREQUAL_STATUSES.includes(t.status))
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Pre-Qualification</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a tender to continue pre-qualification
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{list.length} tender{list.length !== 1 ? 's' : ''}</span>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FileText size={32} />
            <p className="text-sm font-medium">No tenders in pre-qualification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(td => (
              <Card key={td.id} className="p-4 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group"
                onClick={() => navigate(`/pre-qualification/${td.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(td)}</span>
                      <Badge variant={td.status}>{STAGE_LABEL[td.status] || td.stage}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{td.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{td.department || td.tenderType}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // A tender whose pre-qualification was submitted keeps a read-only summary
  // here rather than dead-ending (prototype bug §8.A-6).
  const isCompletedSummary = !isCE && tender && !PREQUAL_STATUSES.includes(tender.status)
    && (Boolean(tender.pqSubmittedAt) || ((tender.prequalBidders || []).length > 0 && tender.status !== 'cif_draft'))

  if (!tender || (!PREQUAL_STATUSES.includes(tender.status) && !isCompletedSummary)) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found or not in pre-qualification.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate(home)}>Back to Home</Button>
    </div>
  )

  const shell = (stageKey, content) => (
    <PrequalShell
      costCode={tender.costCode?.trim() || null}
      stageLabel={STAGE_LABEL[stageKey] || tender.stage}
      title={tender.title || 'Statement of Work'}
      department={tender.department || 'Services - IT'}
      onBack={onShellBack}
      isBackDisabled={isAiRunning}
    >
      {content}
    </PrequalShell>
  )

  const backToTemplates = () => navigate(`/strategy-templates/${tender.id}`)

  if (isCompletedSummary) {
    return (
      <div className="pb-12">
        {shell('completed', (
          <FinalReviewStage tender={tender} patch={patch} userName={userName} readOnly onBackToTemplates={backToTemplates} />
        ))}
      </div>
    )
  }

  // The Contract Engineer only ever works Stage 4.
  if (isCE && displayed !== 'prequal_stage4') {
    return (
      <div className="pb-12">
        {shell(displayed, (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center text-slate-400">
            <FileText size={28} />
            <p className="text-sm font-medium text-slate-600">This pre-qualification is with the Contract Holder.</p>
            <p className="text-xs">The financial assessment opens here once the Contract Holder submits Stage 3.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/pre-qualification')}>Back to Financial Assessment</Button>
          </div>
        ))}
      </div>
    )
  }

  // ── Transitions ────────────────────────────────────────────────────────────

  const confirmShortlist = () => {
    patch(t => {
      const picked = (t.pqMatches || []).filter(m => m.selected)
      const existing = new Map((t.prequalBidders || []).map(b => [String(b.id), b]))
      return {
        status: 'prequal_stage2',
        stage: STAGE_LABEL.prequal_stage2,
        prequalBidders: picked.map(m => existing.get(String(m.bidderId)) || bidderRowFromMatch(m)),
        pqShortlistConfirmedAt: new Date().toISOString(),
      }
    })
    setViewStatus(null)
  }

  const continueToResponseReview = () => {
    if (actual === 'prequal_stage2') {
      patch({ status: 'prequal_stage3', stage: STAGE_LABEL.prequal_stage3 })
      setViewStatus(null)
    } else {
      stepForward()
    }
  }

  const submitStage3 = (next) => {
    const submittedAt = new Date().toISOString()
    if (next === 'prequal_stage4') {
      // The document goes to whichever Contract Engineer(s) the CIF assigned.
      patch({
        status: 'prequal_stage4',
        stage: STAGE_LABEL.prequal_stage4,
        financialAssessmentRequired: true,
        financialAssessmentAssignedAt: today(),
        pqStage3SubmittedAt: submittedAt,
      })
    } else {
      patch({
        status: 'prequal_final_review',
        stage: STAGE_LABEL.prequal_final_review,
        financialAssessmentRequired: false,
        pqStage3SubmittedAt: submittedAt,
      })
    }
    setViewStatus(null)
  }

  // Contract Engineer finishes the financial assessment and returns the
  // document to the Contract Holder — both round results attached.
  const sendBackToHolder = () => {
    patch(t => ({
      status: 'prequal_final_review',
      stage: STAGE_LABEL.prequal_final_review,
      prequalBidders: (t.prequalBidders || []).map(b => (b.droppedAt ? b : {
        ...b,
        stage4: {
          result: stage4Overall(b) === 'pass' ? 'PASS' : 'FAIL',
          recommendation: `Technical/QHSE: ${stage3Overall(b) === 'pass' ? 'Pass' : 'Fail'} · Financial: ${stage4Overall(b) === 'pass' ? 'Pass' : 'Fail'}.`,
        },
      })),
      financialAssessmentCompletedBy: userName,
      financialAssessmentCompletedAt: today(),
    }))
    setTimeout(() => navigate('/pre-qualification'), 400)
  }

  // Qualified bidders carry forward; everyone else in review is dropped with
  // the reason they fell out, so every downstream `!droppedAt` reader sees the
  // final shortlist.
  const submitFinalReview = (qualified) => {
    const keep = new Set(qualified.map(b => String(b.id)))
    patch(t => ({
      status: 'draft',
      stage: 'Draft — Pending Export',
      prequalBidders: (t.prequalBidders || []).map(b => {
        if (keep.has(String(b.id))) return b
        return b.droppedAt ? b : { ...b, droppedAt: 'not_qualified' }
      }),
      bidderList: qualified.map(b => ({ id: b.id, name: b.name, country: b.country })),
      bidders: qualified.length,
      handoffDocuments: t.handoffDocuments || {},
      pqSubmittedAt: new Date().toISOString(),
      pqSubmittedBy: userName,
    }))
    navigate(`/strategy-templates/${tender.id}`)
  }

  const rejectRound = () => {
    patch({
      status: 'prequal_rejected',
      stage: STAGE_LABEL.prequal_rejected,
      pqRejectedAt: new Date().toISOString(),
      pqRejectRationale: REJECT_RATIONALE,
      pqRejectedBy: userName,
    })
    setViewStatus(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const nextLabel = (() => {
    const i = flow.indexOf(displayed)
    return FORWARD_LABEL[flow[i + 1]] || 'Continue'
  })()

  let content = null
  if (displayed === 'prequal_stage1') {
    content = (
      <Stage1BidderMatching
        key={`s1-${isPast}`}
        tender={tender}
        isLocked={isPast}
        patch={patch}
        onConfirmShortlist={confirmShortlist}
        footer={isPast ? (
          <PqqButton variant="secondary" onClick={stepForward}>
            {nextLabel} <ArrowRight size={14} aria-hidden="true" />
          </PqqButton>
        ) : null}
      />
    )
  } else if (displayed === 'prequal_stage2') {
    content = (
      <Stage2Questionnaire
        tender={tender}
        patch={patch}
        getLatest={getLatest}
        onContinue={continueToResponseReview}
        onBack={onShellBack}
      />
    )
  } else if (displayed === 'prequal_stage3') {
    content = (
      <Stage3ResponseReview
        tender={tender}
        patch={patch}
        assignedCes={assignedCes}
        userName={userName}
        isReadOnly={isPast}
        onSubmit={submitStage3}
        onContinue={stepForward}
        continueLabel={nextLabel}
      />
    )
  } else if (displayed === 'prequal_stage4') {
    content = (
      <Stage4Financial
        tender={tender}
        patch={patch}
        isCE={isCE}
        assignedCes={assignedCes}
        isComplete={actual === 'prequal_final_review' || Boolean(tender.financialAssessmentCompletedAt)}
        onReturnToHolder={sendBackToHolder}
        onContinue={stepForward}
      />
    )
  } else if (displayed === 'prequal_final_review') {
    content = (
      <FinalReviewStage
        tender={tender}
        patch={patch}
        userName={userName}
        onSubmit={submitFinalReview}
        onReject={rejectRound}
        onBackToTemplates={backToTemplates}
      />
    )
  } else if (displayed === 'prequal_rejected') {
    content = (
      <>
        <div className="px-6 py-10 text-center">
          <Ban size={28} className="mx-auto mb-2 text-red-500" />
          <h3 className="text-sm font-semibold text-slate-800">Pre-Qualification Rejected</h3>
          <p className="mt-1 text-xs text-slate-500">
            This round has been rejected and archived{tender.pqRejectedAt ? ` on ${tender.pqRejectedAt.split('T')[0]}` : ''}.
          </p>
        </div>
        <ShellFooter>
          <PqqButton variant="secondary" onClick={() => navigate('/tenders')}>Back to Tender List</PqqButton>
          <PqqButton variant="primary" onClick={backToTemplates}>Back to Strategy Templates</PqqButton>
        </ShellFooter>
      </>
    )
  }

  return <div className="pb-12">{shell(displayed, content)}</div>
}
