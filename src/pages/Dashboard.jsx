import { useState } from 'react'
import { FileText, Clock, CheckCircle, AlertTriangle, Bot, ArrowRight, Activity, ClipboardCheck, BarChart3, Briefcase, Scale, UserCog, Download, TrendingUp, Zap, Shield } from 'lucide-react'
import { exportTenderPDF } from '../utils/exportPDF'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { technicalCriteria } from '../data/mockData'

const statusVariant = {
  draft: 'draft', upload: 'upload',
  tech_eval: 'tech_eval', comm_eval: 'comm_eval',
  legal_review: 'legal_review', mgmt_review: 'mgmt_review',
  award: 'award',
}

const isEvaluator = (roleId) => roleId === 'tech_eval' || roleId === 'comm_eval'

const bidderComplianceByRole = {
  tech_eval: [
    { name: 'TechSolutions Ltd', score: 88.6, compliance: 'compliant' },
    { name: 'InfraCore Systems', score: 82.7, compliance: 'compliant' },
    { name: 'CloudNexus Corp', score: 76.8, compliance: 'partial_compliant' },
    { name: 'DataVault Solutions', score: 69.4, compliance: 'partial_compliant' },
  ],
  comm_eval: [
    { name: 'TechSolutions Ltd', score: 84.4, compliance: 'compliant' },
    { name: 'InfraCore Systems', score: 85.4, compliance: 'compliant' },
    { name: 'CloudNexus Corp', score: 79.1, compliance: 'partial_compliant' },
    { name: 'DataVault Solutions', score: 77.2, compliance: 'partial_compliant' },
  ],
}

const complianceLabelEn = { compliant: 'Compliant', partial_compliant: 'Partial Compliant', non_compliant: 'Non Compliant' }
const complianceLabelAr = { compliant: 'مستوفٍ', partial_compliant: 'مستوفٍ جزئياً', non_compliant: 'غير مستوفٍ' }

const getVisibleTenders = (roleId, tenders, userId) => {
  if (roleId === 'it_admin')       return []
  if (roleId === 'pof')            return tenders.filter(t => t.status === 'draft' || t.status === 'upload')
  if (roleId === 'tech_eval')      return tenders.filter(t => t.status === 'tech_eval'    && t.assignedTechEval?.id    === userId)
  if (roleId === 'comm_eval')      return tenders.filter(t => t.status === 'comm_eval'    && t.assignedCommEval?.id    === userId)
  if (roleId === 'legal_review')   return tenders.filter(t => t.status === 'legal_review')
  if (roleId === 'mgmt_review')    return tenders.filter(t => t.status === 'mgmt_review')
  if (roleId === 'contractor_eng') return tenders.filter(t => t.status === 'award')
  return tenders
}

// Stat cards use a single clean white style — no per-card color variation

