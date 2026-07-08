import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileSignature, ShieldOff, FileText, CheckCircle, Building2, Award, ChevronRight } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { bidders as seedBidders } from '../data/mockData'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'

export default function ContractExecution() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders, updateTender } = useTenders()
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  const [holderSigned, setHolderSigned] = useState(false)
  const [bidderSigned, setBidderSigned] = useState(false)
  const [activating, setActivating] = useState(false)

  if (user?.role?.id !== 'pof') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Engineers can access this page.</p>
    </div>
  )

  if (!tenderId) {
    const list = tenders.filter(t => t.status === 'contract_execution')
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Contract Execution</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{list.length} tender{list.length !== 1 ? 's' : ''}</span>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FileText size={32} />
            <p className="text-sm font-medium">No tenders awaiting contract execution</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(td => (
              <Card key={td.id} className="p-4 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group"
                onClick={() => navigate(`/contract-execution/${td.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{td.id}</span>
                      <Badge variant="contract_execution">{td.stage}</Badge>
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

  if (!tender || tender.status !== 'contract_execution') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found or not ready for contract execution.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )

  const tenderBidders = Array.isArray(tender.bidderList) ? tender.bidderList : seedBidders.slice(0, tender.bidders || 4)
  const awardedBidder = tender.mgmtWinnerId
    ? tenderBidders.find(b => b.id === tender.mgmtWinnerId) ?? tenderBidders[0]
    : tenderBidders[0]

  const bothSigned = holderSigned && bidderSigned

  const activate = () => {
    setActivating(true)
    setTimeout(() => {
      updateTender(tender.id, {
        status: 'active',
        stage: 'Contract Active',
        contractStartDate: new Date().toISOString().split('T')[0],
        kpiTracking: true,
        deliveryProgress: 0,
      })
      navigate(`/contract-management/${tender.id}`)
    }, 500)
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
          <Badge variant="contract_execution">Contract Execution</Badge>
        </div>
        <h3 className="font-semibold text-slate-800">{tender.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{tender.department} · {tender.budget}</p>
      </Card>

      {awardedBidder && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-slate-800 text-sm">Contract Party</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-[var(--color-primary)]">{awardedBidder.name?.[0]}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{awardedBidder.name}</h2>
              {awardedBidder.country && (
                <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 size={11} /> {awardedBidder.country}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileSignature size={16} className="text-[var(--color-primary)]" />
          <h3 className="font-semibold text-slate-800 text-sm">Two-Party E-Signature</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`rounded-xl border p-4 ${holderSigned ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-xs font-semibold text-slate-600 mb-2">Contract Holder</p>
            <p className="text-sm font-semibold text-slate-800 mb-3">{tender.department}</p>
            {holderSigned ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle size={13} /> Signed</span>
            ) : (
              <Button size="sm" onClick={() => setHolderSigned(true)}>Sign as Contract Holder</Button>
            )}
          </div>
          <div className={`rounded-xl border p-4 ${bidderSigned ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-xs font-semibold text-slate-600 mb-2">Awarded Bidder</p>
            <p className="text-sm font-semibold text-slate-800 mb-3">{awardedBidder?.name}</p>
            {bidderSigned ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle size={13} /> Signed</span>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setBidderSigned(true)}>Simulate Bidder Signature</Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-500">
            {bothSigned ? 'Both parties have signed. Ready to activate the contract.' : 'Both parties must sign before the contract can be activated.'}
          </p>
          <Button disabled={!bothSigned || activating} onClick={activate}>
            {activating ? 'Activating…' : 'Activate Contract'} <ChevronRight size={14} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
