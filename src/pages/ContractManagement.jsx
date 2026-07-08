import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Activity, ShieldOff, FileText, ChevronRight, CreditCard, AlertTriangle,
  CheckCircle, ClipboardList, Plus, Send,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'

const milestoneCfg = {
  paid:     { label: 'Paid',     cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  pending:  { label: 'Pending',  cls: 'text-amber-700   bg-amber-50   border-amber-200' },
  upcoming: { label: 'Upcoming', cls: 'text-slate-500   bg-slate-100  border-slate-200' },
}

const issueCfg = {
  low:    'text-slate-600 bg-slate-100 border-slate-200',
  medium: 'text-amber-700 bg-amber-50  border-amber-200',
  high:   'text-red-700   bg-red-50    border-red-200',
}

export default function ContractManagement() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders, updateTender } = useTenders()
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  const [reviewNote, setReviewNote] = useState('')
  const [initiating, setInitiating] = useState(false)

  if (user?.role?.id !== 'pof') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Engineers can access this page.</p>
    </div>
  )

  if (!tenderId) {
    const list = tenders.filter(t => t.status === 'active')
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Contract Management</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{list.length} active</span>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FileText size={32} />
            <p className="text-sm font-medium">No active contracts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(td => (
              <Card key={td.id} className="p-4 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group"
                onClick={() => navigate(`/contract-management/${td.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{td.id}</span>
                      <Badge variant="active">{td.stage}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{td.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">Delivery: {td.deliveryProgress ?? 0}%</p>
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

  if (!tender || tender.status !== 'active') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found or contract not active.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )

  const milestones = tender.paymentMilestones || []
  const issues = tender.issues || []
  const reviews = tender.periodicReviews || []
  const openIssues = issues.filter(i => i.status === 'open')

  const addReview = () => {
    if (!reviewNote.trim()) return
    const entry = { id: Date.now(), date: new Date().toISOString().split('T')[0], reviewer: user?.name || 'Contract Engineer', note: reviewNote.trim() }
    updateTender(tender.id, { periodicReviews: [entry, ...reviews] })
    setReviewNote('')
  }

  const initiateClosure = () => {
    setInitiating(true)
    setTimeout(() => {
      updateTender(tender.id, { status: 'contract_closure', stage: 'Closure In Progress' })
      navigate(`/contract-closure/${tender.id}`)
    }, 400)
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="active">Contract Active</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · {tender.budget} · Started {tender.contractStartDate || '—'}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Activity size={14} className="text-[var(--color-primary)]" /> Delivery Progress</h3>
          <span className="text-lg font-bold text-[var(--color-primary)]">{tender.deliveryProgress ?? 0}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${tender.deliveryProgress ?? 0}%` }} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <CreditCard size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Payment Milestones</h3>
        </div>
        {milestones.length === 0 ? (
          <p className="text-xs text-slate-400 px-4 py-4">No payment milestones recorded.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.label}</p>
                  <p className="text-xs text-slate-400">Due {m.due}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">{m.amount}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${milestoneCfg[m.status]?.cls || milestoneCfg.upcoming.cls}`}>
                    {milestoneCfg[m.status]?.label || m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Compliance & Issue Log</h3>
          {openIssues.length > 0 && (
            <Badge variant="warning">{openIssues.length} open</Badge>
          )}
        </div>
        {issues.length === 0 ? (
          <p className="text-xs text-slate-400 px-4 py-4">No issues logged.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {issues.map(i => (
              <div key={i.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${issueCfg[i.severity]}`}>{i.severity}</span>
                  <span className="text-sm text-slate-700">{i.label}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${i.status === 'resolved' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                  {i.status === 'resolved' ? 'Resolved' : 'Open'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Periodic Reviews</h3>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={reviewNote}
            onChange={e => setReviewNote(e.target.value)}
            placeholder="Add a periodic performance review note..."
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          <Button size="sm" onClick={addReview}><Plus size={13} /> Add Review</Button>
        </div>
        <div className="space-y-2">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400">No periodic reviews recorded yet.</p>
          ) : reviews.map(r => (
            <div key={r.id} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-semibold text-slate-700">{r.date} · {r.reviewer}</span>
              <p className="text-slate-500 mt-0.5">{r.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-500">When delivery is complete and all milestones are settled, initiate contract closure.</p>
          <Button disabled={initiating} onClick={initiateClosure}>
            {initiating ? 'Initiating…' : 'Initiate Closure'} <Send size={13} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
