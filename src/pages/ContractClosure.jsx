import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Archive, ShieldOff, FileText, CheckCircle, Star, Download, ChevronRight } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useHomePath } from '../utils/permissions'
import { exportClosureReportPDF } from '../utils/exportPDF'

const CHECKLIST = [
  { id: 'deliverables', label: 'Final Deliverables Check' },
  { id: 'invoice',      label: 'Invoice Settlement' },
  { id: 'performance',  label: 'Performance Evaluation' },
]

export default function ContractClosure() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const home = useHomePath()
  const { tenders, updateTender } = useTenders()
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  const [checked, setChecked] = useState({})
  const [rating, setRating] = useState(0)
  const [archiving, setArchiving] = useState(false)

  if (user?.role?.id !== 'pof') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Engineers can access this page.</p>
    </div>
  )

  if (!tenderId) {
    const list = tenders.filter(t => t.status === 'contract_closure')
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Contract Closure</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{list.length} tender{list.length !== 1 ? 's' : ''}</span>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FileText size={32} />
            <p className="text-sm font-medium">No tenders in closure</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(td => (
              <Card key={td.id} className="p-4 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group"
                onClick={() => navigate(`/contract-closure/${td.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{td.id}</span>
                      <Badge variant="contract_closure">{td.stage}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{td.title}</h3>
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

  if (!tender || tender.status !== 'contract_closure') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found or not in closure.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate(home)}>Back to Home</Button>
    </div>
  )

  const allChecked = CHECKLIST.every(c => checked[c.id]) && rating > 0

  const archive = () => {
    setArchiving(true)
    setTimeout(() => {
      updateTender(tender.id, { status: 'closed', stage: 'Closed & Archived', vendorRating: rating })
      navigate('/tenders')
    }, 400)
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
          <Badge variant="contract_closure">Closure In Progress</Badge>
        </div>
        <h3 className="font-semibold text-slate-800">{tender.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{tender.department} · {tender.budget}</p>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Closure Checklist</h3>
        {CHECKLIST.map(item => (
          <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={e => setChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
              className="accent-[var(--color-primary)]"
            />
            <span className="text-sm text-slate-700 flex-1">{item.label}</span>
            {checked[item.id] && <CheckCircle size={14} className="text-emerald-600" />}
          </label>
        ))}

        <div className="pt-2">
          <p className="text-xs font-medium text-slate-600 mb-2">Vendor Performance Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={22} className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-500">
            {allChecked ? 'All closure steps complete — ready to archive.' : 'Complete the checklist and rate vendor performance before archiving.'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => exportClosureReportPDF(tender)}>
              <Download size={13} /> Generate Closure Report
            </Button>
            <Button disabled={!allChecked || archiving} onClick={archive}>
              <Archive size={13} /> {archiving ? 'Archiving…' : 'Archive Contract'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
