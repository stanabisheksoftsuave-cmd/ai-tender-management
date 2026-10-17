import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Download, Lock, RotateCcw } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import AiAnalysisLoader from '../ui/AiAnalysisLoader'
import { useAuth } from '../../context/AuthContext'
import { useTenders } from '../../context/TenderContext'
import { useBackHandler, useNavigation } from '../../context/NavigationContext'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { useHomePath } from '../../utils/permissions'
import { tenderRef } from '../../utils/tenderRef'
import { openEvaluationReport } from '../../utils/techEvalReport'
import { TenderEvaluationIntro } from './TenderEvaluationIntro'
import { EvaluationHeaderCard } from './EvaluationHeaderCard'
import { ComplianceReview } from './ComplianceReview'
import { TechnicalScoring } from './TechnicalScoring'
import { ToastStack } from './Dialogs'
import { useStepRun, useToasts } from './hooks'
import {
  AI_STEPS, RE_EXTRACT_STEPS, belowBandFor, buildCriteria, effectiveStatus, emptyEvalState,
  evaluationBidders, extractScores, finalScoreMap, isBeforeTech, isOpenForTech, passFail, passThreshold,
  readEvalState, scmReturnFor, scoreKey, totalFor,
} from './model'

const RUN_LABEL = 'AI Compliance Engine Running'
const UPLOAD_MS = 900
const RESCORE_MS = 1800

/** Steps → the loader's `{ id, label, status }` rows. */
const loaderSteps = (steps, step) => steps.map((task, i) => ({
  id: task, label: task, status: i < step ? 'complete' : i === step ? 'active' : 'pending',
}))

/**
 * Drives one tender's ITT technical evaluation — MAIN's
 * `TechnicalEvaluationFlow`: stage guards, the SCM-return banner, the intro
 * with "Start the AI evaluation?", the AI Compliance Engine loader (holding the
 * app-wide AI lock) and the Compliance Review | Technical Scoring tabs.
 *
 * Everything the evaluator does is written straight onto the tender
 * (`techEvalState`) — MAIN persists each decision server-side — so a reload,
 * a draft or an SCM return resumes exactly where it was left.
 */
