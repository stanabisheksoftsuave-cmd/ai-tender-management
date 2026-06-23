import { useState } from 'react'
import {
  FileSignature, Bot, Star, CheckCircle, Eye, Send, ChevronRight,
  Tag, Globe, BarChart3, Award, Scale, ShieldOff, FileText,
  AlertTriangle, Hash
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { bidders as seedBidders, contractTemplates } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import TenderSelectList from '../components/ui/TenderSelectList'

// Must stay in sync with AwardRecommendation criteria
const CRITERIA = [
  { id: 'tech',    label: 'Technical Capability',       short: 'Technical',   weight: 0.25 },
  { id: 'comm',    label: 'Commercial Competitiveness', short: 'Commercial',  weight: 0.20 },
  { id: 'finance', label: 'Financial Stability',        short: 'Financial',   weight: 0.15 },
  { id: 'icv',     label: 'Local Content / ICV',        short: 'ICV',         weight: 0.15 },
  { id: 'perf',    label: 'Past Performance',           short: 'Performance', weight: 0.15 },
  { id: 'risk',    label: 'Risk Assessment',            short: 'Risk',        weight: 0.10 },
]

function computeTotal(scoreMap) {
  return Math.round(
    CRITERIA.reduce((sum, c) => sum + c.weight * (Number(scoreMap?.[c.id]) || 0), 0) * 10 * 10
  ) / 10
}

const flowStages = [
  { label: 'Ingestion',     done: true },
  { label: 'AI Extraction', done: true },
  { label: 'Tech Eval',     done: true },
  { label: 'Comm Eval',     done: true },
  { label: 'Legal Review',  done: true },
  { label: 'Mgmt Approval', done: true },
  { label: 'Contract Draft',done: false, active: true },
]

export default function ContractTemplate() {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { tenders }  = useTenders()
  const tender = tenders.find(t => t.id === tenderId)

  const [selected, setSelected] = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [sent,     setSent]     = useState(false)

  if (user?.role?.id !== 'contractor_eng') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Engineers can access this page.</p>
    </div>
  )

  if (!tenderId) return (
    <TenderSelectList
      tenders={tenders}
      status="award"
      basePath="/contract"
      title="Contract Drafting"
      description="Select an awarded tender to begin contract drafting"
      emptyText="No tenders at the award stage"
    />
  )

  if (!tender || tender.status !== 'award') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found</p>
      <p className="text-xs">This tender has not been awarded yet.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )

  // ── Derive bidder list + scores from tender context ──────────────────────
  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  const mgmtScores = tender.mgmtScores || {}

  const ranked = tenderBidders
    .map(b => ({ bidder: b, scores: mgmtScores[b.id] || {}, total: (mgmtScores[b.id]?.total ?? computeTotal(mgmtScores[b.id])) }))
    .sort((a, b) => b.total - a.total)

  const winner       = ranked[0]
  const awardedBidder = winner?.bidder
  const hasScores    = Object.keys(mgmtScores).length > 0

  return (
    <div className="space-y-5">

      {/* ── Tender context ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="award">Contract Drafting</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · {tender.budget}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shrink-0">
            <Bot size={13} /> {contractTemplates.length} AI contract templates available
          </div>
        </div>
      </Card>

      {/* ── Stage breadcrumb ── */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {flowStages.map((stage, i) => (
          <div key={stage.label} className="flex items-center shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all
              ${stage.active
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : stage.done
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              {stage.done && !stage.active && <CheckCircle size={10} />}
              {stage.label}
            </div>
            {i < flowStages.length - 1 && <ChevronRight size={13} className="mx-1 text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── No scores yet fallback ── */}
      {!hasScores && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Management score matrix not yet submitted</p>
            <p className="text-xs text-amber-600">The management reviewer must complete and submit the score matrix before contract drafting is available.</p>
          </div>
        </div>
      )}

      {/* ── Score matrix (read-only view) ── */}
      {hasScores && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Hash size={14} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Management Score Matrix</h3>
            <Badge variant="success"><CheckCircle size={10} /> Submitted by Management</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[580px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 w-40">Bidder</th>
                  {CRITERIA.map(c => (
                    <th key={c.id} className="text-center px-2 py-3 font-semibold text-slate-600 min-w-[72px]">
                      <div>{c.short}</div>
                      <div className="text-[10px] font-normal text-slate-400">{Math.round(c.weight * 100)}%</div>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-primary)] min-w-[72px]">
                    Total<div className="text-[10px] font-normal text-slate-400">/100</div>
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600 min-w-[60px]">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranked.map((row, i) => {
                  const isWinner = i === 0
                  return (
                    <tr key={row.bidder.id} className={isWinner ? 'bg-[var(--color-primary)]/5' : 'hover:bg-slate-50/60'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center shrink-0
                            ${isWinner ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {row.bidder.name?.[0] || row.bidder.company?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold truncate max-w-[90px] ${isWinner ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>
                              {row.bidder.name || row.bidder.company}
                            </p>
                            {isWinner && <p className="text-[10px] text-[var(--color-primary)]/70">★ Awarded</p>}
                          </div>
                        </div>
                      </td>
                      {CRITERIA.map(c => {
                        const v = Number(row.scores[c.id]) || 0
                        return (
                          <td key={c.id} className="px-2 py-3 text-center">
                            <span className={`inline-block w-10 text-center font-semibold rounded-md py-0.5
                              ${v >= 8 ? 'text-emerald-700 bg-emerald-50' :
                                v >= 5 ? 'text-amber-700 bg-amber-50' :
                                'text-red-600 bg-red-50'}`}>
                              {v}
                            </span>
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-base font-bold ${isWinner ? 'text-[var(--color-primary)]' : 'text-slate-500'}`}>
                          {row.total.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold
                          ${isWinner ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {isWinner ? <Star size={11} /> : i + 1}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 py-2 text-[10px] text-slate-400 font-medium">Weight</td>
                  {CRITERIA.map(c => (
                    <td key={c.id} className="text-center px-2 py-2">
                      <span className="text-[10px] font-semibold text-slate-500">{Math.round(c.weight * 100)}%</span>
                    </td>
                  ))}
                  <td className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500">100%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {tender.mgmtRemarks && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-600">Management Remarks:</span> {tender.mgmtRemarks}</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Winner profile + contract drafting ── */}
      {hasScores && awardedBidder && (
        <>
          {/* Winner card */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} className="text-[var(--color-primary)]" />
              <h3 className="font-semibold text-slate-800 text-sm">Award Winner — Contract Party</h3>
              <Badge variant="award"><Star size={10} /> Awarded</Badge>
            </div>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-[var(--color-primary)]">
                  {awardedBidder.name?.[0] || awardedBidder.company?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">{awardedBidder.name || awardedBidder.company}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                  {awardedBidder.country && <span className="flex items-center gap-1"><Globe size={11} /> {awardedBidder.country}</span>}
                  {awardedBidder.totalBid && <span>Contract value: <strong className="text-slate-700">{awardedBidder.totalBid}</strong></span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Management Score', value: `${winner.total.toFixed(1)}/100`, icon: Award,    color: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' },
                { label: 'Technical Score',  value: `${Number(winner.scores.tech || 0)}/10`,  icon: Scale,   color: 'text-blue-600 bg-blue-50' },
                { label: 'Commercial Score', value: `${Number(winner.scores.comm || 0)}/10`,  icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 ${s.color.split(' ')[1]}`}>
                  <s.icon size={14} className={`${s.color.split(' ')[0]} mb-1.5`} />
                  <p className={`text-lg font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Template selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileSignature size={16} className="text-[var(--color-primary)]" />
              <h3 className="font-semibold text-slate-800 text-sm">
                Select Contract Template for {awardedBidder.name || awardedBidder.company}
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {contractTemplates.map(t => (
                <Card
                  key={t.id}
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${selected === t.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                  onClick={() => setSelected(t.id)}>
                  {t.recommended && (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-medium">
                      <Star size={11} /> AI Recommended
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                        <FileSignature size={18} className="text-[var(--color-primary)]" />
                      </div>
                      {selected === t.id && (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{t.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{t.pages} pages · {t.type}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{t.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          <Tag size={8} /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1 justify-center"
                      onClick={e => { e.stopPropagation(); setPreview(t) }}>
                      <Eye size={12} /> Preview
                    </Button>
                    <Button variant={selected === t.id ? 'primary' : 'ghost'} size="sm" className="flex-1 justify-center"
                      onClick={e => { e.stopPropagation(); setSelected(t.id) }}>
                      {selected === t.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Drafting */}
          {selected && (
            <Card className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 shrink-0">
                  <Bot size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm mb-1">
                    Draft Contract for {awardedBidder.name || awardedBidder.company}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Template <strong>{contractTemplates.find(t => t.id === selected)?.name}</strong> will be
                    populated with tender scope, {awardedBidder.name || awardedBidder.company}'s agreed terms
                    {awardedBidder.totalBid ? ` (${awardedBidder.totalBid})` : ''}, and all legal clauses from the review.
                  </p>
                  {!sent ? (
                    <Button onClick={() => setSent(true)}>
                      <Send size={14} /> Draft Contract with AI <ChevronRight size={14} />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      <CheckCircle size={15} />
                      Contract drafting in progress for {awardedBidder.name || awardedBidder.company} — estimated 3 minutes.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Preview Modal ── */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={() => setPreview(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800">{preview.name}</h3>
                <p className="text-xs text-slate-400">{preview.pages} pages · {preview.type}</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {['1. Parties & Recitals', '2. Scope of Work', '3. Contract Price & Payment', '4. Delivery & Milestones', '5. Warranties & SLA', '6. Liability & Indemnity', '7. Dispute Resolution', '8. Governing Law'].map(section => (
                <div key={section}>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1">{section}</h4>
                  <div className="h-2 bg-slate-100 rounded mb-1 w-4/5" />
                  <div className="h-2 bg-slate-100 rounded mb-1 w-3/5" />
                  <div className="h-2 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
              <p className="text-xs text-slate-400 italic text-center">
                AI will populate all sections with {awardedBidder?.name || awardedBidder?.company}'s tender data
              </p>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
