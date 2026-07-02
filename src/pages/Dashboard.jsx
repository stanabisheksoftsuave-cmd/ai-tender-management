import { useState } from 'react'
import {
  FileText, Clock, AlertTriangle, ArrowRight,
  Activity, ClipboardCheck, BarChart3, Briefcase, UserCog,
  Download, Send, Search,
  Eye, MoreVertical, Upload, Users, ScrollText, Shield,
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const statusVariant = {
  draft:       'warning',
  upload:      'upload',
  tech_eval:   'tech_eval',
  comm_eval:   'comm_eval',
  mgmt_review: 'mgmt_review',
  award:       'award',
}
const isEvaluator = (roleId) => roleId === 'tech_eval' || roleId === 'comm_eval'

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
  if (roleId === 'biz_admin')   return tenders
  if (roleId === 'pof')         return tenders.filter(t => t.status === 'draft' || t.status === 'upload' || t.status === 'award')
  if (roleId === 'tech_eval')   return tenders.filter(t => t.status === 'tech_eval')
  if (roleId === 'comm_eval')   return tenders.filter(t => t.status === 'comm_eval')
  if (roleId === 'mgmt_review') return tenders.filter(t => t.status === 'mgmt_review')
  return tenders
}

const getStatCards = (roleId, tenders) => {
  const byStatus = (s) => tenders.filter(t => t.status === s)
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

  if (roleId === 'mgmt_review') return [
    { label: 'Assigned Tenders',   value: String(byStatus('mgmt_review').length), icon: UserCog,  accentColor: '#2563EB', trend: 'SOON',     chipVariant: 'soon', sub: 'Pending recommendation' },
    { label: 'Not Yet Started',    value: String(notStarted('mgmt_review')),       icon: Clock,    accentColor: '#F59E0B', trend: 'URGENT',   chipVariant: 'urgent',sub: 'Awaiting review start' },
    { label: 'Under Review',       value: String(inProgress('mgmt_review')),       icon: Activity, accentColor: '#6366F1', trend: 'Active',   chipVariant: '',     sub: 'Review in progress' },
    { label: 'AI Recommendations', value: String(byStatus('mgmt_review').length),  icon: BulbIcon, accentColor: '#7C3AED', trend: '96% ACC.', chipVariant: 'acc',  sub: 'Ready for review' },
  ]

  if (roleId === 'pof') return [
    { label: 'Active Tenders',  value: String(tenders.length),              icon: FileText,  accentColor: '#10B981', trend: '+2 this month', chipVariant: '',       sub: 'In procurement pipeline' },
    { label: 'In Evaluation',   value: String(byStatus('tech_eval').length + byStatus('comm_eval').length), icon: ClipboardCheck, accentColor: '#EF4444', trend: 'URGENT', chipVariant: 'urgent', sub: 'Closing next 7 days' },
    { label: 'Under Review',    value: String(byStatus('mgmt_review').length), icon: UserCog, accentColor: '#2563EB', trend: 'SOON',         chipVariant: 'soon',   sub: 'Opening next 7 days' },
    { label: 'AI Extractions',  value: '8',                                  icon: BulbIcon,  accentColor: '#7C3AED', trend: '96% ACC.',     chipVariant: 'acc',    sub: 'Documents processed' },
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
      { label: 'Total Tenders',  value: String(tenders.length),                                                                        icon: FileText,       accentColor: '#10B981', trend: '+2 this month', chipVariant: '',       sub: 'In procurement pipeline' },
      { label: 'In Evaluation',  value: String(byStatus('tech_eval').length + byStatus('comm_eval').length),                           icon: ClipboardCheck, accentColor: '#EF4444', trend: 'URGENT',        chipVariant: 'urgent', sub: 'Active evaluation stage' },
      { label: 'Under Review',   value: String(byStatus('mgmt_review').length),                                                         icon: UserCog,        accentColor: '#2563EB', trend: 'SOON',          chipVariant: 'soon',   sub: 'Pending recommendation' },
      { label: 'Awarded',        value: String(byStatus('award').length),                                                                icon: BulbIcon,       accentColor: '#7C3AED', trend: 'Complete',      chipVariant: '',       sub: 'Contracts recommended' },
    ]
  }

  // Fallback — system-wide view
  const activeUsers = INITIAL_USERS.filter(u => u.status === 'active').length
  return [
    { label: 'Total Tenders',  value: String(tenders.length),                                                                      icon: FileText,       accentColor: '#10B981', trend: '+2 this month', chipVariant: '',       sub: 'In procurement pipeline' },
    { label: 'Active Users',   value: String(activeUsers),                                                                          icon: Users,          accentColor: '#2563EB', trend: '5 roles',       chipVariant: '',       sub: 'System-wide access' },
    { label: 'In Evaluation',  value: String(byStatus('tech_eval').length + byStatus('comm_eval').length),                         icon: ClipboardCheck, accentColor: '#EF4444', trend: 'URGENT',        chipVariant: 'urgent', sub: 'Active evaluation stage' },
    { label: 'AI Accuracy',    value: '96%',                                                                                        icon: BulbIcon,       accentColor: '#7C3AED', trend: '96% ACC.',      chipVariant: 'acc',    sub: 'Extraction accuracy' },
  ]
}