const getStatCards = (roleId, tenders, userId) => {
  if (roleId === 'it_admin') return [
    { label: 'System Uptime',    value: '99.9%', icon: Activity,       change: 'Last 30 days',          trend: '+0.1%' },
    { label: 'Active Users',     value: '8',     icon: UserCog,        change: 'Currently registered',  trend: '+2' },
    { label: 'Security Alerts',  value: '0',     icon: Shield,         change: 'All systems normal',    trend: 'Clear' },
    { label: 'Audit Events',     value: '1,284', icon: ClipboardCheck, change: 'This month',            trend: '+284' },
  ]
  const byStatus = (s) => tenders.filter(t => t.status === s)
  const notStarted = (s) => tenders.filter(t => t.status === s && t.evalProgress !== 'in_progress').length
  const inProgress = (s) => tenders.filter(t => t.status === s && t.evalProgress === 'in_progress').length
  const awardCount = byStatus('award').length
  const postIngestion = tenders.filter(t => !['draft', 'upload'].includes(t.status)).length
  const techAISuggestions = byStatus('tech_eval').filter(t => t.evalProgress === 'in_progress').reduce((sum, t) => sum + t.bidders * technicalCriteria.length, 0)

  if (roleId === 'tech_eval') {
    const mine = tenders.filter(t => t.status === 'tech_eval' && t.assignedTechEval?.id === userId)
    return [
      { label: 'Assigned Tenders',   value: String(mine.length),                                                                             icon: ClipboardCheck, change: 'In technical evaluation', trend: 'Active' },
      { label: 'Pending Evaluation', value: String(mine.filter(t => t.evalProgress !== 'in_progress').length),                               icon: Clock,          change: 'Not yet started',         trend: 'Pending' },
      { label: 'In Progress',        value: String(mine.filter(t => t.evalProgress === 'in_progress').length),                               icon: Activity,       change: 'Scoring underway',        trend: 'Live' },
      { label: 'AI Suggestions',     value: String(mine.filter(t => t.evalProgress === 'in_progress').reduce((sum, t) => sum + t.bidders * technicalCriteria.length, 0)), icon: Bot, change: '94% accuracy', trend: '↑ 3%' },
    ]
  }
  if (roleId === 'comm_eval') {
    const mine = tenders.filter(t => t.status === 'comm_eval' && t.assignedCommEval?.id === userId)
    return [
      { label: 'Assigned Tenders',   value: String(mine.length),                                              icon: BarChart3,  change: 'In commercial evaluation',   trend: 'Active' },
      { label: 'Pending Evaluation', value: String(mine.filter(t => t.evalProgress !== 'in_progress').length), icon: Clock,      change: 'Not yet started',            trend: 'Pending' },
      { label: 'In Progress',        value: String(mine.filter(t => t.evalProgress === 'in_progress').length), icon: Activity,   change: 'Scoring underway',           trend: 'Live' },
      { label: 'Bids to Evaluate',   value: String(mine.reduce((sum, t) => sum + t.bidders, 0)),              icon: Briefcase,  change: 'Across assigned tenders',    trend: 'Open' },
    ]
  }
  if (roleId === 'legal_review') return [
    { label: 'Assigned Reviews',   value: String(byStatus('legal_review').length), icon: Scale,         change: 'In legal review',          trend: 'Active' },
    { label: 'Pending Review',     value: String(notStarted('legal_review')),       icon: Clock,         change: 'Not yet started',          trend: 'Pending' },
    { label: 'Under Review',       value: String(inProgress('legal_review')),       icon: Activity,      change: 'Review in progress',       trend: 'Live' },
    { label: 'Risk Items Flagged', value: '6',                                      icon: AlertTriangle, change: 'Across all tenders',       trend: '↑ 2' },
  ]
  if (roleId === 'mgmt_review') return [
    { label: 'Assigned Tenders',    value: String(byStatus('mgmt_review').length), icon: UserCog, change: 'Pending your approval', trend: 'Urgent' },
    { label: 'Not Yet Started',     value: String(notStarted('mgmt_review')),       icon: Clock,   change: 'Awaiting review start', trend: 'Queued' },
    { label: 'Under Review',        value: String(inProgress('mgmt_review')),        icon: Activity,change: 'Decision in progress',  trend: 'Live' },
    { label: 'AI Recommendations',  value: String(byStatus('mgmt_review').length),  icon: Bot,     change: 'Ready for review',      trend: 'Ready' },
  ]
  if (roleId === 'contractor_eng') return [
    { label: 'Tracked Tenders',   value: String(postIngestion), icon: FileText,   change: 'Post-ingestion flow', trend: 'Active' },
    { label: 'Ready for Contract', value: String(awardCount),   icon: Briefcase,  change: 'Award stage',         trend: 'Ready' },
    { label: 'Contracts Drafted',  value: '3',                   icon: CheckCircle,change: 'This quarter',        trend: '+1' },
    { label: 'AI Draft Engine',    value: '99%',                 icon: Bot,        change: 'Uptime this month',   trend: 'Online' },
  ]
  return [
    { label: 'Active Tenders', value: String(tenders.length), icon: FileText,   change: '+2 this month',               trend: '+2' },
    { label: 'In Evaluation',  value: String(byStatus('tech_eval').length + byStatus('comm_eval').length), icon: Clock, change: 'Across both eval stages', trend: 'Active' },
    { label: 'Completed',      value: '12',                    icon: CheckCircle,change: 'This quarter',                trend: '+4' },
    { label: 'AI Extractions', value: '8',                     icon: Bot,        change: '96% accuracy',                trend: '↑ 2%' },
  ]
}

