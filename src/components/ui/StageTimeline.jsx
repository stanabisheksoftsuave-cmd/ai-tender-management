import { CheckCircle, Circle, Clock } from 'lucide-react'

/*
 * The 17-step tender lifecycle (main app's tender-tracking/ui/StageTimeline).
 * Light-row colours — the old white-alpha palette was tuned for a dark
 * background and left pending steps nearly invisible on the light table row.
 *
 *   <StageTimeline currentStage="tech_eval" />
 *   <StageTimeline currentStage="closure" isComplete />   // closed & archived
 */
const stages = [
  { id: 'prequal',    label: 'Pre-Qualification' },
  { id: 'draft',      label: 'ITT Creation' },
  { id: 'approval',   label: 'ITT Approval' },
  { id: 'export',     label: 'Tender Export' },
  { id: 'upload',     label: 'Ingestion' },
  { id: 'extraction', label: 'AI Extraction' },
  { id: 'tech_eval',  label: 'Technical Eval.' },
  { id: 'scm_gate1',  label: 'SCM — Technical' },
  { id: 'comm_eval',  label: 'Commercial Eval.' },
  { id: 'scm_gate2',  label: 'SCM — Award' },
  { id: 'award',      label: 'Contract Drafting' },
  { id: 'scm_gate3',  label: 'SCM — Contract' },
  { id: 'contract',   label: 'Contract Issued' },
  { id: 'legal',      label: 'Legal Review' },
  { id: 'execution',  label: 'Execution' },
  { id: 'management', label: 'Management' },
  { id: 'closure',    label: 'Closure' },
]

export default function StageTimeline({ currentStage, isComplete = false }) {
  const currentIdx = isComplete ? stages.length : stages.findIndex(s => s.id === currentStage)

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {stages.map((stage, idx) => {
        const done   = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={stage.id} className="flex items-center">
            <div className="relative flex min-w-[72px] flex-col items-center m-1">
              <div
                className={`flex w-7 h-7 items-center justify-center rounded-full border ${
                  done
                    ? 'border-emerald-300 bg-emerald-50'
                    : active
                      ? 'border-[var(--color-primary)] bg-blue-50 ring-4 ring-blue-100'
                      : 'border-slate-200 bg-slate-50'
                }`}>
                {done   ? <CheckCircle size={14} className="text-emerald-600" aria-hidden="true" /> :
                 active ? <Clock size={14} style={{ color: 'var(--color-primary)' }} aria-hidden="true" /> :
                          <Circle size={14} className="text-slate-300" aria-hidden="true" />}
              </div>
              <span
                className={`mt-1 text-center text-[10px] leading-tight ${
                  active ? 'font-semibold' : done ? 'text-emerald-600' : 'text-slate-400'
                }`}
                style={active ? { color: 'var(--color-primary)' } : undefined}>
                {stage.label}
                <span className="sr-only">
                  {done ? ' (completed)' : active ? ' (current)' : ' (pending)'}
                </span>
              </span>
            </div>
            {idx < stages.length - 1 && (
              <div className={`mt-[-14px] h-0.5 w-4 ${idx < currentIdx ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
