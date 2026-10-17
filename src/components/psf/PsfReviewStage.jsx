/*
 * PSF Strategy — Stage 3 "Review & Submit" (Next.js Stage3ReviewSubmit.tsx).
 *
 * The form is split into eight sub-steps with a pill navigator, one screen per
 * group of template sections, ending on the team and the submit action.
 * Sections follow the Oman LNG template from `ATTACHMENTS:` onward. Fields the
 * template prints in red are drafted prose carrying the select-to-edit AI popup.
 */

import { ArrowLeft, Check, ChevronRight, Loader2, Upload } from 'lucide-react'
import Button from '../ui/Button'
import {
  PsfAttachments, PsfCheckboxGrid, PsfDateField, PsfField, PsfHistoryTable, PsfIcvTable,
  PsfMilestoneTable, PsfNarrative, PsfNote, PsfReadOnlyField, PsfSection, PsfSubHeading,
  PsfTendererTable,
} from './PsfFields'
import { PsfAssignTeamCard, PsfAssignedTeamRow } from './PsfTeam'
import { PSF_HEADER_FIELDS, PSF_NARRATIVE_FIELDS, PSF_REVIEW_STEPS } from '../../data/psfTemplate'

/** The sub-step pill navigator (Next.js SectionStepper). */
function ReviewStepper({ activeIndex, completedKeys, onSelect }) {
  return (
    <nav aria-label="PSF review sections">
      <ol className="relative flex items-center gap-1 overflow-x-auto pb-1">
        {PSF_REVIEW_STEPS.map((step, index) => {
          const isActive = index === activeIndex
          const isDone = !isActive && completedKeys.includes(step.key)
          return (
            <li key={step.key} className="flex shrink-0 flex-auto items-center gap-1">
              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                title={step.label}
                onClick={() => onSelect(index)}
                className={`flex min-w-0 flex-auto cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border py-1 pl-1.5 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/40 ${
                  isActive
                    ? 'border-[#0089cf] bg-[#0089cf] text-white'
                    : isDone
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-[#0089cf]/40'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <Check size={10} /> : index + 1}
                </span>
                <span className="text-[11px] font-semibold">{step.label}</span>
                {isDone && <span className="sr-only">completed</span>}
              </button>
              {index < PSF_REVIEW_STEPS.length - 1 && (
                <span aria-hidden="true" className="h-px w-1.5 shrink-0 bg-slate-200" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default function PsfReviewStage({
  psf, onChange, readOnly, isSubmitted, isSubmitting,
  stepIndex, completedKeys, onSelectStep,
  teamComplete, teamMembers, teamSummary, rosters, selectedTeam, onAssign,
  onBackToUploads, onExport, onSubmit, onMoveForwardToItt,
}) {
  const stepKey = PSF_REVIEW_STEPS[stepIndex]?.key
  const isLastStep = stepIndex === PSF_REVIEW_STEPS.length - 1
  const showPrevious = stepIndex > 0 || !isSubmitted

  /* ── Patch helpers. Each one narrows to the slice it owns. ── */
  const setNarrative = (key, value) => onChange({ narrative: { ...psf.narrative, [key]: value } })
  const toggleIn = (list, id, checked) => list.map(o => (o.id === id ? { ...o, checked } : o))
  const setHistory = (scope, patch) =>
    onChange({ history: { ...psf.history, [scope]: { ...psf.history[scope], ...patch } } })
  const setPlan = patch => onChange({ tenderPlan: { ...psf.tenderPlan, ...patch } })

  return (
    <div className="space-y-5">
      <ReviewStepper activeIndex={stepIndex} completedKeys={completedKeys} onSelect={onSelectStep} />

      {stepKey === 'overview' && (
        <div className="space-y-5">
          <PsfAttachments attachments={psf.attachments} />
          <PsfSection title="Procurement Submission Form - Strategy">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Carried over from the Contract Initiating Form — shown read-only. */}
              {PSF_HEADER_FIELDS.map(f => (
                <PsfReadOnlyField key={f.key} label={f.label} value={psf.header?.[f.key]} />
              ))}
            </div>
          </PsfSection>
          <PsfSection title="History">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <PsfSubHeading>Previous contract</PsfSubHeading>
                <PsfHistoryTable scope="previous" entry={psf.history.previous} readOnly={readOnly}
                  onChange={patch => setHistory('previous', patch)} />
              </div>
              <div className="space-y-4">
                <div>
                  <PsfSubHeading>Existing contract</PsfSubHeading>
                  <PsfHistoryTable scope="existing" entry={psf.history.existing} readOnly={readOnly}
                    onChange={patch => setHistory('existing', patch)} />
                </div>
                <PsfField label="Current Spend" value={psf.history.currentSpend} readOnly={readOnly}
                  onChange={v => onChange({ history: { ...psf.history, currentSpend: v } })} />
              </div>
            </div>
          </PsfSection>
        </div>
      )}

      {stepKey === 'reviews' && (
        <div className="space-y-5">
          <PsfSection title="Reviews/Approvals Established">
            <PsfCheckboxGrid options={psf.reviews} readOnly={readOnly}
              onToggle={(id, checked) => onChange({ reviews: toggleIn(psf.reviews, id, checked) })} />
          </PsfSection>
          <PsfSection title="Estimate Basis">
            <div className="space-y-4">
              <div className="max-w-xs">
                <PsfField label="Confidence Level" value={psf.estimate.confidenceLevel} readOnly={readOnly}
                  onChange={v => onChange({ estimate: { ...psf.estimate, confidenceLevel: v } })} />
              </div>
              <PsfCheckboxGrid options={psf.estimate.basis} columns={2} readOnly={readOnly}
                onToggle={(id, checked) => onChange({ estimate: { ...psf.estimate, basis: toggleIn(psf.estimate.basis, id, checked) } })} />
              <PsfNarrative label="Benchmarking of Estimates" rows={4} value={psf.narrative.benchmarking}
                readOnly={readOnly} onChange={v => setNarrative('benchmarking', v)} />
            </div>
          </PsfSection>
        </div>
      )}

      {stepKey === 'narrative' && (
        <PsfSection title="Submission Narrative">
          <div className="space-y-5">
            {PSF_NARRATIVE_FIELDS.map(f => (
              <PsfNarrative key={f.key} label={f.label} rows={f.rows} value={psf.narrative[f.key]}
                readOnly={readOnly} onChange={v => setNarrative(f.key, v)} />
            ))}
          </div>
        </PsfSection>
      )}

      {stepKey === 'plan' && (
        <div className="space-y-5">
          <PsfSection title="Tender Plan">
            <div className="space-y-4">
              <PsfCheckboxGrid options={psf.tenderPlan.types} readOnly={readOnly}
                onToggle={(id, checked) => setPlan({ types: toggleIn(psf.tenderPlan.types, id, checked) })} />
              <div className="max-w-xs">
                <PsfDateField label="New services required to be in place/on site by"
                  value={psf.tenderPlan.requiredBy} readOnly={readOnly}
                  onChange={v => setPlan({ requiredBy: v })} />
              </div>
              <PsfMilestoneTable milestones={psf.tenderPlan.milestones} readOnly={readOnly}
                onChange={(id, patch) => setPlan({
                  milestones: psf.tenderPlan.milestones.map(m => (m.id === id ? { ...m, ...patch } : m)),
                })} />
              <PsfNote label="Deviations" value={psf.tenderPlan.deviations} readOnly={readOnly}
                onChange={v => setPlan({ deviations: v })} />
            </div>
          </PsfSection>
          <PsfSection title="Tender Strategy">
            <PsfCheckboxGrid options={psf.tenderStrategy} readOnly={readOnly}
              onToggle={(id, checked) => onChange({ tenderStrategy: toggleIn(psf.tenderStrategy, id, checked) })} />
          </PsfSection>
          <PsfSection title="Drop Lists">
            <div className="space-y-5">
              <div>
                <PsfSubHeading>Competitive</PsfSubHeading>
                <PsfCheckboxGrid options={psf.dropLists.competitive} columns={2} readOnly={readOnly}
                  onToggle={(id, checked) => onChange({ dropLists: { ...psf.dropLists, competitive: toggleIn(psf.dropLists.competitive, id, checked) } })} />
              </div>
              <div>
                <PsfSubHeading>Single source / OEM</PsfSubHeading>
                <PsfCheckboxGrid options={psf.dropLists.singleSourceOem} columns={2} readOnly={readOnly}
                  onToggle={(id, checked) => onChange({ dropLists: { ...psf.dropLists, singleSourceOem: toggleIn(psf.dropLists.singleSourceOem, id, checked) } })} />
              </div>
            </div>
          </PsfSection>
        </div>
      )}

      {stepKey === 'assessment' && (
        <div className="space-y-5">
          <PsfSection title="Proposed Basis for Tender Assessments">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[['technical', 'Technical'], ['cutOff', 'Cut Off'], ['commercial', 'Commercial']].map(([key, label]) => (
                  <PsfField key={key} label={label} value={psf.assessments[key]} readOnly={readOnly}
                    onChange={v => onChange({ assessments: { ...psf.assessments, [key]: v } })} />
                ))}
              </div>
              <PsfNote label="Alternatives Considered" value={psf.alternativesConsidered} readOnly={readOnly}
                onChange={v => onChange({ alternativesConsidered: v })} />
              {/* The template prints "Other Details" twice on this page; each is
                  scoped by its section so the two are distinguishable. */}
              <PsfNote label="Other Details (tender assessments)" value={psf.assessmentOtherDetails} readOnly={readOnly}
                onChange={v => onChange({ assessmentOtherDetails: v })} />
              <PsfNote label="Omanisation Implications" value={psf.omanisationImplications} readOnly={readOnly}
                onChange={v => onChange({ omanisationImplications: v })} />
              <PsfNote label="Other Details (Omanisation)" value={psf.omanisationOtherDetails} readOnly={readOnly}
                onChange={v => onChange({ omanisationOtherDetails: v })} />
            </div>
          </PsfSection>
          <PsfSection title="Negotiation Strategy (for OEM & single source only)">
            <div className="space-y-4">
              <div className="max-w-sm">
                <PsfField label="Applicability" value={psf.negotiation.applicability} readOnly={readOnly}
                  onChange={v => onChange({ negotiation: { ...psf.negotiation, applicability: v } })} />
              </div>
              <PsfNarrative label="Negotiation Strategy Details" rows={4} value={psf.narrative.negotiationDetails}
                readOnly={readOnly} onChange={v => setNarrative('negotiationDetails', v)} />
              <PsfNote label="Additional Notes (tender strategy)" value={psf.strategyAdditionalNotes} readOnly={readOnly}
                onChange={v => onChange({ strategyAdditionalNotes: v })} />
            </div>
          </PsfSection>
        </div>
      )}

      {stepKey === 'tenderers' && (
        <PsfSection title="Tenderer List">
          <div className="space-y-4">
            <div className="max-w-md">
              <PsfField label="Source of tenderer list" value={psf.tendererList.source} readOnly={readOnly}
                onChange={v => onChange({ tendererList: { ...psf.tendererList, source: v } })} />
            </div>
            <PsfTendererTable rows={psf.tendererList.rows} readOnly={readOnly}
              onChange={(id, patch) => onChange({
                tendererList: { ...psf.tendererList, rows: psf.tendererList.rows.map(r => (r.id === id ? { ...r, ...patch } : r)) },
              })} />
            <PsfNarrative label="Justification" rows={4} value={psf.narrative.tendererJustification}
              readOnly={readOnly} onChange={v => setNarrative('tendererJustification', v)} />
            <PsfNote label="Additional Notes (tenderer list)" value={psf.tendererAdditionalNotes} readOnly={readOnly}
              onChange={v => onChange({ tendererAdditionalNotes: v })} />
          </div>
        </PsfSection>
      )}

      {stepKey === 'recommendation' && (
        <div className="space-y-5">
          <PsfSection title="Recommendation/Request">
            <PsfNarrative label="Recommendation to Tender Board" rows={4} value={psf.narrative.recommendation}
              readOnly={readOnly} onChange={v => setNarrative('recommendation', v)} />
          </PsfSection>
          <PsfSection title="LC Review">
            <div className="space-y-4">
              <PsfNote label="LC Review Detail" rows={4} value={psf.icvReviewDetail} readOnly={readOnly}
                onChange={v => onChange({ icvReviewDetail: v })} />
              <PsfIcvTable rows={psf.icvRequirements} readOnly={readOnly}
                onChange={(id, patch) => onChange({
                  icvRequirements: psf.icvRequirements.map(r => (r.id === id ? { ...r, ...patch } : r)),
                })} />
            </div>
          </PsfSection>
        </div>
      )}

      {stepKey === 'team' && (
        !teamComplete && !isSubmitted ? (
          <PsfAssignTeamCard rosters={rosters} selected={selectedTeam} onChange={onAssign} />
        ) : (
          <PsfAssignedTeamRow members={teamMembers} description="Runs ITT creation after submission" />
        )
      )}

      {/* ── Footer ── */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {isLastStep ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {isSubmitted ? 'PSF Strategy submitted' : 'Submit PSF Strategy'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {isSubmitted
                  ? `Assigned to ${teamSummary} for ITT creation.`
                  : 'Submitting assigns this tender to the selected Contract Engineer(s), HSE and LC for ITT creation.'}
              </p>
            </div>
          ) : <span aria-hidden="true" />}

          <div className="flex flex-wrap gap-2">
            {showPrevious && (
              <Button type="button" variant="secondary"
                onClick={() => (stepIndex > 0 ? onSelectStep(stepIndex - 1) : onBackToUploads())}
                className="flex items-center gap-1.5">
                <ArrowLeft size={13} /> {stepIndex > 0 ? 'Previous' : 'Back to Uploads'}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onExport} className="flex items-center gap-1.5">
              <Upload size={13} /> Export PSF
            </Button>
            {!isLastStep ? (
              <Button type="button" variant="brand" onClick={() => onSelectStep(stepIndex + 1)} className="flex items-center gap-1.5">
                Next <ChevronRight size={14} />
              </Button>
            ) : isSubmitted ? (
              <Button type="button" variant="brand" onClick={onMoveForwardToItt} className="flex items-center gap-1.5">
                Move Forward to ITT <ChevronRight size={14} />
              </Button>
            ) : (
              <Button type="button" variant="brand" onClick={onSubmit}
                disabled={isSubmitting || !teamComplete} className="flex items-center gap-1.5">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <>Submit <ChevronRight size={14} /></>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