const getActionItems = (roleId, tenders) => {
  if (roleId === 'tech_eval') {
    const mine = tenders.filter(t => t.status === 'tech_eval')
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Complete Technical Evaluation — ${t.id}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress === 'not_started').map(t => ({ label: `Start Evaluation — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'comm_eval') {
    const mine = tenders.filter(t => t.status === 'comm_eval')
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Complete Commercial Evaluation — ${t.id}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress === 'not_started').map(t => ({ label: `Start Evaluation — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'mgmt_review') {
    const mine = tenders.filter(t => t.status === 'mgmt_review')
    return [
      ...mine.filter(t => t.evalProgress === 'in_progress').map(t => ({ label: `Submit Award Recommendation — ${t.id}: ${t.title}`, urgent: true })),
      ...mine.filter(t => t.evalProgress === 'not_started').map(t => ({ label: `Begin Management Review — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  if (roleId === 'pof') return [
    ...tenders.filter(t => t.status === 'draft').map(t  => ({ label: `Export ITT for External Review — ${t.id}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'upload').map(t => ({ label: `Upload Bidder Proposals — ${t.id}: ${t.title}`, urgent: false })),
    ...tenders.filter(t => t.status === 'award').map(t  => ({ label: `Create Contract — ${t.id}: ${t.title}`, urgent: false })),
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
      ...unassigned.map(t => ({ label: `Assign evaluator — ${t.id}: ${t.title}`, urgent: true })),
      ...tenders.filter(t => t.status === 'draft').map(t => ({ label: `ITT pending export — ${t.id}: ${t.title}`, urgent: false })),
      ...tenders.filter(t => t.status === 'award').map(t => ({ label: `Award recommended — ${t.id}: ${t.title}`, urgent: false })),
    ]
  }
  // Fallback — system-level alerts
  const unassigned = tenders.filter(t =>
    (t.status === 'tech_eval' && !t.assignedTechEval) ||
    (t.status === 'comm_eval' && !t.assignedCommEval)
  )
  return [
    ...unassigned.map(t => ({ label: `Assign evaluator — ${t.id}: ${t.title}`, urgent: true })),
    ...tenders.filter(t => t.status === 'draft').map(t => ({ label: `ITT pending export — ${t.id}: ${t.title}`, urgent: false })),
    ...tenders.filter(t => t.status === 'award').map(t => ({ label: `Award recommended — ${t.id}: ${t.title}`, urgent: false })),
  ]
}

const getAISystemStatus = (tenders) => {
  const byStatus = (s) => tenders.filter(t => t.status === s).length
  const cap = (n, max) => Math.min(Math.round((n / max) * 100), 100)
  return [
    { label: 'ITT Generator',     status: byStatus('draft')  > 0 ? 'online' : 'standby', load: cap(byStatus('draft'),  3) },
    { label: 'Extraction Engine', status: byStatus('upload') > 0 ? 'online' : 'standby', load: cap(byStatus('upload'), 3) },
    { label: 'Evaluation AI',     status: (byStatus('tech_eval') + byStatus('comm_eval')) > 0 ? 'online' : 'standby', load: cap(byStatus('tech_eval') + byStatus('comm_eval'), 8) },
    { label: 'Contract Drafter',  status: byStatus('award')  > 0 ? 'online' : 'standby', load: cap(byStatus('award'),  3) },
  ]
}

// ── AI chips ─────────────────────────────────────────────────────────────────
const AI_CHIPS = [
  { icon: FileText, label: 'Most recent tender' },
  { icon: FileText, label: 'Write cover letter' },
  { icon: Search,   label: 'Explain document' },
  { icon: BulbIcon, label: 'Get suggestions' },
]

// ── Workflow pipeline stages for admin overview ───────────────────────────────
const PIPELINE_STAGES = [
  { key: 'draft',       label: 'ITT Draft',          color: '#64748B' },
  { key: 'upload',      label: 'Bid Ingestion',       color: '#0891B2' },
  { key: 'tech_eval',   label: 'Technical Eval',      color: '#2563EB' },
  { key: 'comm_eval',   label: 'Commercial Eval',     color: '#D97706' },
  { key: 'mgmt_review', label: 'Management Review',   color: '#7C3AED' },
  { key: 'award',       label: 'Award',               color: '#10B981' },
]

// ── Quick actions per role ────────────────────────────────────────────────────
const QUICK_ACTIONS_BY_ROLE = {
  it_admin: [
    { icon: Users,      label: 'User Management', color: '#2563EB', bg: '#EEF2FF', action: '/users'     },
    { icon: ScrollText, label: 'Audit Log',        color: '#0891B2', bg: '#E0F7FA', action: '/audit-log' },
    { icon: Shield,     label: 'RBAC & Roles',     color: '#059669', bg: '#ECFDF5', action: '/users'     },
  ],
  biz_admin: [
    { icon: FileText,       label: 'All Tenders',  color: '#7C3AED', bg: '#F5F3FF', action: '/tenders'   },
    { icon: ClipboardCheck, label: 'Evaluations',  color: '#2563EB', bg: '#EEF2FF', action: '/tenders'   },
    { icon: Activity,       label: 'Pipeline',     color: '#10B981', bg: '#ECFDF5', action: '/tenders'   },
    { icon: BulbIcon,       label: 'AI Insights',  color: '#D97706', bg: '#FFFBEB', action: null         },
  ],
  pof: [
    { icon: BulbIcon,  label: 'Create ITT with AI', color: '#2563EB', bg: '#EEF2FF', action: '/create-itt' },
    { icon: Upload,    label: 'Upload Bids',         color: '#0891B2', bg: '#E0F7FA', action: '/upload'     },
    { icon: Briefcase, label: 'Draft Contract',      color: '#059669', bg: '#ECFDF5', action: '/contract'   },
    { icon: FileText,  label: 'View Tenders',        color: '#7C3AED', bg: '#F5F3FF', action: '/tenders'    },
  ],
  tech_eval: [
    { icon: ClipboardCheck, label: 'Start Evaluation', color: '#2563EB', bg: '#EEF2FF', action: '/technical-eval' },
    { icon: FileText,       label: 'View Tenders',     color: '#7C3AED', bg: '#F5F3FF', action: '/tenders'        },
    { icon: BulbIcon,       label: 'AI Score Assist',  color: '#D97706', bg: '#FFFBEB', action: null              },
    { icon: BulbIcon,       label: 'Ask AI',            color: '#0891B2', bg: '#E0F7FA', action: null              },
  ],
  comm_eval: [
    { icon: BarChart3, label: 'Start Evaluation', color: '#2563EB', bg: '#EEF2FF', action: '/commercial-eval' },
    { icon: FileText,  label: 'View Tenders',     color: '#7C3AED', bg: '#F5F3FF', action: '/tenders'         },
    { icon: BulbIcon,  label: 'AI Score Assist',  color: '#D97706', bg: '#FFFBEB', action: null               },
    { icon: BulbIcon,  label: 'Ask AI',            color: '#0891B2', bg: '#E0F7FA', action: null               },
  ],
  mgmt_review: [
    { icon: UserCog,  label: 'Management Review', color: '#2563EB', bg: '#EEF2FF', action: '/mgmt-review' },
    { icon: FileText, label: 'View Tenders',      color: '#7C3AED', bg: '#F5F3FF', action: '/tenders'     },
    { icon: BulbIcon, label: 'AI Insights',       color: '#D97706', bg: '#FFFBEB', action: null           },
    { icon: BulbIcon, label: 'Ask AI',             color: '#0891B2', bg: '#E0F7FA', action: null           },
  ],
}
QUICK_ACTIONS_BY_ROLE.default = QUICK_ACTIONS_BY_ROLE.biz_admin

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
  const { lang, t }= useLanguage()
  const { isDark } = useTheme()
  const [aiQuery, setAiQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)

  const roleId          = user?.role?.id
  const isAdmin         = roleId === 'biz_admin'
  const isItAdmin       = roleId === 'it_admin'
  const complianceLabel = lang === 'ar' ? complianceLabelAr : complianceLabelEn
  const visibleTenders  = getVisibleTenders(roleId, tenders)
  const statCards       = getStatCards(roleId, tenders)
  const actionItems     = getActionItems(roleId, tenders)
  const aiStatus        = getAISystemStatus(tenders)
  const quickActions    = QUICK_ACTIONS_BY_ROLE[roleId] || QUICK_ACTIONS_BY_ROLE.default
  const urgentCount     = actionItems.filter(a => a.urgent).length

  // Admin — pipeline counts per stage
  const pipelineCounts  = PIPELINE_STAGES.map(s => ({
    ...s,
    count: tenders.filter(t => t.status === s.key).length,
    pct: tenders.length ? Math.round((tenders.filter(t => t.status === s.key).length / tenders.length) * 100) : 0,
  }))

  // Theme-aware palette
  const c = isDark
    ? { card: '#111827', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', sub: '#94A3B8', muted: '#475569', page: '#0A0F1E' }
    : { card: '#FFFFFF',  border: '#E2E8F0',                text: '#0F172A', sub: '#64748B',  muted: '#94A3B8',  page: '#F1F5F9' }

  const cardShadow = isDark
    ? '0 1px 3px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)'
    : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)'

  const ai = isDark
    ? { bg: '#111827', border: 'rgba(255,255,255,0.08)', inputBg: 'rgba(255,255,255,0.05)', inputBorder: 'rgba(255,255,255,0.1)', inputColor: '#F1F5F9', chipBg: 'rgba(255,255,255,0.06)', chipBorder: 'rgba(255,255,255,0.08)', chipColor: '#CBD5E1' }
    : { bg: '#FFFFFF',  border: '#E2E8F0',                inputBg: '#F8FAFC',                inputBorder: '#E2E8F0',               inputColor: '#0F172A', chipBg: '#F8FAFC',                chipBorder: '#E2E8F0',               chipColor: '#475569' }

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

      {/* ── Ask AI + Quick Actions (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Ask AI — 3 cols */}
        <div className="lg:col-span-3 rounded-2xl p-5"
          style={{ background: ai.bg, border: `1px solid ${ai.border}`, boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
              <img src="/src/assets/icons/bulb.svg" alt="" width={14} height={14}
                style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: c.text }}>Ask AI Tender</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? 'rgba(37,99,235,0.2)' : '#EEF2FF', color: '#2563EB' }}>
              POWERED BY AI
            </span>
          </div>

          <div className="relative mb-3">
            <img src="/src/assets/icons/bulb.svg" alt=""
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width={14} height={14}
              style={{ filter: isDark ? 'brightness(0) invert(0.5)' : 'brightness(0) invert(0.6)' }} />
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder="Ask me anything about tenders, documents, or bid preparation..."
              className="w-full pl-9 pr-10 py-3 text-sm rounded-xl outline-none"
              style={{
                background: ai.inputBg,
                border: `1px solid ${ai.inputBorder}`,
                color: ai.inputColor,
              }}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: aiQuery ? '#2563EB' : 'transparent' }}>
              <Send size={12} style={{ color: aiQuery ? '#fff' : '#94A3B8' }} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {AI_CHIPS.map((chip, i) => {
              const ChipIcon = chip.icon
              return (
                <button key={i}
                  onClick={() => setAiQuery(chip.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: ai.chipBg, border: `1px solid ${ai.chipBorder}`, color: ai.chipColor }}>
                  <ChipIcon size={11} style={{ color: '#2563EB' }} />
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Actions — 2 cols */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-bold mb-3" style={{ color: c.text }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon
              return (
                <button key={i}
                  onClick={() => qa.action && navigate(qa.action)}
                  className="flex flex-col items-start gap-2.5 px-4 py-3.5 rounded-xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: isDark ? `${qa.color}20` : qa.bg }}>
                    <Icon size={15} style={{ color: qa.color }} />
                  </div>
                  <span className="text-xs font-semibold leading-tight" style={{ color: c.text }}>{qa.label}</span>
                </button>
              )
            })}
          </div>
        </div>

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
              {tenders.length} total
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

      {/* ── Main content row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Tenders */}
        {roleId !== 'it_admin' && (
        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
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
                        {tender.id}
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
                            if (roleId === 'pof') navigate(tender.status === 'draft' ? `/create-itt/${tender.id}` : `/upload/${tender.id}`)
                            else if (roleId === 'tech_eval') navigate(`/technical-eval/${tender.id}`)
                            else if (roleId === 'comm_eval') navigate(`/commercial-eval/${tender.id}`)
                            else if (roleId === 'mgmt_review') navigate(`/mgmt-review/${tender.id}`)
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
                              draft:       [{ label: 'Edit ITT',           route: `/create-itt/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              upload:      [{ label: 'Upload Bids',        route: `/upload/${tender.id}` },     { label: 'View in Tenders', route: '/tenders' }],
                              tech_eval:   [{ label: 'Technical Eval',     route: `/technical-eval/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              comm_eval:   [{ label: 'Commercial Eval',    route: `/commercial-eval/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              mgmt_review: [{ label: 'Management Review',  route: `/mgmt-review/${tender.id}` }, { label: 'View in Tenders', route: '/tenders' }],
                              award:       [{ label: 'Draft Contract',     route: `/contract/${tender.id}` },   { label: 'View in Tenders', route: '/tenders' }],
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

        {/* Right column */}
        <div className="space-y-4">

          {/* AI System Status — hidden for IT Admin */}
          {!isItAdmin && (
          <div className="rounded-2xl p-5"
            style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: isDark ? 'rgba(124,58,237,0.2)' : '#F5F3FF' }}>
                <BulbIcon size={13} style={{ color: '#7C3AED' }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: c.text }}>{t('dash.systemOverview')}</h3>
            </div>
            <div className="space-y-3">
              {aiStatus.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: s.status === 'online' ? '#10B981' : '#94A3B8',
                          boxShadow: s.status === 'online' ? '0 0 6px rgba(16,185,129,0.7)' : 'none',
                        }} />
                      <span className="text-xs" style={{ color: c.sub }}>{s.label}</span>
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: c.text }}>{s.load}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.load}%`,
                        background: s.status === 'online' ? 'var(--color-primary)' : '#CBD5E1',
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Action Required — hidden for IT Admin */}
          {!isItAdmin && (
          <div className="rounded-2xl p-5"
            style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: cardShadow }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: isDark ? 'rgba(245,158,11,0.2)' : '#FFFBEB' }}>
                <AlertTriangle size={13} style={{ color: '#F59E0B' }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: c.text }}>{t('dash.actionItems')}</h3>
              {urgentCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#EF4444' }}>{urgentCount}</span>
              )}
            </div>
            <div className="space-y-2">
              {actionItems.length === 0 ? (
                <p className="text-xs" style={{ color: c.muted }}>No pending actions.</p>
              ) : actionItems.map((a, i) => (
                <div key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl text-xs"
                  style={{
                    borderLeft: `2px solid ${a.urgent ? '#EF4444' : isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                    background: a.urgent ? (isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2') : 'transparent',
                  }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: a.urgent ? '#EF4444' : '#CBD5E1' }} />
                  <span style={{ color: c.sub }}>{a.label}</span>
                </div>
              ))}
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
    </div>
  )
}