const getActionItems = (roleId, tenders, userId) => {
  if (roleId === 'it_admin') return [
    { label: 'Review system health metrics and performance logs', urgent: false },
    { label: 'Verify user account security configurations', urgent: false },
  ]
  if (roleId === 'tech_eval') {
    const mine = tenders.filter(t => t.status === 'tech_eval' && t.assignedTechEval?.id === userId)
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Complete Technical Evaluation — ${t.id}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress !== 'in_progress').map(t => ({ label: `Start Evaluation — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'comm_eval') {
    const mine = tenders.filter(t => t.status === 'comm_eval' && t.assignedCommEval?.id === userId)
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Complete Commercial Evaluation — ${t.id}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress !== 'in_progress').map(t => ({ label: `Start Evaluation — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'legal_review') {
    const mine = tenders.filter(t => t.status === 'legal_review')
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Finalize Legal Review — ${t.id}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress !== 'in_progress').map(t => ({ label: `Begin Legal Review — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'mgmt_review') {
    const mine = tenders.filter(t => t.status === 'mgmt_review')
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Complete Management Decision — ${t.id}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress !== 'in_progress').map(t => ({ label: `Review Pending — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'contractor_eng') {
    const awarded = tenders.filter(t => t.status === 'award')
    return [
      ...awarded.map((t, i) => ({ label: `Draft contract for ${t.id}: ${t.title}`, urgent: i === 0 })),
      { label: 'Select contract template for awarded tenders', urgent: false },
    ]
  }
  const drafts  = tenders.filter(t => t.status === 'draft')
  const uploads = tenders.filter(t => t.status === 'upload')
  return [
    ...drafts.map(t  => ({ label: `Review AI-generated ITT — ${t.id}: ${t.title}`, urgent: true })),
    ...uploads.map(t => ({ label: `Upload bidder proposals — ${t.id}: ${t.title}`, urgent: false })),
  ]
}

const getAISystemStatus = (tenders) => {
  const draftCount  = tenders.filter(t => t.status === 'draft').length
  const uploadCount = tenders.filter(t => t.status === 'upload').length
  const evalCount   = tenders.filter(t => ['tech_eval', 'comm_eval'].includes(t.status)).length
  const awardCount  = tenders.filter(t => t.status === 'award').length
  const cap = (n, max) => Math.min(Math.round((n / max) * 100), 100)
  return [
    { label: 'ITT Generator',     status: draftCount  > 0 ? 'online' : 'standby', load: cap(draftCount,  3), color: '#3B82F6' },
    { label: 'Extraction Engine', status: uploadCount > 0 ? 'online' : 'standby', load: cap(uploadCount, 3), color: '#F59E0B' },
    { label: 'Evaluation AI',     status: evalCount   > 0 ? 'online' : 'standby', load: cap(evalCount,   8), color: '#10B981' },
    { label: 'Contract Drafter',  status: awardCount  > 0 ? 'online' : 'standby', load: cap(awardCount,  3), color: '#A78BFA' },
  ]
}

const getQuarterlyBars = (tenders) => {
  const labels = ['Jan','Feb','Mar','Apr','May','Jun']
  const counts = labels.map((_, i) =>
    tenders.filter(t => { const d = new Date(t.created); return d.getFullYear() === 2025 && d.getMonth() === i }).length
  )
  const max = Math.max(...counts, 1)
  return counts.map((c, i) => ({ pct: Math.round((c / max) * 100), label: labels[i], count: c }))
}

const getTenderListLabel = (roleId) => {
  if (roleId === 'it_admin')       return 'System Overview'
  if (roleId === 'pof')            return 'Pending Review & Ingestion'
  if (roleId === 'tech_eval' || roleId === 'comm_eval') return 'My Assigned Tenders'
  if (roleId === 'legal_review')   return 'Assigned for Legal Review'
  if (roleId === 'mgmt_review')    return 'Pending Management Approval'
  if (roleId === 'contractor_eng') return 'Post-Ingestion Tenders'
  return 'Active Tenders'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders } = useTenders()
  const { lang, t } = useLanguage()
  const { isDark } = useTheme()
  const clr = {
    cardTitle:   isDark ? '#F1F5F9' : '#0F172A',
    cardSub:     isDark ? '#64748B' : '#64748B',
    cardBorder:  isDark ? 'rgba(255,255,255,0.08)' : 'var(--color-border)',
    cardBg:      'var(--color-surface)',
    text:        isDark ? '#CBD5E1' : '#334155',
    textMuted:   isDark ? '#475569' : '#64748B',
    barTrack:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    itemBg:      isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    itemBorder:  isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
    itemHover:   isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    urgentBg:    isDark ? 'rgba(245,158,11,0.08)'  : 'rgba(245,158,11,0.06)',
    urgentBorder:isDark ? 'rgba(245,158,11,0.25)'  : 'rgba(245,158,11,0.3)',
    urgentHover: isDark ? 'rgba(245,158,11,0.14)'  : 'rgba(245,158,11,0.12)',
    urgentText:  isDark ? '#FCD34D' : '#92400E',
    normalText:  isDark ? '#94A3B8' : '#475569',
    dot:         isDark ? '#334155' : '#CBD5E1',
    barLabel:    isDark ? '#94A3B8' : '#64748B',
    barLow:      isDark ? 'linear-gradient(180deg, #475569, #334155)' : 'linear-gradient(180deg, #CBD5E1, #94A3B8)',
  }
  const roleId = user?.role?.id
  const complianceLabel = lang === 'ar' ? complianceLabelAr : complianceLabelEn

  const visibleTenders = getVisibleTenders(roleId, tenders, user?.id)
  const statCards = getStatCards(roleId, tenders, user?.id)
  const actionItems = getActionItems(roleId, tenders, user?.id)
  const aiStatusRaw = getAISystemStatus(tenders)
  // Normalise all module colors to blue — no decorative multi-color
  const aiStatus = aiStatusRaw.map(s => ({ ...s, color: '#2563EB' }))
  const quarterlyBars = getQuarterlyBars(tenders)
  const [pofTab, setPofTab] = useState('approval') // 'approval' | 'ingestion'
  const urgentCount = actionItems.filter(a => a.urgent).length
  const hasTenderNav = !['tech_eval', 'comm_eval', 'it_admin'].includes(roleId)

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 60%, #2563EB 100%)',
          boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
        }}>
        {/* grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* subtle blue glow — no purple */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <Zap size={16} className="text-yellow-300" />
              </div>
              <span className="text-xs font-bold tracking-widest text-blue-200 uppercase">AI Procurement Dashboard</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              Good morning, {user?.name} 👋
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              {urgentCount > 0
                ? <><span className="text-yellow-300 font-semibold">{urgentCount} urgent items</span> need your attention today.</>
                : 'Everything is on track — no urgent items today.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <div className="text-2xl font-extrabold text-white">{tenders.length}</div>
              <div className="text-[10px] text-blue-200 font-semibold tracking-wide uppercase">Tenders</div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <div className="text-2xl font-extrabold text-white">96%</div>
              <div className="text-[10px] text-blue-200 font-semibold tracking-wide uppercase">AI Accuracy</div>
            </div>
            {roleId === 'pof' && (
              <Button onClick={() => navigate('/create-itt')}
                style={{ background: 'rgba(255,255,255,0.95)', color: '#1D4ED8', fontWeight: 700 }}>
                <Bot size={15} /> New ITT with AI
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="rounded-2xl p-5 bg-white border border-slate-200"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{s.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 leading-none mb-1">{s.value}</p>
                <p className="text-xs text-slate-400">{s.change}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                <s.icon size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <TrendingUp size={11} style={{ color: 'var(--color-primary)' }} />
              <span className="text-[11px] font-semibold text-slate-500">{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Tender List ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: clr.cardBg, border: `1px solid ${clr.cardBorder}`, boxShadow: 'var(--color-shadow)' }}>

          <div className="px-5 py-4"
            style={{ borderBottom: `1px solid ${clr.cardBorder}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(37,99,235,0.15)' }}>
                  <FileText size={15} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: clr.cardTitle }}>{getTenderListLabel(roleId)}</h3>
                  <p className="text-[10px]" style={{ color: clr.cardSub }}>{visibleTenders.length} tender{visibleTenders.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {hasTenderNav && (
                <button
                  onClick={() => navigate('/tenders')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--color-primary)', background: 'rgba(37,99,235,0.1)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(37,99,235,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(37,99,235,0.1)'}>
                  View All <ArrowRight size={12} />
                </button>
              )}
            </div>
            {roleId === 'pof' && (
              <div className="flex items-center gap-1 mt-3 bg-slate-100 rounded-xl p-1 w-fit" style={{ background: clr.itemBg }}>
                {[
                  { id: 'approval',  label: 'Pending Approval', count: visibleTenders.filter(t => t.status === 'draft').length },
                  { id: 'ingestion', label: 'Ingestion',         count: visibleTenders.filter(t => t.status === 'upload').length },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setPofTab(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: pofTab === tab.id ? 'var(--color-surface)' : 'transparent',
                      color: pofTab === tab.id ? clr.cardTitle : clr.textMuted,
                      boxShadow: pofTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}>
                    {tab.label}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: pofTab === tab.id ? 'rgba(37,99,235,0.12)' : 'transparent', color: pofTab === tab.id ? 'var(--color-primary)' : clr.textMuted }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {(roleId === 'pof' ? visibleTenders.filter(t => pofTab === 'approval' ? t.status === 'draft' : t.status === 'upload') : visibleTenders).length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: clr.itemBg }}>
                  <FileText size={20} style={{ color: clr.textMuted }} />
                </div>
                <p className="text-sm" style={{ color: clr.textMuted }}>No tenders assigned at this stage.</p>
              </div>
            ) : (
              (roleId === 'pof'
                ? visibleTenders.filter(t => pofTab === 'approval' ? t.status === 'draft' : t.status === 'upload')
                : visibleTenders
              ).map((tender, idx) => (
                <div key={tender.id}
                  className="px-5 py-4 transition-colors"
                  style={{
                    borderBottom: idx < visibleTenders.length - 1 ? `1px solid ${clr.cardBorder}` : 'none',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = clr.itemHover}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{ background: clr.itemBg, color: clr.textMuted, border: `1px solid ${clr.itemBorder}` }}>{tender.id}</span>
                        <Badge variant={statusVariant[tender.status]}>{tender.stage}</Badge>
                        {tender.evalProgress === 'not_started' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: clr.itemBg, color: clr.textMuted }}>Not Started</span>
                        )}
                        {tender.evalProgress === 'in_progress' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.12)', color: isDark ? '#FCD34D' : '#D97706', border: '1px solid rgba(245,158,11,0.3)' }}>In Progress</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold truncate" style={{ color: clr.cardTitle }}>{tender.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: clr.cardSub }}>
                        {tender.department} · Deadline: {tender.deadline} · {tender.budget}
                      </p>

                      {/* Assigned evaluators chips */}
                      {(tender.assignedTechEval || tender.assignedCommEval) && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {tender.assignedTechEval && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(5,150,105,0.12)', color: '#059669', border: '1px solid rgba(5,150,105,0.25)' }}>
                              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                                {tender.assignedTechEval.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                              Tech: {tender.assignedTechEval.name}
                              {roleId === 'tech_eval' && <span className="ml-0.5 opacity-70">(you)</span>}
                            </span>
                          )}
                          {tender.assignedCommEval && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(37,99,235,0.1)', color: '#1D4ED8', border: '1px solid rgba(37,99,235,0.2)' }}>
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                                {tender.assignedCommEval.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                              Comm: {tender.assignedCommEval.name}
                              {roleId === 'comm_eval' && <span className="ml-0.5 opacity-70">(you)</span>}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {roleId === 'pof' && tender.status === 'upload' && (
                        <button onClick={() => exportTenderPDF(tender)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                          style={{ background: clr.itemBg, color: clr.textMuted, border: `1px solid ${clr.itemBorder}` }}
                          onMouseOver={e => e.currentTarget.style.background = clr.itemHover}
                          onMouseOut={e => e.currentTarget.style.background = clr.itemBg}>
                          <Download size={11} /> Export
                        </button>
                      )}
                      {roleId === 'pof' && (
                        <button onClick={() => navigate(tender.status === 'draft' ? `/create-itt/${tender.id}` : `/upload/${tender.id}`)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-primary)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(37,99,235,0.22)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}>
                          Explore →
                        </button>
                      )}
                      {isEvaluator(roleId) && (
                        <button onClick={() => navigate(`/${roleId === 'tech_eval' ? 'technical-eval' : 'commercial-eval'}/${tender.id}`)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-primary)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(37,99,235,0.22)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}>
                          Open Eval →
                        </button>
                      )}
                      {roleId === 'legal_review' && (
                        <button onClick={() => navigate(`/legal-review/${tender.id}`)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-primary)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(37,99,235,0.22)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}>
                          Open Review →
                        </button>
                      )}
                      {roleId === 'mgmt_review' && (
                        <button onClick={() => navigate(`/mgmt-review/${tender.id}`)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-primary)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(37,99,235,0.22)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}>
                          Open Review →
                        </button>
                      )}
                      {roleId === 'contractor_eng' && (
                        <button onClick={() => navigate(`/contract/${tender.id}`)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-primary)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(37,99,235,0.22)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}>
                          Contract Draft →
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Column ────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* AI System Status */}
          <div className="rounded-2xl p-5"
            style={{ background: clr.cardBg, border: `1px solid ${clr.cardBorder}`, boxShadow: 'var(--color-shadow)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(37,99,235,0.1)' }}>
                <Bot size={15} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: clr.cardTitle }}>{t('dash.systemOverview')}</h3>
                <p className="text-[10px]" style={{ color: clr.cardSub }}>Real-time AI module status</p>
              </div>
            </div>

            <div className="space-y-3">
              {aiStatus.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full"
                        style={{
                          background: s.status === 'online' ? s.color : clr.dot,
                          boxShadow: s.status === 'online' ? `0 0 8px ${s.color}` : 'none',
                        }} />
                      <span className="text-xs font-medium" style={{ color: clr.text }}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold" style={{ color: s.status === 'online' ? s.color : clr.textMuted }}>
                        {s.status === 'online' ? 'ONLINE' : 'STANDBY'}
                      </span>
                      <span className="text-[10px]" style={{ color: clr.textMuted }}>{s.load}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: clr.barTrack }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.load || 3}%`,
                        background: s.status === 'online'
                          ? `linear-gradient(90deg, ${s.color}, ${s.color}cc)`
                          : clr.dot,
                        boxShadow: s.status === 'online' ? `0 0 8px ${s.color}80` : 'none',
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Required */}
          <div className="rounded-2xl p-5"
            style={{ background: clr.cardBg, border: `1px solid ${clr.cardBorder}`, boxShadow: 'var(--color-shadow)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(37,99,235,0.1)' }}>
                <AlertTriangle size={15} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: clr.cardTitle }}>{t('dash.actionItems')}</h3>
                {urgentCount > 0 && (
                  <p className="text-[10px] font-semibold" style={{ color: isDark ? '#FCD34D' : '#D97706' }}>{urgentCount} urgent</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {actionItems.map((a, i) => (
                <div key={i}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: a.urgent ? clr.urgentBg  : clr.itemBg,
                    border:     a.urgent ? `1px solid ${clr.urgentBorder}` : `1px solid ${clr.itemBorder}`,
                  }}
                  onMouseOver={e => e.currentTarget.style.background = a.urgent ? clr.urgentHover : clr.itemHover}
                  onMouseOut={e => e.currentTarget.style.background  = a.urgent ? clr.urgentBg    : clr.itemBg}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      background: a.urgent ? '#F59E0B' : clr.dot,
                      boxShadow: a.urgent ? '0 0 6px rgba(245,158,11,0.8)' : 'none',
                    }} />
                  <span className="text-xs leading-relaxed" style={{ color: a.urgent ? clr.urgentText : clr.normalText }}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tender Trend Chart */}
          <div className="rounded-2xl p-5"
            style={{ background: clr.cardBg, border: `1px solid ${clr.cardBorder}`, boxShadow: 'var(--color-shadow)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(37,99,235,0.1)' }}>
                <Activity size={15} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: clr.cardTitle }}>{t('common.thisMonth')}</h3>
                <p className="text-[10px]" style={{ color: clr.cardSub }}>Tender activity — 2025</p>
              </div>
            </div>

            <div className="flex items-end gap-1.5 h-20 mb-2">
              {quarterlyBars.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg transition-all relative group"
                    style={{
                      height: `${Math.max(bar.pct, 8)}%`,
                      background: bar.pct > 0
                        ? 'linear-gradient(180deg, #60A5FA, #2563EB)'
                        : clr.barLow,
                      boxShadow: bar.pct > 0
                        ? '0 0 8px rgba(37,99,235,0.25)'
                        : 'none',
                    }}>
                    {bar.count > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold"
                        style={{ color: clr.barLabel }}>{bar.count}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {quarterlyBars.map(bar => (
                <span key={bar.label} className="flex-1 text-center text-[9px] font-semibold" style={{ color: clr.textMuted }}>{bar.label}</span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