export function TechEvalFlow({ tender }) {
  const navigate = useNavigate()
  const { goBack } = useNavigation()
  const { user } = useAuth()
  const home = useHomePath()
  const { updateTender, advanceTender, submitParallelEval } = useTenders()
  const { toasts, showToast, dismissToast } = useToasts()
  const { run, start } = useStepRun()

  const [activeTab, setActiveTab] = useState('compliance')
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [interim, setInterim] = useState(null) // { bidderKey, phase }
  const [isApprovingAll, setIsApprovingAll] = useState(false)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // The latest tender for timer callbacks; patched in place after every write
  // so two writes in one tick never read the same stale snapshot.
  const latest = useRef(tender)
  useEffect(() => { latest.current = tender })

  const { parts, criteria } = buildCriteria(tender)
  const bidders = evaluationBidders(tender)
  const { passingScore, isDefault: passIsDefault } = passThreshold(tender)
  const state = readEvalState(tender, criteria)
  const started = !!state?.extractedAt
  const scores = finalScoreMap(state)
  const isOpen = isOpenForTech(tender)
  const canEdit = isOpen && !justSubmitted
  const scmReturn = justSubmitted ? null : scmReturnFor(tender)

  const requests = tender.correctionRequests || []
  const pendingIds = new Set(requests.filter(r => !r.resolved).map(r => String(r.bidderId)))
  const needsReExtract = started && !run
    ? bidders.filter(b => requests.some(r => String(r.bidderId) === b.key && r.resolved && !r.reExtracted))
    : []

  useAiLockWhile(!!run || !!interim, run?.meta?.kind === 'reextract' ? 'Re-extracting updated documents' : RUN_LABEL)

  // Shared Back unwinds the Scoring tab before it leaves the page.
  // While an AI run holds the lock, Back is swallowed rather than abandoning it.
  useBackHandler(() => {
    if (run || interim) return true
    if (activeTab === 'scoring') { setActiveTab('compliance'); return true }
    return false
  }, [activeTab, run, interim])

  /** Writes the evaluation state (and any extra tender fields) in one update. */
  const patch = (fn, extra) => {
    const t = latest.current
    const prev = readEvalState(t, criteria) || emptyEvalState(criteria)
    const next = fn(prev)
    const changes = { techEvalState: next, ...(extra ? extra(t, next) : {}) }
    latest.current = { ...t, ...changes }
    updateTender(t.id, changes)
  }

  const rescore = (prev, list, rounds) => ({
    ...prev,
    rounds,
    scores: { ...prev.scores, ...extractScores(list, criteria, rounds) },
  })

  // ── AI runs ────────────────────────────────────────────────────────────
  const handleStart = () => {
    updateTender(tender.id, { evalProgress: 'in_progress' })
    start({
      total: AI_STEPS.length, interval: 520, hold: 700, meta: { kind: 'start' },
      onDone: () => patch(
        prev => ({ ...rescore(prev, bidders, prev.rounds || {}), extractedAt: new Date().toISOString() }),
        () => ({ extractedBidderIds: bidders.map(b => b.id), evalProgress: 'in_progress' }),
      ),
    })
  }

  const handleRerun = (bidder) => {
    start({
      total: AI_STEPS.length, interval: 420, hold: 900, meta: { kind: 'rerun', names: [bidder.name] },
      onDone: () => patch(prev => rescore(prev, [bidder], prev.rounds || {})),
    })
  }

  const startReExtract = (list) => {
    if (!list.length) return
    start({
      total: RE_EXTRACT_STEPS.length, interval: 600, hold: 800, meta: { kind: 'reextract', names: list.map(b => b.name) },
      onDone: () => {
        const ids = new Set(list.map(b => b.key))
        patch(
          prev => {
            const rounds = { ...(prev.rounds || {}) }
            list.forEach(b => { rounds[b.key] = (rounds[b.key] || 0) + 1 })
            const compliance = { ...(prev.compliance || {}) }
            list.forEach(b => { delete compliance[b.key] })
            return { ...rescore(prev, list, rounds), compliance }
          },
          t => ({
            correctionRequests: (t.correctionRequests || []).map(r =>
              ids.has(String(r.bidderId)) && r.resolved ? { ...r, reExtracted: true } : r),
            extractedBidderIds: [...new Set([...(t.extractedBidderIds || []), ...list.map(b => b.id)])],
          }),
        )
        setActiveTab('scoring') // re-upload done → straight to scoring (stays on compliance while locked)
      },
    })
  }

  // A Contract Engineer re-upload resolved (on arrival, or while the page is
  // open) → re-extract those bidders. Started from a timeout, never
  // synchronously in the effect.
  const reExtractKey = needsReExtract.map(b => b.key).join(',')
  useEffect(() => {
    if (!reExtractKey) return undefined
    const t = setTimeout(() => startReExtract(needsReExtract), 0)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reExtractKey])

  const handleInterimUpload = (bidderKey, file) => {
    const bidder = bidders.find(b => b.key === bidderKey)
    if (!bidder) return
    setInterim({ bidderKey, phase: 'uploading' })
    timers.current.push(setTimeout(() => setInterim({ bidderKey, phase: 'rescoring' }), UPLOAD_MS))
    timers.current.push(setTimeout(() => {
      patch(prev => {
        const rounds = { ...(prev.rounds || {}), [bidderKey]: ((prev.rounds || {})[bidderKey] || 0) + 1 }
        return { ...rescore(prev, [bidder], rounds), uploads: { ...(prev.uploads || {}), [bidderKey]: file.name } }
      })
      setInterim(null)
    }, UPLOAD_MS + RESCORE_MS))
  }

  // ── Compliance actions ─────────────────────────────────────────────────
  const statusOf = (bidder) => effectiveStatus(state, scores, bidder, criteria)
  const statuses = bidders.map(statusOf)
  const statusCounts = {
    compliant: statuses.filter(s => s === 'compliant').length,
    partial_compliant: statuses.filter(s => s === 'partial_compliant').length,
    non_compliant: statuses.filter(s => s === 'non_compliant').length,
  }
  const allFinalized = bidders.length > 0 && statuses.every(s => s === 'compliant' || s === 'non_compliant')
  const eligibleCount = statusCounts.compliant + statusCounts.partial_compliant
  const scoringLocked = !allFinalized && !justSubmitted
  const visibleTab = scoringLocked ? 'compliance' : activeTab
  const eligible = bidders.filter(b => statusOf(b) !== 'non_compliant')
  const mustCount = criteria.filter(c => c.type === 'Must').length

  const handleSetOverride = (bidder, status, reason) => patch(prev => ({
    ...prev,
    compliance: { ...(prev.compliance || {}), [bidder.key]: { status, reason, by: user?.name || 'Contract Holder', at: new Date().toISOString() } },
  }))
  const handleClearOverride = (bidder) => patch(prev => {
    const compliance = { ...(prev.compliance || {}) }
    delete compliance[bidder.key]
    return { ...prev, compliance }
  })
  const handleAddNote = (bidder, text) => patch(prev => {
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    const list = (prev.notes || {})[bidder.key] || []
    return { ...prev, notes: { ...(prev.notes || {}), [bidder.key]: [...list, { id: Date.now(), text, timestamp, by: user?.name }] } }
  })

  // TARGET's correction-request loop, MAIN's clarification copy: the request
  // lands on the Contract Engineer's Bid Ingestion screen.
  const handleNotify = (bidder, missing) => {
    const notifiedAt = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const missingDocs = [
      ...missing.mandatory.map(m => ({ id: m.id, name: m.name, docRef: m.docRef, docType: m.docType, kind: 'mandatory' })),
      ...missing.optional.map(m => ({ id: m.id, name: m.name, docRef: m.docRef, docType: m.docType, kind: 'optional' })),
    ]
    const notes = [
      missing.mandatory.length > 0 && `Mandatory: ${missing.mandatory.map(m => m.name).join('; ')}`,
      missing.optional.length > 0 && `Optional: ${missing.optional.map(m => m.name).join('; ')}`,
    ].filter(Boolean).join('\n')
    const existing = latest.current.correctionRequests || []
    const changes = {
      correctionRequests: [
        ...existing.filter(r => String(r.bidderId) !== bidder.key),
        {
          bidderId: bidder.id, bidderName: bidder.realName, missingDocs, notifiedAt, resolved: false,
          evaluatorName: user?.name || 'Technical Evaluator',
          subject: `${bidder.realName} - missing or deficient documents`, notes,
        },
      ],
    }
    latest.current = { ...latest.current, ...changes }
    updateTender(tender.id, changes)
    showToast({ tone: 'success', message: `Correction request sent to the Contract Engineer for ${bidder.name}.` })
  }

  // ── Scoring actions ────────────────────────────────────────────────────
  const resultFor = (bidderKey) => passFail(scores, bidderKey, passingScore, criteria)

  const handleSetScore = (bidder, criterion, finalScore, reason) => patch(prev => {
    const key = scoreKey(bidder.key, criterion.id)
    const entry = prev.scores?.[key]
    if (!entry) return prev
    const overridden = finalScore !== entry.calc
    return {
      ...prev,
      scores: { ...prev.scores, [key]: { ...entry, final: finalScore, reviewed: true, overridden, reason: overridden ? reason : null } },
    }
  })

  const handleApproveAll = () => {
    setIsApprovingAll(true)
    timers.current.push(setTimeout(() => {
      patch(prev => {
        const next = { ...prev.scores }
        Object.keys(next).forEach(k => { if (!next[k].reviewed) next[k] = { ...next[k], reviewed: true } })
        return { ...prev, scores: next }
      })
      setIsApprovingAll(false)
    }, 600))
  }

  const handleSaveDraft = () => {
    const snapshot = readEvalState(latest.current, criteria) || state
    const changes = {
      evalProgress: 'in_progress',
      techEvalDraft: { scores: finalScoreMap(snapshot), savedAt: new Date().toISOString(), state: snapshot },
    }
    latest.current = { ...latest.current, ...changes }
    updateTender(tender.id, changes)
    setDraftSaved(true)
    timers.current.push(setTimeout(() => setDraftSaved(false), 2500))
  }

  // Submit keeps the existing semantics: the scores reach the tender itself
  // (SCM gates and contract rank on bidderList.techScore); parallel tenders
  // converge on gate 2 via submitParallelEval, linear ones advance to gate 1.
  const handleSubmit = () => {
    const unreviewed = bidders.reduce((n, b) => n + criteria.filter(c => {
      const e = state?.scores?.[scoreKey(b.key, c.id)]
      return !e || !e.reviewed
    }).length, 0)
    if (unreviewed > 0) {
      showToast({
        tone: 'danger',
        message: `${unreviewed} ${unreviewed === 1 ? 'criterion still needs' : 'criteria still need'} to be extracted or scored before the evaluation can be completed.`,
      })
      return
    }
    const passing = eligible.filter(b => resultFor(b.key) === 'PASS' && belowBandFor(scores, b.key, criteria).length === 0)
    const passingKeys = new Set(passing.map(b => b.key))
    const ranked = passing
      .map(b => ({ bidderId: b.id, weightedScore: totalFor(scores, b.key, criteria).toFixed(2), label: statusOf(b) }))
      .sort((a, b) => Number(b.weightedScore) - Number(a.weightedScore))
    const submittedAt = new Date().toISOString()
    updateTender(tender.id, {
      bidderList: bidders.map(b => ({
        ...b.raw,
        techScore: Math.round(totalFor(scores, b.key, criteria)),
        techResult: passingKeys.has(b.key) ? 'PASS' : 'EXCLUDED',
      })),
      techEvalSubmittedAt: submittedAt,
      techEvalResult: {
        scores,
        overallPass: passingScore,
        submittedBy: user?.name || 'Contract Holder',
        submittedAt,
        ranked,
        excludedBidderIds: bidders.filter(b => !passingKeys.has(b.key)).map(b => b.id),
      },
      techEvalState: { ...(readEvalState(latest.current, criteria) || state), submittedAt },
    })
    if (tender.evaluationMode === 'parallel') submitParallelEval(tender.id, 'tech')
    else advanceTender(tender.id)
    setJustSubmitted(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────
  const breadcrumb = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={goBack} disabled={!!run || !!interim}
        className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50">
        <ArrowLeft size={12} /> Back
      </button>
      <span className="text-slate-300">/</span>
      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-400">{tenderRef(tender)}</span>
    </div>
  )

  if (isBeforeTech(tender)) {
    return (
      <div className="space-y-5">
        {breadcrumb}
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Technical evaluation is not ready yet</p>
            <p className="mt-0.5 text-xs text-amber-700">The evaluation matrix has not been frozen for this tender.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen && !justSubmitted) {
    const submittedState = readEvalState(tender, criteria)
    return (
      <div className="space-y-5">
        {breadcrumb}
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Lock size={20} /></span>
          <div>
            <p className="text-sm font-semibold text-slate-700">This tender is not open for technical evaluation.</p>
            <p className="mt-1 text-xs text-slate-400">
              {tender.techEvalSubmittedAt
                ? `The technical evaluation was submitted on ${new Date(tender.techEvalSubmittedAt).toLocaleString('en-GB')} — it re-opens here only if Supply Chain returns it.`
                : `Current stage: ${tender.stage || tender.status}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tender.techEvalSubmittedAt && submittedState && (
              <Button type="button" variant="brand" size="sm" onClick={() => {
                const s = finalScoreMap(submittedState)
                openEvaluationReport({
                  tenderRef: tenderRef(tender), tenderTitle: tender.title, department: tender.department,
                  bidders: bidders.filter(b => effectiveStatus(submittedState, s, b, criteria) !== 'non_compliant'),
                  scores: s, passingScore, criteria, resultFor: k => passFail(s, k, passingScore, criteria),
                })
              }}>
                <Download size={13} /> Download Evaluation Report
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate(home)}>
              <ArrowLeft size={13} /> Back to Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const returnBanner = scmReturn && (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5">
      <RotateCcw size={15} className="mt-0.5 shrink-0 text-amber-500" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          Returned by Supply Chain for re-evaluation
          <span className="ml-2 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">{scmReturn.gateLabel}</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-700">
          {scmReturn.comment ? `“${scmReturn.comment}”` : 'No comment was recorded with the return.'}
        </p>
        <p className="mt-1 text-xs text-amber-600">
          {scmReturn.at ? `Returned ${new Date(scmReturn.at).toLocaleString('en-GB')} · ` : ''}Revise the scores and submit the evaluation again.
        </p>
      </div>
    </div>
  )

  const intro = (
    <TenderEvaluationIntro
      tender={tender}
      invited={Math.max(Number(tender.bidders) || 0, bidders.length)}
      ready={bidders.length}
      mustCount={mustCount}
      wantCount={criteria.length - mustCount}
      isStarting={!!run}
      onStart={handleStart}
    />
  )

  const review = started && (
    <EvaluationHeaderCard
      title={tender.title}
      department={tender.department}
      deadline={tender.deadline}
      bidderCount={bidders.length}
      metricCount={criteria.length}
      mandatoryCount={mustCount}
      optionalCount={criteria.length - mustCount}
      notificationCount={pendingIds.size}
      activeTab={visibleTab}
      onTabChange={setActiveTab}
      eligibleCount={eligibleCount}
      scoringLocked={scoringLocked}
      onLockedTabClick={() => showToast({ tone: 'warning', message: 'Technical Scoring is locked until no bidder is left Partial Compliant.' })}
    >
      {visibleTab === 'scoring' ? (
        <TechnicalScoring
          parts={parts}
          criteria={criteria}
          bidders={bidders}
          eligible={eligible}
          state={state}
          scores={scores}
          passingScore={passingScore}
          passIsDefault={passIsDefault}
          submitted={justSubmitted}
          canEdit={canEdit && !run}
          interim={interim}
          isApprovingAll={isApprovingAll}
          draftSaved={draftSaved}
          evaluationMode={tender.evaluationMode}
          tenderLabel={tenderRef(tender)}
          tenderTitle={tender.title}
          tenderDepartment={tender.department}
          resultFor={resultFor}
          showToast={showToast}
          onSetScore={handleSetScore}
          onApproveAll={handleApproveAll}
          onInterimUpload={handleInterimUpload}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
      ) : (
        <ComplianceReview
          bidders={bidders}
          criteria={criteria}
          state={state}
          statusOf={statusOf}
          tenderLabel={tenderRef(tender)}
          pendingIds={pendingIds}
          canEdit={canEdit}
          isBusy={!!run || !!interim}
          userName={user?.name}
          scoringLocked={scoringLocked}
          statusCounts={statusCounts}
          eligibleCount={eligibleCount}
          onSetOverride={handleSetOverride}
          onClearOverride={handleClearOverride}
          onNotify={handleNotify}
          onRerun={handleRerun}
          onAddNote={handleAddNote}
          onContinue={() => setActiveTab('scoring')}
        />
      )}
    </EvaluationHeaderCard>
  )

  const behind = started ? review : intro

  let loader = null
  if (run) {
    const isReExtract = run.meta.kind === 'reextract'
    const steps = isReExtract ? RE_EXTRACT_STEPS : AI_STEPS
    const names = run.meta.names || []
    loader = (
      <AiAnalysisLoader
        className="max-w-md shadow-xl"
        title={isReExtract ? 'Re-Extracting Updated Documents' : RUN_LABEL}
        description={isReExtract
          ? `Processing re-uploaded documents for ${names.length} bidder${names.length !== 1 ? 's' : ''}`
          : run.meta.kind === 'rerun'
            ? `Re-analysing ${names.join(', ')} against ${criteria.length} compliance metrics`
            : `Analysing ${bidders.length} bidder submissions against ${criteria.length} compliance metrics`}
        progress={((run.step + 1) / steps.length) * 100}
        steps={loaderSteps(steps, run.step)}
        helperText={isReExtract && names.length ? `Re-processing: ${names.join(', ')}` : undefined}
      />
    )
  }

  return (
    <div className="space-y-5">
      {breadcrumb}
      {returnBanner}
      {loader ? (
        <div className="relative min-h-[70vh]" aria-busy="true">
          <div inert>{behind}</div>
          <div className="absolute inset-0 z-10 flex cursor-wait items-start justify-center rounded-2xl bg-white/70 px-4 pt-8 sm:pt-24">
            {loader}
          </div>
        </div>
      ) : behind}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
