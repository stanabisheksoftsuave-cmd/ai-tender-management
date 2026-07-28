import { CheckCircle, Circle, Clock } from 'lucide-react'

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

export default function StageTimeline({ currentStage }) {
  const currentIdx = stages.findIndex(s => s.id === currentStage)

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {stages.map((stage, idx) => {
        const done   = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={stage.id} className="flex items-center">
            <div className={`flex flex-col items-center min-w-[72px] ${active || done ? 'opacity-100' : 'opacity-30'}`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: done
                    ? 'rgba(16,185,129,0.25)'
                    : active
                      ? 'rgba(37,99,235,0.3)'
                      : 'rgba(255,255,255,0.07)',
                  border: done
                    ? '1px solid rgba(16,185,129,0.5)'
                    : active
                      ? '1px solid rgba(37,99,235,0.6)'
                      : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: active ? '0 0 12px rgba(37,99,235,0.4)' : 'none',
                }}>
                {done   ? <CheckCircle size={14} style={{ color: '#34D399' }} /> :
                 active ? <Clock size={14} style={{ color: '#60A5FA' }} /> :
                          <Circle size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />}
              </div>
              <span className="text-[10px] mt-1 text-center leading-tight"
                style={{
                  color: active ? '#60A5FA' : done ? '#34D399' : 'rgba(255,255,255,0.3)',
                  fontWeight: active ? 600 : 400,
                }}>
                {stage.label}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <div className="h-0.5 w-4 mt-[-14px]"
                style={{ background: idx < currentIdx ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
