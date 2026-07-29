import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ShieldOff, FileText, ChevronRight,
  CheckCircle, Send, FileCheck2, Download, Mail,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SectionTemplateModal from '../components/contract/SectionTemplateModal'
import { contractSections } from '../components/itt/sectionFlow'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/NavigationContext'
import { useHomePath } from '../utils/permissions'
import { awardOutcome, openRegretLetter, letterDateStr } from '../utils/contractDocs'

export default function ContractManagement() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const home = useHomePath()
  const { tenders, updateTender } = useTenders()
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  const [initiating, setInitiating] = useState(false)
  const [sending,    setSending]    = useState(false)
  // The issued contract is read back as its ITT section documents, one at a time.
  const [docOpen,   setDocOpen]   = useState(false)
  const [sectionId, setSectionId] = useState('sectionA')

  const sections = useMemo(() => contractSections(tender?.b1Category), [tender?.b1Category])
  const section  = sections.find(s => s.id === sectionId) || sections[0]

  useBackHandler(() => {
    if (docOpen) { setDocOpen(false); return true }
    return false
  })

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
      <Button variant="secondary" size="sm" onClick={() => navigate(home)}>Back to Home</Button>
    </div>
  )

  // SCM gate 3 is the point of issue — it stamps contractIssuedAt and releases
  // the winner's contract together with every regret letter. A legacy seed
  // tender that reached `active` without passing that gate has no record to show.
  const issued = !!(tender.contractCompleted || tender.contractIssuedAt)
  const { awarded: awardedBidder, unsuccessful: regretBidders } = awardOutcome(tender)
  const issuedOn = tender.contractIssuedAt
    ? new Date(tender.contractIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  // Sending is stamped on the tender, not held in component state — the card has
  // to read back as sent after a remount or a role switch, and can only fire once.
  const lettersSentAt = tender.regretLettersSentAt || null
  const lettersSentOn = lettersSentAt
    ? new Date(lettersSentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const sendRegretLetters = () => {
    if (lettersSentAt || sending || regretBidders.length === 0) return
    setSending(true)
    setTimeout(() => {
      updateTender(tender.id, {
        regretLettersSentAt: new Date().toISOString(),
        regretLettersSentBy: user?.name || 'Contract Engineer',
      })
      setSending(false)
    }, 400)
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

      {/* ── Issued Documents — what SCM gate 3 released ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <FileCheck2 size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Issued Documents</h3>
          {issued && issuedOn && <Badge variant="success"><CheckCircle size={10} /> Issued {issuedOn}</Badge>}
        </div>

        {!issued ? (
          <p className="text-xs text-slate-400 px-4 py-4">
            This contract predates issue tracking — it was activated before Supply Chain gate 3 recorded the release,
            so no issued contract or regret letters are held against it.
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Winner's contract */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-sm flex items-center justify-center shrink-0">
                  {awardedBidder?.name?.[0] || '—'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    Contract — {awardedBidder?.name || 'awarded bidder'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Awarded{awardedBidder?.totalBid ? ` · ${awardedBidder.totalBid}` : ''}
                    {issuedOn ? ` · issued ${issuedOn}` : ''}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setDocOpen(true)}>
                <FileText size={12} /> Export Contract
              </Button>
            </div>

            {/* Regret letters — one per unsuccessful bidder. Export (download) and
                send (notify) sit together: both act on the same issued letters. */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Mail size={13} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Regret Letters</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  {regretBidders.length} unsuccessful bidder{regretBidders.length !== 1 ? 's' : ''}
                </span>
                {lettersSentOn && <Badge variant="success"><CheckCircle size={10} /> Sent {lettersSentOn}</Badge>}
              </div>
              {regretBidders.length === 0 ? (
                <p className="text-xs text-slate-400">No unsuccessful bidders were recorded on this tender.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {regretBidders.map(b => (
                      <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">{b.name?.[0]}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{b.name}</p>
                            <p className="text-[10px] text-slate-400">Regret letter · {letterDateStr(tender.contractIssuedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {lettersSentAt && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle size={11} /> Sent
                            </span>
                          )}
                          <Button size="sm" variant="secondary"
                            onClick={() => openRegretLetter(tender, b, awardedBidder?.name, tender.contractIssuedAt)}>
                            <Download size={12} /> Export
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-[11px] text-slate-400">
                      {lettersSentAt
                        ? <>Sent to all {regretBidders.length} unsuccessful bidder{regretBidders.length !== 1 ? 's' : ''} by {tender.regretLettersSentBy || 'the Contract Engineer'} on {lettersSentOn}.</>
                        : 'Each letter carries the tender outcome and a courteous regret message. Sending is recorded against the tender.'}
                    </p>
                    <Button size="sm" disabled={!!lettersSentAt || sending} onClick={sendRegretLetters}>
                      <Send size={13} /> {lettersSentAt ? 'Regret Letters Sent' : sending ? 'Sending…' : `Send Regret Letters (${regretBidders.length})`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-500">When the contract has run its course and both parties have settled, initiate contract closure.</p>
          <Button disabled={initiating} onClick={initiateClosure}>
            {initiating ? 'Initiating…' : 'Initiate Closure'} <Send size={13} />
          </Button>
        </div>
      </Card>

      {/* The issued contract, read back through the same section templates it was
          drafted against — read-only, it is a record and not a working draft. */}
      {docOpen && (
        <SectionTemplateModal
          tender={tender}
          section={section}
          sections={sections}
          onSectionChange={setSectionId}
          title="Issued Contract"
          readOnly
          readOnlyNote="Issued contract — read-only record"
          onClose={() => setDocOpen(false)}
        />
      )}
    </div>
  )
}
