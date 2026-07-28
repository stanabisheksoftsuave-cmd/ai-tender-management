import { useNavigate } from 'react-router-dom'
import { ChevronRight, Building2, Calendar, Users, FileText, RefreshCw } from 'lucide-react'
import Card from './Card'
import Badge from './Badge'

const statusVariant = {
  tech_eval:   'tech_eval',
  comm_eval:   'comm_eval',
  scm_gate1:   'scm_gate',
  scm_gate2:   'scm_gate',
  scm_gate3:   'scm_gate',
  upload:      'upload',
  prequal_stage1:      'prequal_stage1',
  prequal_stage2:      'prequal_stage2',
  prequal_stage3:      'prequal_stage3',
  prequal_stage4:      'prequal_stage4',
  prequal_final_review: 'prequal_final_review',
  prequal_rejected:    'prequal_rejected',
  legal_review:        'legal_review',
  contract_execution:  'contract_execution',
  active:              'active',
  contract_closure:    'contract_closure',
  closed:              'closed',
}

export default function TenderSelectList({ tenders, status, basePath, title, description, emptyText }) {
  const navigate = useNavigate()
  const filtered = tenders.filter(t => t.status === status)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {filtered.length} tender{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <FileText size={32} />
          <p className="text-sm font-medium">{emptyText || 'No tenders at this stage'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tender => (
            <Card
              key={tender.id}
              className="p-4 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group"
              onClick={() => navigate(`${basePath}/${tender.id}`)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {tender.id}
                    </span>
                    <Badge variant={statusVariant[tender.status] || 'info'}>{tender.stage}</Badge>
                    {tender.evalProgress === 'in_progress' && (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 ring-1 ring-amber-200 px-1.5 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                    {tender.evalProgress === 'not_started' && (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        Not Started
                      </span>
                    )}
                    {tender.correctionRequests?.some(r => r.resolved) && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <RefreshCw size={8} /> Docs Re-submitted
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{tender.title}</h3>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Building2 size={11} /> {tender.department}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar size={11} /> {tender.deadline}
                    </span>
                    {tender.bidders > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Users size={11} /> {tender.bidders} bidder{tender.bidders !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{tender.budget}</p>
                    <p className="text-[10px] text-slate-400">Budget</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-primary)] transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
