import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, ChevronRight, FileText, ShieldOff } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PsfUploadStage from '../components/psf/PsfUploadStage'
import PsfGenerationStage from '../components/psf/PsfGenerationStage'
import PsfReviewStage from '../components/psf/PsfReviewStage'
import {
  attachmentNames, buildPsf, isStrategyComplete, isTeamComplete, membersFor, normalisePsf,
  summariseTeam, todayKey,
} from '../components/psf/psfDocument'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/NavigationContext'
import { exportPsfDocx } from '../utils/psfExport'
import { TEMPLATE_DEFS } from './StrategyTemplatesDashboard'
import {
  PSF_STRATEGY_TEMPLATES, PSF_PREQUAL_DOCUMENT, PSF_SUPPORTING_DOCUMENTS, PSF_REVIEW_STEPS,
  PSF_TEAM_ROLES,
} from '../data/psfTemplate'
import { tenderRef } from '../utils/tenderRef'

/*
 * PSF Strategy — Procurement Submission Form (Strategy variant). A port of the
 * Next.js app's PSFStrategyPage: three stages behind one route —
 *   0. Upload Templates  (every upload optional, persisted on tender.psfUploads)
 *   1. AI Generation     (holds the app-wide AI lock)
 *   2. Review & Submit   (eight sub-steps; every edit persisted on tender.psfDocument)
 * Submitting marks the tender psfCompleted, which is what gates it into ITT
 * Creation; the submitted form is read-only with "Move Forward to ITT".
 */

const STAGE_LABELS = ['Upload Templates', 'AI Generation', 'Review & Submit']

