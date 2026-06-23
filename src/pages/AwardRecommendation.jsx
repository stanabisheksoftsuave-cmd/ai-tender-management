import { useState } from 'react'
import {
  Award, CheckCircle, Bot, Star, AlertTriangle, ThumbsUp, ThumbsDown,
  FileText, Scale, ChevronRight, ChevronDown, ChevronUp, ShieldOff, Hash,
  ArrowLeft, Download, BarChart3, Activity
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { bidders as seedBidders } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'

// ── Scoring criteria with weights ────────────────────────────────────────────
const CRITERIA = [
  { id: 'tech',    label: 'Technical Capability',       short: 'Technical',   weight: 0.25 },
  { id: 'comm',    label: 'Commercial Competitiveness', short: 'Commercial',  weight: 0.20 },
  { id: 'finance', label: 'Financial Stability',        short: 'Financial',   weight: 0.15 },
  { id: 'icv',     label: 'Local Content / ICV',        short: 'ICV',         weight: 0.15 },
  { id: 'perf',    label: 'Past Performance',           short: 'Performance', weight: 0.15 },
  { id: 'risk',    label: 'Risk Assessment',            short: 'Risk',        weight: 0.10 },
]

// sum(weight * score_0_to_10) * 10  →  0–100
function computeTotal(scoreMap) {
  return Math.round(
    CRITERIA.reduce((sum, c) => sum + c.weight * (Number(scoreMap?.[c.id]) || 0), 0) * 10 * 10
  ) / 10
}

export default function AwardRecommendation() {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { tenders, advanceTender, updateTender } = useTenders()
  const tender = tenders.find(t => t.id === tenderId)

  // { [bidderId]: { [criteriaId]: number 0–10 } }
  const [scores,   setScores]   = useState({})
  const [remarks,  setRemarks]  = useState('')
  const [approved, setApproved] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [expandCriteria,  setExpandCriteria]  = useState(false)
  const [expandedBidder,  setExpandedBidder]  = useState(null)

  if (user?.role?.id !== 'mgmt_review') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Management Reviewers can access this page.</p>
    </div>
  )

  if (!tenderId) return (
    <TenderSelectList
      tenders={tenders}
      status="mgmt_review"
      basePath="/mgmt-review"
      title="Management Review"
      description="Select a tender to review and approve for award"
      emptyText="No tenders pending management review"
    />
  )

  if (!tender || tender.status !== 'mgmt_review') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )

  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  const setScore = (bidderId, criteriaId, raw) => {
    const num = raw === '' ? '' : Math.min(10, Math.max(0, Number(raw)))
    setScores(prev => ({
      ...prev,
      [bidderId]: { ...(prev[bidderId] || {}), [criteriaId]: isNaN(num) ? '' : num },
    }))
  }

  const totals = tenderBidders.map(b => ({
    bidder: b,
    total:  computeTotal(scores[b.id]),
    scored: CRITERIA.filter(c => scores[b.id]?.[c.id] !== undefined && scores[b.id]?.[c.id] !== '').length,
  }))

  const sorted      = [...totals].sort((a, b) => b.total - a.total)
  const winner      = sorted[0]
  const allScored   = tenderBidders.every(b => CRITERIA.every(c => {
    const v = scores[b.id]?.[c.id]
    return v !== undefined && v !== ''
  }))

  const handleApprove = () => {
    const mgmtScores = {}
    tenderBidders.forEach(b => { mgmtScores[b.id] = { ...(scores[b.id] || {}), total: computeTotal(scores[b.id]) } })
    updateTender(tender.id, { mgmtScores, mgmtRemarks: remarks, mgmtWinnerId: winner?.bidder?.id })
    advanceTender(tender.id)
    setApproved(true)
  }

  const openReportWindow = (title, bodyHtml) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>' + title + '</title>' +
      '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:\'Segoe UI\',Arial,sans-serif;background:#f1f5f9;padding:32px;color:#1e293b}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;padding:10px 12px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0}@media print{.no-print{display:none}body{background:white;padding:0}.page{box-shadow:none;border-radius:0}}</style>' +
      '</head><body>' + bodyHtml +
      '<button class="no-print" onclick="window.print()" style="position:fixed;bottom:24px;right:24px;background:#2563eb;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(37,99,235,.4)">&#8659; Print / Save as PDF</button>' +
      '</body></html>'
    )
    win.document.close()
  }

  const handleDownloadReport = () => {
    const winnerName = winner?.total > 0 ? winner.bidder.name : (tenderBidders.find(b => b.recommended)?.name || tenderBidders[0]?.name)
    const winnerScore = winner?.total > 0 ? winner.total + '/100' : '—'
    const criteriaHeaders = CRITERIA.map(c => '<th style="text-align:center">' + c.short + ' (' + Math.round(c.weight * 100) + '%)</th>').join('')
    const bidderRows = tenderBidders.map((b, idx) => {
      const t = computeTotal(scores[b.id])
      const rank = sorted.findIndex(s => s.bidder.id === b.id) + 1
      const cells = CRITERIA.map(c => '<td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">' + (scores[b.id]?.[c.id] ?? '—') + '</td>').join('')
      return '<tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:600">' + rank + '. ' + b.name + '</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b">' + (b.country || '—') + '</td>' + cells + '<td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:' + (rank === 1 && t > 0 ? '#059669' : '#1e293b') + '">' + (t > 0 ? t : '—') + '</td></tr>'
    }).join('')
    const ts = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    openReportWindow(
      'Management Review Report — ' + tender.id,
      '<div class="page" style="max-width:960px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">' +
      '<div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;padding:40px 48px">' +
      '<div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Management Review Report</div>' +
      '<div style="font-size:22px;font-weight:700;margin-bottom:4px">' + tender.title + '</div>' +
      '<div style="font-size:13px;opacity:.8">' + tender.department + '</div>' +
      '<div style="display:flex;gap:32px;margin-top:24px;flex-wrap:wrap">' +
      '<div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Tender ID</div><div style="font-size:13px;font-weight:600">' + tender.id + '</div></div>' +
      '<div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Budget</div><div style="font-size:13px;font-weight:600">' + tender.budget + '</div></div>' +
      '<div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Deadline</div><div style="font-size:13px;font-weight:600">' + tender.deadline + '</div></div>' +
      '<div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Bidders</div><div style="font-size:13px;font-weight:600">' + tenderBidders.length + '</div></div>' +
      '</div></div>' +
      '<div style="padding:40px 48px">' +
      '<div style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:10px;padding:16px 20px;margin-bottom:32px;display:flex;align-items:center;gap:12px"><span style="font-size:18px">&#9989;</span><div><div style="font-size:13px;font-weight:700;color:#065f46">Legal Review — Final Approval Cleared</div><div style="font-size:11px;color:#047857;margin-top:2px">All legal criteria verified · Tender advanced to management review</div></div></div>' +
      '<div style="margin-bottom:32px"><div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Bidder Scoring Summary</div>' +
      '<table><thead><tr><th>Bidder</th><th>Country</th>' + criteriaHeaders + '<th style="text-align:center">Total</th></tr></thead><tbody>' + bidderRows + '</tbody></table></div>' +
      '<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;padding:20px;margin-bottom:32px"><div style="font-size:13px;font-weight:600;color:#4c1d95;margin-bottom:8px">&#129302; AI Award Recommendation</div><div style="font-size:13px;color:#1e293b;line-height:1.6">Based on all assessments, the AI recommends awarding to <strong style="color:#2563eb">' + winnerName + '</strong> — Combined score: <strong>' + winnerScore + '</strong>.</div><div style="font-size:11px;color:#64748b;margin-top:10px">Confidence: 94% · 60% Technical / 40% Commercial weighting</div></div>' +
      (remarks ? '<div style="margin-bottom:32px"><div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Management Remarks</div><div style="background:#f8fafc;border-radius:10px;padding:16px 20px;font-size:13px;line-height:1.6">' + remarks + '</div></div>' : '') +
      '<div style="font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px">Generated by AI Tender Management System · ' + ts + '</div>' +
      '</div></div>'
    )
  }

  const handleFullEvaluation = () => {
    const bidderRows = tenderBidders.map(b => {
      const mgmtTotal = computeTotal(scores[b.id])
      const techScore = b.techScore ?? 75
      const commScore = b.commScore ?? 72
      const combined  = Math.round(techScore * 0.6 + commScore * 0.4)
      const isWinner  = b.recommended || (winner?.total > 0 && winner.bidder.id === b.id)
      return '<tr style="' + (isWinner ? 'background:#f0fdf4' : '') + '">' +
        '<td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-weight:600">' + (isWinner ? '&#127942; ' : '') + b.name + (isWinner ? ' <span style="font-size:10px;background:#d1fae5;color:#059669;border-radius:99px;padding:2px 8px;margin-left:6px;font-weight:700">Recommended</span>' : '') + '</td>' +
        '<td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#64748b">' + (b.country || '—') + '</td>' +
        '<td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:600;color:#2563eb">' + techScore + '</td>' +
        '<td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:600;color:#7c3aed">' + commScore + '</td>' +
        '<td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:600;color:#0891b2">' + (mgmtTotal > 0 ? mgmtTotal : '—') + '</td>' +
        '<td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:' + (isWinner ? '#059669' : '#1e293b') + ';font-size:14px">' + combined + '</td>' +
        '<td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#64748b">' + (b.totalBid || '—') + '</td>' +
        '</tr>'
    }).join('')
    const recommendedName = winner?.total > 0 ? winner.bidder.name : (tenderBidders.find(b => b.recommended)?.name || tenderBidders[0]?.name)
    const ts = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    openReportWindow(
      'Full Evaluation — ' + tender.id,
      '<div class="page" style="max-width:1000px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">' +
      '<div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);color:white;padding:40px 48px">' +
      '<div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Comprehensive Evaluation Report</div>' +
      '<div style="font-size:22px;font-weight:700;margin-bottom:4px">' + tender.title + '</div>' +
      '<div style="font-size:13px;opacity:.8">' + tender.department + ' · ' + tender.id + ' · ' + tender.budget + '</div>' +
      '</div>' +
      '<div style="padding:40px 48px">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:32px">' +
      '<div style="background:#eff6ff;border-radius:10px;padding:16px;border:1px solid #bfdbfe"><div style="font-size:10px;text-transform:uppercase;color:#3b82f6;font-weight:700;margin-bottom:4px">Technical Evaluation</div><div style="font-size:18px;font-weight:700;color:#1d4ed8">60% Weight</div><div style="font-size:11px;color:#3b82f6;margin-top:4px">&#10003; Completed</div></div>' +
      '<div style="background:#f5f3ff;border-radius:10px;padding:16px;border:1px solid #c4b5fd"><div style="font-size:10px;text-transform:uppercase;color:#7c3aed;font-weight:700;margin-bottom:4px">Commercial Evaluation</div><div style="font-size:18px;font-weight:700;color:#6d28d9">40% Weight</div><div style="font-size:11px;color:#7c3aed;margin-top:4px">&#10003; Completed</div></div>' +
      '<div style="background:#d1fae5;border-radius:10px;padding:16px;border:1px solid #6ee7b7"><div style="font-size:10px;text-transform:uppercase;color:#059669;font-weight:700;margin-bottom:4px">Legal Review</div><div style="font-size:18px;font-weight:700;color:#047857">Cleared</div><div style="font-size:11px;color:#059669;margin-top:4px">&#10003; All criteria passed</div></div>' +
      '</div>' +
      '<div style="margin-bottom:32px"><div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Consolidated Bidder Scorecard</div>' +
      '<table><thead><tr><th>Bidder</th><th>Country</th><th style="text-align:center;color:#2563eb">Technical (60%)</th><th style="text-align:center;color:#7c3aed">Commercial (40%)</th><th style="text-align:center;color:#0891b2">Mgmt Score</th><th style="text-align:center">Combined Final</th><th>Bid Price</th></tr></thead><tbody>' + bidderRows + '</tbody></table></div>' +
      '<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;padding:20px;margin-bottom:24px"><div style="font-size:13px;font-weight:600;color:#4c1d95;margin-bottom:8px">&#129302; AI Award Recommendation</div><div style="font-size:13px;color:#1e293b;line-height:1.6">Based on all technical, commercial, and legal assessments, the AI recommends awarding the contract to <strong style="color:#2563eb">' + recommendedName + '</strong>. Superior technical capability and methodology alignment outweigh commercial considerations.</div><div style="font-size:11px;color:#64748b;margin-top:12px"><span style="background:#ede9fe;color:#6d28d9;padding:3px 10px;border-radius:99px;font-weight:600">Confidence: 94%</span> &nbsp; 60% Technical / 40% Commercial weighting</div></div>' +
      '<div style="font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px">Generated by AI Tender Management System · ' + ts + '</div>' +
      '</div></div>'
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Dashboard
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="mgmt_review">Management Review</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · {tender.budget}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 bg-white transition-colors">
              <Download size={12} /> Download Report
            </button>
            <button
              onClick={handleFullEvaluation}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 bg-white transition-colors">
              <BarChart3 size={12} /> Full Evaluation
            </button>
          </div>
        </div>
      </Card>

      {/* ── Legal clearance banner ── */}
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <Scale size={15} className="text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">Legal Review — Final Approval Cleared</p>
          <p className="text-xs text-green-600">All legal criteria verified · Legal review submitted · Tender advanced to management</p>
        </div>
        <Badge variant="success"><CheckCircle size={10} /> Cleared</Badge>
      </div>

      {/* ── Criteria legend ── */}
      <Card className="overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setExpandCriteria(p => !p)}>
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-[var(--color-primary)]" />
            <span className="text-sm font-semibold text-slate-800">Scoring Criteria &amp; Weights</span>
            <span className="text-[10px] text-slate-400">— Enter 0–10 per bidder per criterion</span>
          </div>
          <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandCriteria ? 'rotate-90' : ''}`} />
        </button>
        {expandCriteria && (
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CRITERIA.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[var(--color-primary)]">{Math.round(c.weight * 100)}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{c.label}</p>
                    <p className="text-[10px] text-slate-400">Weight: {Math.round(c.weight * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Score Matrix (accordion format) ── */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award size={15} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Bidder Score Matrix</h3>
            <span className="text-[10px] text-slate-400">— Click a bidder to score</span>
          </div>
          <span className="text-xs text-slate-400">
            {tenderBidders.filter(b => CRITERIA.every(c => scores[b.id]?.[c.id] !== undefined && scores[b.id]?.[c.id] !== '')).length}
            /{tenderBidders.length} bidders fully scored
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tenderBidders.map((bidder) => {
            const total       = computeTotal(scores[bidder.id])
            const scoredCount = CRITERIA.filter(c => scores[bidder.id]?.[c.id] !== undefined && scores[bidder.id]?.[c.id] !== '').length
            const fullyScored = scoredCount === CRITERIA.length
            const rank        = sorted.findIndex(s => s.bidder.id === bidder.id)
            const isOpen      = expandedBidder === bidder.id

            return (
              <div key={bidder.id}>
                {/* ── Row header ── */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpandedBidder(isOpen ? null : bidder.id)}>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0
                    ${fullyScored && rank === 0 ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                    {bidder.name?.[0]}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{bidder.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {bidder.country}
                      {fullyScored
                        ? ` · ${rank === 0 ? '★ Top scorer' : `Rank #${rank + 1}`}`
                        : ` · ${scoredCount}/${CRITERIA.length} criteria scored`}
                    </p>
                  </div>

                  {/* Mini score bars */}
                  <div className="hidden md:flex items-end gap-1.5 shrink-0">
                    {CRITERIA.map(c => {
                      const val    = scores[bidder.id]?.[c.id]
                      const filled = val !== undefined && val !== ''
                      const nv     = Number(val)
                      return (
                        <div key={c.id} className="flex flex-col items-center gap-0.5">
                          <div className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ background: !filled ? '#f1f5f9' : nv >= 8 ? '#d1fae5' : nv >= 5 ? '#fef3c7' : '#fee2e2' }}>
                            <span className="text-[9px] font-bold"
                              style={{ color: !filled ? '#94a3b8' : nv >= 8 ? '#059669' : nv >= 5 ? '#d97706' : '#dc2626' }}>
                              {filled ? nv : '—'}
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-400">{c.short.slice(0, 3)}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Total badge */}
                  <div className={`shrink-0 min-w-[56px] text-center rounded-xl py-1.5 px-3 font-bold text-sm
                    ${!fullyScored ? 'text-slate-300 bg-slate-50 border border-slate-100' :
                      rank === 0 ? 'bg-[var(--color-primary)] text-white' :
                      total >= 70 ? 'bg-slate-100 text-slate-700' :
                      'bg-slate-50 text-slate-400'}`}>
                    {fullyScored ? total.toFixed(1) : '—'}
                  </div>

                  {isOpen
                    ? <ChevronUp size={14} className="text-slate-400 shrink-0" />
                    : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                </button>

                {/* ── Expanded scoring panel ── */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CRITERIA.map(c => {
                        const val    = scores[bidder.id]?.[c.id]
                        const filled = val !== undefined && val !== ''
                        const nv     = Number(val)
                        const contrib = filled ? Math.round(c.weight * nv * 10 * 10) / 10 : null
                        return (
                          <div key={c.id} className={`rounded-xl border p-3.5 transition-colors
                            ${!filled     ? 'bg-white border-slate-200' :
                              nv >= 8     ? 'bg-emerald-50 border-emerald-200' :
                              nv >= 5     ? 'bg-amber-50 border-amber-200' :
                              'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-xs font-semibold text-slate-700">{c.label}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Weight: {Math.round(c.weight * 100)}%</p>
                              </div>
                              {contrib !== null && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                                  ${nv >= 8 ? 'bg-emerald-100 text-emerald-700' :
                                    nv >= 5 ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-600'}`}>
                                  +{contrib}pts
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.5}
                                value={val ?? ''}
                                onChange={e => setScore(bidder.id, c.id, e.target.value)}
                                placeholder="0–10"
                                className={`w-20 text-center text-base font-bold rounded-lg border px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-colors
                                  ${!filled ? 'border-slate-200 text-slate-400 bg-white' :
                                    nv >= 8 ? 'border-emerald-300 text-emerald-700 bg-white' :
                                    nv >= 5 ? 'border-amber-300 text-amber-700 bg-white' :
                                    'border-red-300 text-red-600 bg-white'}`}
                              />
                              <span className="text-xs text-slate-400">/10</span>
                            </div>
                            {filled && (
                              <div className="mt-2.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500
                                  ${nv >= 8 ? 'bg-emerald-400' : nv >= 5 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${nv * 10}%` }} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Row total */}
                    {fullyScored && (
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-500">Weighted total:</span>
                        <span className={`text-sm font-bold px-4 py-1.5 rounded-lg
                          ${rank === 0 ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-700'}`}>
                          {total.toFixed(1)} / 100 {rank === 0 && '  ★ Top Score'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Weight footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] text-slate-400 font-medium">Criteria Weight</span>
          <div className="flex items-center gap-3">
            {CRITERIA.map(c => (
              <span key={c.id} className="text-[10px] text-slate-500">{c.short}: <strong>{Math.round(c.weight * 100)}%</strong></span>
            ))}
            <span className="text-[10px] font-bold text-[var(--color-primary)]">Total: 100%</span>
          </div>
        </div>
      </Card>

      {/* ── Ranking preview (visible once any bidder is scored) ── */}
      {totals.some(t => t.scored > 0) && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Star size={14} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Live Ranking</h3>
            <span className="text-[10px] text-slate-400">(updates as you score)</span>
          </div>
          <div className="p-4 space-y-2">
            {sorted.map((s, i) => {
              const pct = winner?.total > 0 ? (s.total / winner.total) * 100 : 0
              return (
                <div key={s.bidder.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                    ${i === 0 && s.scored === CRITERIA.length ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 truncate">{s.bidder.name || s.bidder.company}</span>
                      <span className={`text-xs font-bold shrink-0 ml-2 ${i === 0 && s.scored === CRITERIA.length ? 'text-[var(--color-primary)]' : 'text-slate-500'}`}>
                        {s.total.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${i === 0 ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 w-12 text-right shrink-0">{s.scored}/{CRITERIA.length} scored</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── Approval Panel ── */}
      <Card className={`p-5 transition-opacity ${!allScored ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={14} className={allScored ? 'text-amber-500' : 'text-slate-400'} />
          <h3 className="text-sm font-semibold text-slate-800">Management Decision</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {allScored
            ? <>Score matrix complete. <strong className="text-slate-700">{winner?.bidder?.name || winner?.bidder?.company}</strong> leads with <strong>{winner?.total.toFixed(1)}/100</strong>. Approving will initiate contract drafting.</>
            : 'Complete all bidder scores above to unlock the approval decision.'}
        </p>

        {!approved && !rejected ? (
          <div className="space-y-3">
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={!allScored}
              rows={2}
              placeholder="Add management remarks or justification..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <div className="flex gap-2">
              <Button className="flex-1 justify-center" disabled={!allScored} onClick={handleApprove}>
                <ThumbsUp size={13} /> Approve &amp; Award
              </Button>
              <Button variant="danger" size="sm" className="flex-1 justify-center" disabled={!allScored} onClick={() => setRejected(true)}>
                <ThumbsDown size={13} /> Reject Award
              </Button>
            </div>
          </div>
        ) : approved ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle size={18} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Award Approved</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Contract awarded to <strong>{winner?.bidder?.name || winner?.bidder?.company}</strong> — score matrix saved. Contract drafting now available.
                </p>
              </div>
            </div>
            <Button className="w-full justify-center" onClick={() => navigate('/contract')}>
              Proceed to Contract Draft <ChevronRight size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Award Rejected</p>
              <p className="text-xs text-red-600 mt-0.5">Tender returned for re-evaluation. Audit log updated.</p>
            </div>
          </div>
        )}

        {!allScored && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle size={12} />
            {tenderBidders.filter(b => !CRITERIA.every(c => scores[b.id]?.[c.id] !== undefined && scores[b.id]?.[c.id] !== '')).length} bidder(s) still need complete scores before approving.
          </div>
        )}
      </Card>

    </div>
  )
}
