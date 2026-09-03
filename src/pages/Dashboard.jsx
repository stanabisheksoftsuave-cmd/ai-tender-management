import { useState } from 'react'
import {
  FileText, Clock, ArrowRight,
  Activity, ClipboardCheck, BarChart3, Briefcase, UserCog,
  Download,
  Eye, MoreVertical, Users, Shield,
  ChevronRight
} from 'lucide-react'

// Bulb SVG — uses currentColor so any style.color is inherited
const BulbIcon = ({ size = 16, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 15 16" fill="none"
    xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <path d="M5.5525 11.6667H9.44667M7.5 0V0.833333M12.8033 2.19667L12.2142 2.78583M15 7.5H14.1667M0.833333 7.5H0M2.78583 2.78583L2.19667 2.19667M4.55333 10.4467C3.97072 9.8639 3.574 9.12147 3.41331 8.31325C3.25263 7.50502 3.33521 6.6673 3.65061 5.90601C3.966 5.14471 4.50006 4.49403 5.18524 4.03624C5.87042 3.57845 6.67596 3.33411 7.5 3.33411C8.32404 3.33411 9.12958 3.57845 9.81476 4.03624C10.4999 4.49403 11.034 5.14471 11.3494 5.90601C11.6648 6.6673 11.7474 7.50502 11.5867 8.31325C11.426 9.12147 11.0293 9.8639 10.4467 10.4467L9.99 10.9025C9.72892 11.1636 9.52184 11.4736 9.38057 11.8148C9.2393 12.1559 9.16662 12.5216 9.16667 12.8908V13.3333C9.16667 13.7754 8.99107 14.1993 8.67851 14.5118C8.36595 14.8244 7.94203 15 7.5 15C7.05797 15 6.63405 14.8244 6.32149 14.5118C6.00893 14.1993 5.83333 13.7754 5.83333 13.3333V12.8908C5.83333 12.145 5.53667 11.4292 5.01 10.9025L4.55333 10.4467Z"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
import { exportTenderPDF } from '../utils/exportPDF'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useAuth, INITIAL_USERS, roles } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { technicalCriteria } from '../data/mockData'
import { tenderRef } from '../utils/tenderRef'

// ── Helpers ──────────────────────────────────────────────────────────────────
// The three approval gates owned by Supply Chain.
const SCM_GATE_STATUSES = ['scm_gate1', 'scm_gate2', 'scm_gate3']
const SCM_GATE_ROUTE = {
  scm_gate1: '/scm-tech-review',
  scm_gate2: '/scm-review',
  scm_gate3: '/scm-contract-review',
}

const statusVariant = {
  prequal_stage1:  'prequal_stage1',
  prequal_stage2:  'prequal_stage2',
  prequal_stage3:  'prequal_stage3',
  prequal_stage4:  'prequal_stage4',
  prequal_final_review: 'prequal_final_review',
  draft:       'warning',
  upload:      'upload',
  tech_eval:   'tech_eval',
  comm_eval:   'comm_eval',
  scm_gate1:   'scm_gate',
  scm_gate2:   'scm_gate',
  scm_gate3:   'scm_gate',
  award:       'award',
  legal_review:       'legal_review',
  contract_execution: 'contract_execution',
  active:             'active',
  contract_closure:   'contract_closure',
}
const isEvaluator = (roleId) => roleId === 'tech_eval' || roleId === 'comm_eval'

const getPofTenderRoute = (tender) => {
  if (tender.status === 'draft') return `/create-itt/${tender.id}`
  if (tender.status === 'comm_eval') return `/commercial-eval/${tender.id}`
  if (tender.status === 'award') return `/contract/${tender.id}`
  if (tender.status === 'legal_review') return `/legal-review/${tender.id}`
  if (tender.status === 'contract_execution') return `/contract-execution/${tender.id}`
  if (tender.status === 'active') return `/contract-management/${tender.id}`
  if (tender.status === 'contract_closure') return `/contract-closure/${tender.id}`
  return `/upload/${tender.id}`
}

const getContractHolderTenderRoute = (tender) => {
  if (tender.status === 'tech_eval') return `/technical-eval/${tender.id}`
  if (tender.status === 'draft')     return `/create-itt/${tender.id}`
  if (tender.status === 'cif_draft') return `/contract-strategy/${tender.id}`
  return `/pre-qualification/${tender.id}`
}

const bidderComplianceByRole = {
  tech_eval: [
    { name: 'TechSolutions Ltd',  score: 88.6, compliance: 'compliant' },
    { name: 'InfraCore Systems',  score: 82.7, compliance: 'compliant' },
    { name: 'CloudNexus Corp',    score: 76.8, compliance: 'partial_compliant' },
    { name: 'DataVault Solutions',score: 69.4, compliance: 'partial_compliant' },
  ],
  comm_eval: [
    { name: 'TechSolutions Ltd',  score: 84.4, compliance: 'compliant' },
    { name: 'InfraCore Systems',  score: 85.4, compliance: 'compliant' },
    { name: 'CloudNexus Corp',    score: 79.1, compliance: 'partial_compliant' },
    { name: 'DataVault Solutions',score: 77.2, compliance: 'partial_compliant' },
  ],
}

const complianceLabelEn = { compliant: 'Compliant', partial_compliant: 'Partial', non_compliant: 'Non-Compliant' }
const complianceLabelAr = { compliant: 'مستوفٍ', partial_compliant: 'جزئياً', non_compliant: 'غير مستوفٍ' }

const getVisibleTenders = (roleId, tenders) => {
  if (roleId === 'it_admin')    return []
  // cif_draft tenders are WIP-only, resumable from the Contract Holder's own
  // Contract Initiating Form picker — not yet "in the pipeline" for anyone else.
  if (roleId === 'biz_admin')   return tenders.filter(t => t.status !== 'cif_draft')
  // prequal_stage4 is the financial assessment the Contract Engineer owns.
  if (roleId === 'pof')         return tenders.filter(t => ['prequal_stage4','draft','upload','comm_eval','award','legal_review','contract_execution','active','contract_closure'].includes(t.status))
  if (roleId === 'contract_holder') return tenders.filter(t => ['cif_draft','prequal_stage1','prequal_stage2','prequal_stage3','prequal_final_review','prequal_rejected','draft','tech_eval'].includes(t.status))
  if (roleId === 'tech_eval')   return tenders.filter(t => t.status === 'tech_eval')
  if (roleId === 'comm_eval')   return tenders.filter(t => t.status === 'comm_eval')
  if (roleId === 'scm')         return tenders.filter(t => SCM_GATE_STATUSES.includes(t.status))
  return tenders
}

const getStatCards = (roleId, tenders) => {
  // cif_draft tenders are WIP-only (see getVisibleTenders) — never counted as
  // part of the procurement pipeline in cross-role stat cards.
  const pipelineTenders = tenders.filter(t => t.status !== 'cif_draft')
  const byStatus = (s) => tenders.filter(t => t.status === s)
  const byGates = () => tenders.filter(t => SCM_GATE_STATUSES.includes(t.status))
  const notStarted = (s) => tenders.filter(t => t.status === s && t.evalProgress === 'not_started').length
  const inProgress  = (s) => tenders.filter(t => t.status === s && t.evalProgress === 'in_progress').length

  const techAISuggestions = byStatus('tech_eval')
    .filter(t => t.evalProgress === 'in_progress')
    .reduce((sum, t) => sum + t.bidders * technicalCriteria.length, 0)

  if (roleId === 'tech_eval') return [
    { label: 'Assigned Tenders',   value: String(byStatus('tech_eval').length), icon: ClipboardCheck, accentColor: '#2563EB', trend: 'Active',   chipVariant: '',      sub: 'In technical evaluation' },
    { label: 'Pending Evaluation', value: String(notStarted('tech_eval')),       icon: Clock,          accentColor: '#F59E0B', trend: 'URGENT',   chipVariant: 'urgent',sub: 'Not yet started' },
    { label: 'In Progress',        value: String(inProgress('tech_eval')),        icon: Activity,       accentColor: '#10B981', trend: 'Ongoing',  chipVariant: '',      sub: 'Scoring underway' },
    { label: 'AI Suggestions',     value: String(techAISuggestions),              icon: BulbIcon,       accentColor: '#7C3AED', trend: '94% ACC.', chipVariant: 'acc',   sub: 'AI-generated scores' },
  ]

  if (roleId === 'comm_eval') return [
    { label: 'Assigned Tenders',   value: String(byStatus('comm_eval').length),                                                     icon: BarChart3,  accentColor: '#2563EB', trend: 'Active',   chipVariant: '',       sub: 'In commercial evaluation' },
    { label: 'Pending Evaluation', value: String(notStarted('comm_eval')),                                                           icon: Clock,      accentColor: '#F59E0B', trend: 'URGENT',   chipVariant: 'urgent', sub: 'Not yet started' },
    { label: 'In Progress',        value: String(inProgress('comm_eval')),                                                            icon: Activity,   accentColor: '#10B981', trend: 'Ongoing',  chipVariant: '',       sub: 'Scoring underway' },
    { label: 'Bids to Evaluate',   value: String(byStatus('comm_eval').reduce((sum, t) => sum + t.bidders, 0)), icon: Briefcase, accentColor: '#6366F1', trend: 'Total',    chipVariant: '',       sub: 'Across assigned tenders' },
  ]

  if (roleId === 'scm') return [
    { label: 'Awaiting My Approval', value: String(byGates().length),                icon: UserCog,  accentColor: '#2563EB', trend: 'SOON',     chipVariant: 'soon', sub: 'Across all three gates' },
    { label: 'Technical Review',     value: String(byStatus('scm_gate1').length),    icon: Clock,    accentColor: '#F59E0B', trend: 'GATE 1',   chipVariant: 'urgent',sub: 'Technical evaluation outcome' },
    { label: 'Award Review',         value: String(byStatus('scm_gate2').length),    icon: Activity, accentColor: '#6366F1', trend: 'GATE 2',   chipVariant: '',     sub: 'Commercial & award decision' },
    { label: 'Contract Review',      value: String(byStatus('scm_gate3').length),    icon: BulbIcon, accentColor: '#7C3AED', trend: 'GATE 3',   chipVariant: 'acc',  sub: 'Draft awaiting issue' },
  ]

  if (roleId === 'pof') return [
    { label: 'Active Tenders',  value: String(pipelineTenders.length),      icon: FileText,  accentColor: '#10B981', trend: '+2 this month', chipVariant: '',       sub: 'In procurement pipeline' },
    { label: 'In Evaluation',   value: String(byStatus('tech_eval').length + byStatus('comm_eval').length), icon: ClipboardCheck, accentColor: '#EF4444', trend: 'URGENT', chipVariant: 'urgent', sub: 'Closing next 7 days' },
    { label: 'At SCM Gates',    value: String(byGates().length),               icon: UserCog, accentColor: '#2563EB', trend: 'SOON',         chipVariant: 'soon',   sub: 'Awaiting SCM approval' },
    { label: 'AI Extractions',  value: '8',                                  icon: BulbIcon,  accentColor: '#7C3AED', trend: '96% ACC.',     chipVariant: 'acc',    sub: 'Documents processed' },
  ]

  if (roleId === 'contract_holder') return [
    { label: 'Bidder Matching',    value: String(byStatus('prequal_stage1').length), icon: Users,          accentColor: '#0891B2', trend: 'Stage 1', chipVariant: '',       sub: 'Matching ERP bidders to SOW' },
    { label: 'Questionnaire',      value: String(byStatus('prequal_stage2').length), icon: FileText,       accentColor: '#F59E0B', trend: 'Stage 2', chipVariant: 'urgent', sub: 'Generating & distributing PQQ' },
    { label: 'Response Review',    value: String(byStatus('prequal_stage3').length), icon: ClipboardCheck, accentColor: '#EF4444', trend: 'Stage 3', chipVariant: '',       sub: 'QHSE / Technical / Admin checks' },
    { label: 'With Contract Engineer', value: String(byStatus('prequal_stage4').length), icon: Clock,      accentColor: '#0891B2', trend: 'Stage 4', chipVariant: '',       sub: 'Awaiting financial assessment' },
    { label: 'Final Review',       value: String(byStatus('prequal_final_review').length), icon: ClipboardCheck, accentColor: '#10B981', trend: 'Stage 5', chipVariant: 'urgent', sub: 'Assessment returned — ready to submit' },
  ]

  if (roleId === 'it_admin') {
    const active   = INITIAL_USERS.filter(u => u.status === 'active').length
    const inactive = INITIAL_USERS.filter(u => u.status === 'inactive').length
    return [
      { label: 'Total Users',    value: String(INITIAL_USERS.length), icon: Users,  accentColor: '#7C3AED', trend: 'All roles', chipVariant: '',       sub: 'Registered accounts' },
      { label: 'Active Users',   value: String(active),               icon: Users,  accentColor: '#10B981', trend: 'Online',    chipVariant: '',       sub: 'Currently active' },
      { label: 'Inactive Users', value: String(inactive),             icon: Users,  accentColor: '#EF4444', trend: 'URGENT',    chipVariant: 'urgent', sub: 'Suspended accounts' },
      { label: 'Total Roles',    value: '6',                          icon: Shield, accentColor: '#2563EB', trend: 'Defined',   chipVariant: '',       sub: 'RBAC roles configured' },
    ]
  }

  if (roleId === 'biz_admin') {
    return [
      { label: 'Total Tenders',  value: String(pipelineTenders.length),                                                                icon: FileText,       accentColor: '#10B981', trend: '+2 this month', chipVariant: '',       sub: 'In procurement pipeline' },
      { label: 'In Evaluation',  value: String(byStatus('tech_eval').length + byStatus('comm_eval').length),                           icon: ClipboardCheck, accentColor: '#EF4444', trend: 'URGENT',        chipVariant: 'urgent', sub: 'Active evaluation stage' },
      { label: 'At SCM Gates',   value: String(byGates().length),                                                                       icon: UserCog,        accentColor: '#2563EB', trend: 'SOON',          chipVariant: 'soon',   sub: 'Awaiting SCM approval' },
      { label: 'Awarded',        value: String(byStatus('award').length),                                                                icon: BulbIcon,       accentColor: '#7C3AED', trend: 'Complete',      chipVariant: '',       sub: 'Contracts recommended' },
    ]
  }

  // Fallback — system-wide view
  const activeUsers = INITIAL_USERS.filter(u => u.status === 'active').length
  return [
    { label: 'Total Tenders',  value: String(pipelineTenders.length),                                                              icon: FileText,       accentColor: '#10B981', trend: '+2 this month', chipVariant: '',       sub: 'In procurement pipeline' },
    { label: 'Active Users',   value: String(activeUsers),                                                                          icon: Users,          accentColor: '#2563EB', trend: '5 roles',       chipVariant: '',       sub: 'System-wide access' },
    { label: 'In Evaluation',  value: String(byStatus('tech_eval').length + byStatus('comm_eval').length),                         icon: ClipboardCheck, accentColor: '#EF4444', trend: 'URGENT',        chipVariant: 'urgent', sub: 'Active evaluation stage' },
    { label: 'AI Accuracy',    value: '96%',                                                                                        icon: BulbIcon,       accentColor: '#7C3AED', trend: '96% ACC.',      chipVariant: 'acc',    sub: 'Extraction accuracy' },
  ]
}

const getActionItems = (roleId, tenders) => {
  if (roleId === 'tech_eval') {
    const mine = tenders.filter(t => t.status === 'tech_eval')
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Complete Technical Evaluation — ${tenderRef(t)}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress === 'not_started').map(t => ({ label: `Start Evaluation — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'comm_eval') {
    const mine = tenders.filter(t => t.status === 'comm_eval')
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Complete Commercial Evaluation — ${tenderRef(t)}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress === 'not_started').map(t => ({ label: `Start Evaluation — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'scm') {
    const gateLabel = { scm_gate1: 'Approve Technical Evaluation', scm_gate2: 'Take Award Decision', scm_gate3: 'Approve Contract Draft' }
    return tenders
      .filter(t => SCM_GATE_STATUSES.includes(t.status))
      .map(t => ({ label: `${gateLabel[t.status]} — ${tenderRef(t)}: ${t.title}`, urgent: t.status === 'scm_gate3' }))
  }
  if (roleId === 'pof') return [
    ...tenders.filter(t => t.status === 'prequal_stage4').map(t => ({ label: `Complete Financial Assessment — ${tenderRef(t)}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'draft').map(t  => ({ label: `Export ITT for External Review — ${tenderRef(t)}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'upload').map(t => ({ label: `Upload Bidder Proposals — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ...tenders.filter(t => t.status === 'award').map(t  => ({ label: `Create Contract — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ...tenders.filter(t => t.status === 'legal_review').map(t  => ({ label: `Awaiting Legal Review — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ...tenders.filter(t => t.status === 'contract_execution').map(t  => ({ label: `Sign Contract — ${tenderRef(t)}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'active').map(t  => ({ label: `Manage Active Contract — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ...tenders.filter(t => t.status === 'contract_closure').map(t  => ({ label: `Close Contract — ${tenderRef(t)}: ${t.title}`, urgent: false })),
  ]
  if (roleId === 'contract_holder') return [
    ...tenders.filter(t => ['prequal_stage1','prequal_stage2','prequal_stage3'].includes(t.status)).map(t => ({ label: `Continue Pre-Qualification — ${tenderRef(t)}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'prequal_final_review').map(t => ({ label: `Review & Submit Pre-Qualification — ${tenderRef(t)}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'prequal_stage4').map(t => ({ label: `Awaiting Contract Engineer's Financial Assessment — ${tenderRef(t)}: ${t.title}`, urgent: false })),
  ]
  if (roleId === 'it_admin') return [
    { label: 'Review new user registrations', urgent: false },
    { label: 'Check system audit logs', urgent: false },
  ]
  if (roleId === 'biz_admin') {
    const unassigned = tenders.filter(t =>
      (t.status === 'tech_eval' && !t.assignedTechEval) ||
      (t.status === 'comm_eval' && !t.assignedCommEval)
    )
    return [
      ...unassigned.map(t => ({ label: `Assign evaluator — ${tenderRef(t)}: ${t.title}`, urgent: true })),
      ...tenders.filter(t => t.status === 'draft').map(t => ({ label: `ITT pending export — ${tenderRef(t)}: ${t.title}`, urgent: false })),
      ...tenders.filter(t => t.status === 'award').map(t => ({ label: `Award recommended — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ]
  }
  // Fallback — system-level alerts
  const unassigned = tenders.filter(t =>
    (t.status === 'tech_eval' && !t.assignedTechEval) ||
    (t.status === 'comm_eval' && !t.assignedCommEval)
  )
  return [
    ...unassigned.map(t => ({ label: `Assign evaluator — ${tenderRef(t)}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'draft').map(t => ({ label: `ITT pending export — ${tenderRef(t)}: ${t.title}`, urgent: false })),
    ...tenders.filter(t => t.status === 'award').map(t => ({ label: `Award recommended — ${tenderRef(t)}: ${t.title}`, urgent: false })),
  ]
}

// ── Workflow pipeline stages for admin overview ───────────────────────────────
const PIPELINE_STAGES = [
  { key: 'draft',       label: 'ITT Draft',          color: '#64748B' },
  { key: 'upload',      label: 'Bid Ingestion',       color: '#0891B2' },
  { key: 'tech_eval',   label: 'Technical Eval',      color: '#2563EB' },
  { key: 'comm_eval',   label: 'Commercial Eval',     color: '#D97706' },
  { key: 'scm_gate2',   label: 'SCM Award Review',    color: '#7C3AED' },
  { key: 'award',       label: 'Award',               color: '#10B981' },
]

// ── Accent bg helper ──────────────────────────────────────────────────────────
const accentBg = (c) => ({
  '#10B981': '#ECFDF5', '#EF4444': '#FEF2F2', '#2563EB': '#EEF2FF',
  '#7C3AED': '#F5F3FF', '#F59E0B': '#FFFBEB', '#6366F1': '#EEF2FF', '#64748B': '#F8FAFC',
}[c] || '#EEF2FF')

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate   = useNavigate()
  const { user, users } = useAuth()
  const { tenders }= useTenders()
  const { lang }= useLanguage()
  const { isDark } = useTheme()
  const [menuOpen, setMenuOpen] = useState(null)

  const roleId          = user?.role?.id
  const isAdmin         = roleId === 'biz_admin'
  const isItAdmin       = roleId === 'it_admin'
  const complianceLabel = lang === 'ar' ? complianceLabelAr : complianceLabelEn
  const visibleTenders  = getVisibleTenders(roleId, tenders)
  const statCards       = getStatCards(roleId, tenders)
  const actionItems     = getActionItems(roleId, tenders)
  const urgentCount     = actionItems.filter(a => a.urgent).length

  // Admin — pipeline counts per stage. cif_draft tenders aren't in the
  // pipeline yet (see getVisibleTenders), so they're excluded from the
  // denominator — otherwise they'd silently deflate every stage's percentage.
  const pipelineTenderCount = tenders.filter(t => t.status !== 'cif_draft').length
  const pipelineCounts  = PIPELINE_STAGES.map(s => ({
    ...s,
    count: tenders.filter(t => t.status === s.key).length,
    pct: pipelineTenderCount ? Math.round((tenders.filter(t => t.status === s.key).length / pipelineTenderCount) * 100) : 0,
  }))

  // Theme-aware palette
  const c = isDark
    ? { card: '#111827', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', sub: '#94A3B8', muted: '#475569', page: '#0A0F1E' }
    : { card: '#FFFFFF',  border: '#E2E8F0',                text: '#0F172A', sub: '#64748B',  muted: '#94A3B8',  page: '#F1F5F9' }

  const cardShadow = isDark
    ? '0 1px 3px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)'
    : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)'

  return (
    <div className="space-y-6">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: c.text }}>
            Dashboard Overview
          </h2>
          <p className="text-sm mt-1" style={{ color: c.sub }}>
            Welcome back, <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{user?.name}</span>
            {urgentCount > 0 && (
              <> — <span className="text-red-500 font-medium">{urgentCount} urgent item{urgentCount > 1 ? 's' : ''}</span> need attention</>
            )}
          </p>
        </div>
        {roleId === 'pof' && (
          <Button onClick={() => navigate('/create-itt')}>
            <BulbIcon size={16} style={{ color: '#ffffff' }} /> New ITT with AI
          </Button>
        )}
        {roleId === 'contract_holder' && (
          <Button onClick={() => navigate('/contract-strategy')}>
            <BulbIcon size={16} style={{ color: '#ffffff' }} /> New Tender
          </Button>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const isAccCard  = s.chipVariant === 'acc'
          const isUrgent   = s.chipVariant === 'urgent'
          const isSoon     = s.chipVariant === 'soon'

          const cardBg     = isAccCard ? (isDark ? '#1b3c5e' : '#1b4c6f') : c.card
          const cardBorder = isAccCard ? 'transparent' : c.border
          const labelColor = isAccCard ? 'rgba(255,255,255,0.55)' : c.muted
          const numColor   = isAccCard ? '#ffffff' : isUrgent ? '#EF4444' : c.text
          const subColor   = isAccCard ? 'rgba(255,255,255,0.45)' : c.muted

          const chipBg_    = isAccCard
            ? 'rgba(255,255,255,0.15)'
            : isUrgent ? '#FEF2F2'
            : isSoon   ? '#EFF6FF'
            : isDark ? `${s.accentColor}20` : accentBg(s.accentColor)
          const chipColor_ = isAccCard
            ? '#ffffff'
            : isUrgent ? '#DC2626'
            : isSoon   ? '#2563EB'
            : s.accentColor
          const chipText_  = isUrgent ? 'URGENT' : isSoon ? 'SOON' : s.trend

          return (
            <div key={i} className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                boxShadow: cardShadow,
              }}>
              {/* top row: label + chip */}
              <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] leading-tight pr-2"
                  style={{ color: labelColor }}>
                  {s.label}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 leading-tight whitespace-nowrap"
                  style={{ background: chipBg_, color: chipColor_ }}>
                  {chipText_}
                </span>
              </div>
              {/* big number */}
              <p className="text-4xl font-extrabold leading-none mb-1.5"
                style={{ color: numColor }}>
                {s.value}
              </p>
              {/* subtitle */}
              <p className="text-xs" style={{ color: subColor }}>{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Admin: Workflow Pipeline Overview ── */}
      {isAdmin && (
        <div className="rounded-2xl p-5"
          style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: isDark ? 'rgba(37,99,235,0.2)' : '#EEF2FF' }}>
                <Activity size={13} style={{ color: '#2563EB' }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: c.text }}>Workflow Pipeline</h3>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: c.sub }}>
              {pipelineTenderCount} total
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {pipelineCounts.map(stage => (
              <div key={stage.key}
                className="rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-0.5"
                style={{ background: isDark ? `${stage.color}12` : `${stage.color}10`, border: `1px solid ${stage.color}30` }}
                onClick={() => navigate('/tenders')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: stage.color }}>{stage.label}</span>
                </div>
                <p className="text-2xl font-extrabold mb-1.5" style={{ color: c.text }}>{stage.count}</p>
                <div className="h-1 rounded-full overflow-hidden"
                  style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${stage.pct}%`, background: stage.color }} />
                </div>
                <p className="text-[10px] mt-1" style={{ color: c.muted }}>{stage.pct}% of pipeline</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── IT Admin: Users & Roles Overview ── */}
      {isItAdmin && (
        <div className="rounded-2xl overflow-hidden" style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-bold text-sm" style={{ color: c.text }}>System Users & Roles</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(37,99,235,0.15)' : '#EEF2FF', color: '#2563EB' }}>
                {users.length}
              </span>
            </div>
            <button className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-primary)' }} onClick={() => navigate('/users')}>
              Manage Users <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  {['User', 'Email', 'Role', 'Status', 'Last Login'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: c.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const roleInfo = roles.find(r => r.id === u.roleId)
                  return (
                    <tr key={u.id} style={{ borderBottom: idx < users.length - 1 ? `1px solid ${c.border}` : 'none' }}
                      onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: roleInfo?.color || '#64748B' }}>
                            {u.avatar || u.name?.[0]}
                          </div>
                          <span className="text-xs font-semibold" style={{ color: c.text }}>{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: c.sub }}>{u.username}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${roleInfo?.color || '#64748B'}18`, color: roleInfo?.color || '#64748B' }}>
                          {roleInfo?.label || u.roleId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: c.sub }}>{u.lastLogin}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="space-y-6">

        {/* Recent Tenders */}
        {roleId !== 'it_admin' && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>

          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <FileText size={15} style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-bold text-sm" style={{ color: c.text }}>Recent Tenders</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: isDark ? 'rgba(37,99,235,0.15)' : '#EEF2FF', color: '#2563EB' }}>
                {visibleTenders.length}
              </span>
            </div>
            <button className="text-xs font-semibold flex items-center gap-1"
              style={{ color: 'var(--color-primary)' }}
              onClick={() => navigate('/tenders')}>
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  {['Tender ID', 'Title', 'Deadline', 'Bidders', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: c.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTenders.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: c.muted }}>
                    No tenders assigned at this stage.
                  </td></tr>
                ) : visibleTenders.map((tender, idx) => (
                  <tr key={tender.id}
                    style={{ borderBottom: idx < visibleTenders.length - 1 ? `1px solid ${c.border}` : 'none' }}
                    onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className="text-xs font-semibold cursor-pointer hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                        onClick={() => navigate('/tenders')}
                      >
                        {tenderRef(tender)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 overflow-hidden">
                      <p className="text-xs font-semibold truncate" style={{ color: c.text }}>{tender.title}</p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: c.muted }}>{tender.department}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: c.sub }}>{tender.deadline}</td>
                    <td className="px-5 py-3.5 text-xs font-medium" style={{ color: c.text }}>{tender.bidders || '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant[tender.status] || 'info'}>{tender.stage}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 relative">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}
                          onClick={() => {
                            if (roleId === 'pof') navigate(getPofTenderRoute(tender))
                            else if (roleId === 'contract_holder') navigate(getContractHolderTenderRoute(tender))
                            else if (roleId === 'tech_eval') navigate(`/technical-eval/${tender.id}`)
                            else if (roleId === 'comm_eval') navigate(`/commercial-eval/${tender.id}`)
                            else if (roleId === 'scm') navigate(`${SCM_GATE_ROUTE[tender.status] || '/scm-review'}/${tender.id}`)
                            else if (roleId === 'legal_review') navigate(`/legal-review/${tender.id}`)
                            else navigate('/tenders')
                          }}>
                          <Eye size={12} style={{ color: 'var(--color-primary)' }} />
                        </button>
                        {roleId === 'pof' && tender.status === 'upload' && (
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}
                            onClick={() => exportTenderPDF(tender)}>
                            <Download size={12} style={{ color: c.sub }} />
                          </button>
                        )}
                        <div className="relative">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}
                            onClick={() => setMenuOpen(menuOpen === tender.id ? null : tender.id)}>
                            <MoreVertical size={12} style={{ color: c.sub }} />
                          </button>
                          {menuOpen === tender.id && (() => {
                            const menuItems = {
                              cif_draft:   [{ label: 'Resume CIF',         route: `/contract-strategy/${tender.id}` }],
                              draft:       [{ label: 'Edit ITT',           route: `/create-itt/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              upload:      [{ label: 'Upload Bids',        route: `/upload/${tender.id}` },     { label: 'View in Tenders', route: '/tenders' }],
                              tech_eval:   [{ label: 'Technical Eval',     route: `/technical-eval/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              comm_eval:   [{ label: 'Commercial Eval',    route: `/commercial-eval/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              scm_gate1:   [{ label: 'Technical Review',   route: `/scm-tech-review/${tender.id}` },     { label: 'View in Tenders', route: '/tenders' }],
                              scm_gate2:   [{ label: 'Award Review',       route: `/scm-review/${tender.id}` },          { label: 'View in Tenders', route: '/tenders' }],
                              scm_gate3:   [{ label: 'Contract Review',    route: `/scm-contract-review/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              award:       [{ label: 'Draft Contract',     route: `/contract/${tender.id}` },   { label: 'View in Tenders', route: '/tenders' }],
                              prequal_stage1: [{ label: 'Continue Bidder Matching',      route: `/pre-qualification/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              prequal_stage2: [{ label: 'Continue Questionnaire',        route: `/pre-qualification/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              prequal_stage3: [{ label: 'Continue Response Review',      route: `/pre-qualification/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              prequal_stage4: [{ label: 'Continue Financial Assessment', route: `/pre-qualification/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              prequal_final_review: [{ label: 'Review & Submit Pre-Qualification', route: `/pre-qualification/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              legal_review:       [{ label: 'Legal Review',        route: `/legal-review/${tender.id}` },        { label: 'View in Tenders', route: '/tenders' }],
                              contract_execution: [{ label: 'Sign Contract',       route: `/contract-execution/${tender.id}` },  { label: 'View in Tenders', route: '/tenders' }],
                              active:             [{ label: 'Manage Contract',     route: `/contract-management/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              contract_closure:   [{ label: 'Close Contract',      route: `/contract-closure/${tender.id}` },    { label: 'View in Tenders', route: '/tenders' }],
                            }
                            const items = menuItems[tender.status] || [{ label: 'View in Tenders', route: '/tenders' }]
                            return (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                <div className={`absolute right-0 w-44 rounded-xl py-1 z-50 shadow-lg ${idx === visibleTenders.length - 1 && visibleTenders.length > 2 ? 'bottom-full mb-1' : 'top-8'}`}
                                  style={{ background: c.card, border: `1px solid ${c.border}` }}>
                                  {items.map((item, idx) => (
                                    <button key={idx} className="w-full text-left px-3 py-2 text-xs transition-colors"
                                      style={{ color: c.text }}
                                      onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'}
                                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                      onClick={() => { navigate(item.route); setMenuOpen(null) }}>
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Admin: User Overview */}
        {isAdmin && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${c.border}` }}>
                <div className="flex items-center gap-2">
                  <Users size={13} style={{ color: '#2563EB' }} />
                  <h3 className="font-bold text-xs" style={{ color: c.text }}>System Users</h3>
                </div>
                <button className="text-[10px] font-semibold flex items-center gap-1"
                  style={{ color: 'var(--color-primary)' }}
                  onClick={() => navigate('/users')}>
                  Manage <ChevronRight size={10} />
                </button>
              </div>
              {INITIAL_USERS.map((u, i, arr) => {
                const roleObj = roles.find(r => r.id === u.roleId)
                return (
                  <div key={u.id} className="flex items-center gap-2.5 px-4 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: roleObj?.color || '#64748B' }}>
                      {u.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: c.text }}>{u.name}</p>
                      <p className="text-[10px] truncate" style={{ color: c.muted }}>{roleObj?.label}</p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: u.status === 'active' ? '#10B981' : '#94A3B8',
                        boxShadow: u.status === 'active' ? '0 0 6px rgba(16,185,129,0.7)' : 'none' }} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Evaluator compliance mini-table */}
          {isEvaluator(roleId) && visibleTenders.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.border}` }}>
                <h3 className="font-bold text-xs" style={{ color: c.text }}>Bidder Compliance</h3>
              </div>
              {(bidderComplianceByRole[roleId] || []).map((b, i, arr) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: c.text }}>{b.name}</p>
                    <p className="text-[10px]" style={{ color: c.muted }}>Score: {b.score}</p>
                  </div>
                  <Badge variant={b.compliance}>{complianceLabel[b.compliance]}</Badge>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