export default function PsfStrategy() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user, users } = useAuth()
  const { tenders, updateTender } = useTenders()

  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  // 0 = upload templates, 1 = AI generation, 2 = review & submit. Always opens
  // on the upload stage, like the Next.js page; an already-generated PSF offers
  // "Continue to Review" there instead of regenerating.
  const [stage, setStage] = useState(0)
  const [reviewStep, setReviewStep] = useState(0)
  const [completedKeys, setCompletedKeys] = useState([])
  const [templatesOpen, setTemplatesOpen] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // A route-param change reuses this component — start the new tender afresh.
  const [shownTenderId, setShownTenderId] = useState(tenderId)
  if (shownTenderId !== tenderId) {
    setShownTenderId(tenderId)
    setStage(0)
    setReviewStep(0)
    setCompletedKeys([])
    setSubmitting(false)
  }

  useBackHandler(() => {
    if (stage === 2) {
      if (reviewStep > 0) { setReviewStep(s => s - 1); return true }
      if (!tender?.psfCompleted) { setStage(0); return true }
      return false
    }
    if (stage === 1) { setStage(0); return true }
    return false
  })

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Holders can prepare the PSF Strategy.</p>
    </div>
  )

  if (!tender) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found.</p>
      <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/tenders')}>Back to Tender List</Button>
    </div>
  )

  const uploads = tender.psfUploads || {}
  const psf = normalisePsf(tender.psfDocument, tender, uploads)
  const isSubmitted = !!tender.psfCompleted
  const readOnly = isSubmitted || submitting
  const strategyIncomplete = !isSubmitted && !isStrategyComplete(tender, TEMPLATE_DEFS)

  /* ── Upload stage ── */

  const templates = PSF_STRATEGY_TEMPLATES.map(t => {
    const def = TEMPLATE_DEFS.find(d => d.id === t.id)
    return { ...t, icon: def?.icon, summary: t.summary((def?.dataKey && tender[def.dataKey]?.length) || 0) }
  })
  const pqqCriteria = Array.isArray(tender.pqqCriteria)
    ? tender.pqqCriteria.filter(c => String(c?.text ?? c ?? '').trim()).length
    : 0
  const qualifiedCount = (tender.prequalBidders || []).filter(b => !b.droppedAt).length
  const prequalDoc = {
    ...PSF_PREQUAL_DOCUMENT,
    summary: pqqCriteria > 0
      ? `${pqqCriteria} criteria completed`
      : qualifiedCount > 0
        ? `${qualifiedCount} qualified bidder${qualifiedCount === 1 ? '' : 's'}`
        : 'No pre-qualification data',
  }

  const handleUpload = (slotId, file) => {
    if (!file) return
    updateTender(tender.id, {
      psfUploads: {
        ...uploads,
        [slotId]: { name: file.name, size: file.size, type: file.type || '', uploadedAt: todayKey() },
      },
    })
  }

  const removeUpload = (slotId) => {
    const next = { ...uploads }
    delete next[slotId]
    updateTender(tender.id, { psfUploads: next })
  }

  const openReview = () => {
    setReviewStep(0)
    setStage(2)
  }

  const handleGenerateClick = () => {
    if (psf) {
      // Already generated — never regenerate; just carry today's uploads into
      // the Attachments list of a form that is still editable.
      if (!isSubmitted) updateTender(tender.id, { psfDocument: { ...psf, attachments: attachmentNames(uploads) } })
      openReview()
      return
    }
    setStage(1)
  }

  const handleGenerationComplete = () => {
    updateTender(tender.id, { psfDocument: buildPsf(tender, uploads) })
    setCompletedKeys([])
    openReview()
  }

  /* ── Review stage ── */

  // One patch channel for the whole form; every edit is persisted at once.
  const handleDocumentChange = (patch) => {
    if (readOnly || !psf) return
    updateTender(tender.id, { psfDocument: { ...psf, ...patch } })
  }

  const selectReviewStep = (index) => {
    if (index === reviewStep || index < 0 || index >= PSF_REVIEW_STEPS.length) return
    const key = PSF_REVIEW_STEPS[reviewStep]?.key
    if (key && index > reviewStep) setCompletedKeys(prev => (prev.includes(key) ? prev : [...prev, key]))
    setReviewStep(index)
  }

  const rosters = Object.fromEntries(PSF_TEAM_ROLES.map(r => [
    r.role,
    (users || []).filter(u => u.roleId === r.roleId && u.status === 'active'),
  ]))
  const selectedTeam = Object.fromEntries(PSF_TEAM_ROLES.map(r => [r.role, membersFor(tender, r)[0]?.id ?? null]))
  const teamComplete = isTeamComplete(tender)
  const teamMembers = PSF_TEAM_ROLES.map(r => ({
    role: r.role,
    label: r.label,
    names: membersFor(tender, r).map(m => m?.name).filter(Boolean),
  }))
  const teamSummary = summariseTeam(tender)

  const handleAssign = (role, id) => {
    const def = PSF_TEAM_ROLES.find(r => r.role === role)
    const person = (rosters[role] || []).find(u => String(u.id) === String(id))
    if (!def) return
    const picked = person ? [{ id: person.id, name: person.name }] : []
    updateTender(tender.id, {
      [def.tenderKey]: picked,
      ...(def.singleKey ? { [def.singleKey]: picked[0] || null } : {}),
    })
  }

  const handleSubmit = () => {
    if (!psf || submitting || isSubmitted || !teamComplete) return
    setSubmitting(true)
    const submitted = psf
    setTimeout(() => {
      updateTender(tender.id, {
        psfDocument: submitted,
        psfUploads: uploads,
        psfCompleted: true,
        psfCompletedAt: todayKey(),
      })
      setCompletedKeys(PSF_REVIEW_STEPS.map(s => s.key))
      setSubmitting(false)
    }, 400)
  }

  const handleExport = () => {
    if (!psf) return
    exportPsfDocx(tender, psf, teamMembers).catch(() => {
      window.alert('Could not export this PSF.')
    })
  }

  return (
    <div className="space-y-5">
      <Card className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* ── Header ── */}
        <header className="px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="max-w-full break-all rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {tenderRef(tender)}
              </span>
              <span className="max-w-full rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: '#0089cf', background: 'rgba(0,137,207,0.08)' }}>
                Procurement Submission Form - Strategy
              </span>
              {isSubmitted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle size={10} /> PSF Complete
                </span>
              )}
            </div>
            <h2 className="font-semibold break-words text-slate-800">{tender.title || 'Statement of Work'}</h2>
            {tender.department && <p className="mt-0.5 text-xs text-slate-500">{tender.department}</p>}
          </div>
        </header>

        {/* ── Stepper: compact pills with chevron separators ── */}
        <nav aria-label="PSF progress" className="space-y-2 border-t border-slate-100 px-4 py-3 sm:px-6">
          <p className="text-xs font-semibold text-slate-700 sm:hidden">
            {`Step ${stage + 1} of ${STAGE_LABELS.length}: ${STAGE_LABELS[stage]}`}
          </p>
          <div className="flex gap-1.5 sm:hidden" aria-hidden="true">
            {STAGE_LABELS.map((label, i) => (
              <span key={label} className={`h-1.5 flex-1 rounded-full ${i <= stage ? 'bg-[#0089cf]' : 'bg-slate-200'}`} />
            ))}
          </div>
          <ol className="hidden flex-wrap items-center gap-2 text-[11px] font-medium sm:flex">
            {STAGE_LABELS.map((label, i) => (
              <li key={label} aria-current={i === stage ? 'step' : undefined} className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 ${
                  i === stage ? 'bg-[#0089cf] text-white'
                    : i < stage ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-slate-100 text-slate-400'}`}>
                  {i < stage ? '✓ ' : `${i + 1}. `}{label}
                </span>
                {i < STAGE_LABELS.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-4 border-t border-slate-100 px-4 pb-6 pt-5 sm:px-6">
          {strategyIncomplete ? (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-800">Contract Strategy is not finished</p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                  Every strategy template has to be submitted before a PSF can be created -
                  including the Technical Evaluation Matrix, which is always included whether
                  or not it was ticked at the templates gate.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/strategy-templates/${tender.id}`)}
                  className="mt-2 text-xs font-bold text-amber-700 hover:underline"
                >
                  Back to Strategy Templates
                </button>
              </div>
            </div>
          ) : (
            <>
              {stage === 0 && (
                <PsfUploadStage
                  templates={templates}
                  prequalDoc={prequalDoc}
                  supportingDocuments={PSF_SUPPORTING_DOCUMENTS}
                  uploads={uploads}
                  onUpload={handleUpload}
                  onRemoveUpload={removeUpload}
                  onGenerate={handleGenerateClick}
                  isTemplatesOpen={templatesOpen}
                  onToggleTemplates={() => setTemplatesOpen(o => !o)}
                  alreadyGenerated={!!psf}
                />
              )}

              {stage === 1 && <PsfGenerationStage onComplete={handleGenerationComplete} />}

              {stage === 2 && psf && (
                <PsfReviewStage
                  psf={psf}
                  onChange={handleDocumentChange}
                  readOnly={readOnly}
                  isSubmitted={isSubmitted}
                  isSubmitting={submitting}
                  stepIndex={reviewStep}
                  completedKeys={completedKeys}
                  onSelectStep={selectReviewStep}
                  teamComplete={teamComplete}
                  teamMembers={teamMembers}
                  teamSummary={teamSummary}
                  rosters={rosters}
                  selectedTeam={selectedTeam}
                  onAssign={handleAssign}
                  onBackToUploads={() => setStage(0)}
                  onExport={handleExport}
                  onSubmit={handleSubmit}
                  onMoveForwardToItt={() => navigate(`/create-itt/${tender.id}`)}
                />
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
