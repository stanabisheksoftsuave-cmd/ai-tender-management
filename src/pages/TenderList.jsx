import { useState, Fragment } from 'react'
import { Search, Filter, Eye, Download, Upload, ChevronRight, Briefcase, FileText, RefreshCw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StageTimeline from '../components/ui/StageTimeline'
import SearchableSelect from '../components/ui/SearchableSelect'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useDismissable, useBackHandler } from '../context/NavigationContext'
import { exportTenderPDF } from '../utils/exportPDF'
import { tenderRef } from '../utils/tenderRef'
import { useAccess } from '../utils/permissions'
import { BudgetAmount, CostCodeChip } from '../components/shell/TableBits'
import ListPagination from '../components/shell/ListPagination'
import CreateButton from '../components/shell/CreateButton'
import { formatDate } from '../components/shell/chFlow'

const REASSIGN_OPTIONS = [
  { status: 'upload',      stage: 'Awaiting Ingestion',      label: 'Bid Ingestion' },
  { status: 'tech_eval',   stage: 'Technical Evaluation',    label: 'Technical Evaluation' },
  { status: 'comm_eval',   stage: 'Commercial Evaluation',   label: 'Commercial Evaluation' },
  { status: 'scm_gate1',   stage: 'SCM Review — Technical',  label: 'SCM Review — Technical' },
  { status: 'scm_gate2',   stage: 'SCM Review — Commercial & Award', label: 'SCM Review — Award' },
]

const getTenderRoute = (t) => {
  if (['prequal_stage1','prequal_stage2','prequal_stage3','prequal_stage4','prequal_final_review','prequal_rejected'].includes(t.status)) return `/pre-qualification/${t.id}`
  if (t.status === 'draft')        return `/create-itt/${t.id}`
  if (t.status === 'upload')       return `/upload/${t.id}`
  if (t.status === 'tech_eval')    return `/technical-eval/${t.id}`
  // Parallel mode runs both evaluations at once; the technical side opens.
  if (t.status === 'parallel_eval') return `/technical-eval/${t.id}`
  if (t.status === 'comm_eval')    return `/commercial-eval/${t.id}`
  if (t.status === 'scm_gate1')    return `/scm-tech-review/${t.id}`
  if (t.status === 'scm_gate2')    return `/scm-review/${t.id}`
  if (t.status === 'scm_gate3')    return `/scm-contract-review/${t.id}`
  if (t.status === 'award')        return `/contract/${t.id}`
  if (t.status === 'legal_review')       return `/legal-review/${t.id}`
  if (t.status === 'contract_execution') return `/contract-execution/${t.id}`
  if (t.status === 'active')             return `/contract-management/${t.id}`
  if (t.status === 'contract_closure')   return `/contract-closure/${t.id}`
  return '/tenders'
}

const getTimelineStage = (t) => {
  if (['prequal_stage1','prequal_stage2','prequal_stage3','prequal_stage4','prequal_final_review','prequal_rejected'].includes(t.status)) return 'prequal'
  if (t.status === 'draft')        return 'approval'
  if (t.status === 'upload')       return 'upload'
  // Parallel mode runs both evaluations at once; the first of them is current.
  if (t.status === 'tech_eval' || t.status === 'parallel_eval') return 'tech_eval'
  if (t.status === 'comm_eval')    return 'comm_eval'
  if (t.status === 'scm_gate1')    return 'scm_gate1'
  if (t.status === 'scm_gate2')    return 'scm_gate2'
  if (t.status === 'scm_gate3')    return 'scm_gate3'
  if (t.status === 'award')        return 'award'
  if (t.status === 'legal_review')       return 'legal'
  if (t.status === 'contract_execution') return 'execution'
  if (t.status === 'active')             return 'management'
  if (t.status === 'contract_closure' || t.status === 'closed') return 'closure'
  return 'draft'
}

const PREQUAL_STATUSES = ['prequal_stage1','prequal_stage2','prequal_stage3','prequal_stage4','prequal_final_review']

/*
 * Contract Holder row actions — the main app's ROW_ACTIONS that apply to the
 * Contract Holder, derived here from the tender's status (no server board).
 */
const chRowActions = (td) => {
  const actions = ['view_detail']
  if (PREQUAL_STATUSES.includes(td.status)) actions.push('continue_prequalification')
  if (td.status === 'tech_eval' || td.status === 'parallel_eval') actions.push('technical_evaluation')
  if (td.status === 'draft' && td.sectionsGenerated) actions.push('continue_review')
  if ((td.status === 'draft' && td.sectionsGenerated) || td.status === 'upload') actions.push('export_tender')
  return actions
}

const CH_ROW_ACTIONS = {
  view_detail:               { label: 'View Detail', icon: Eye, variant: 'secondary', route: getTenderRoute },
  continue_prequalification: { label: 'Continue Pre-Qualification', route: td => `/pre-qualification/${td.id}` },
  technical_evaluation:      { label: 'Technical Evaluation', icon: FileText, route: td => `/technical-eval/${td.id}` },
  continue_review:           { label: 'Continue Review', icon: FileText, route: td => `/create-itt/${td.id}` },
  export_tender:             { label: 'Export Tender', icon: Download, variant: 'secondary', route: null },
}
const NO_SCREEN_REASON = 'There is no detail screen for this stage yet.'

const statusVariant = {
  prequal_stage1:   'prequal_stage1',
  prequal_stage2:   'prequal_stage2',
  prequal_stage3:   'prequal_stage3',
  prequal_stage4:   'prequal_stage4',
  prequal_final_review: 'prequal_final_review',
  prequal_rejected: 'prequal_rejected',
  draft:        'draft',
  upload:       'upload',
  tech_eval:    'tech_eval',
  comm_eval:    'comm_eval',
  parallel_eval: 'parallel_eval',
  scm_gate1:    'scm_gate',
  scm_gate2:    'scm_gate',
  scm_gate3:    'scm_gate',
  award:        'award',
  legal_review:       'legal_review',
  contract_execution: 'contract_execution',
  active:             'active',
  contract_closure:   'contract_closure',
  closed:             'closed',
}

const statusLabelsEn = {
  prequal_stage1:   'Pre-Qual — Bidder Matching',
  prequal_stage2:   'Pre-Qual — Questionnaire',
  prequal_stage3:   'Pre-Qual — Response Review',
  prequal_stage4:   'Pre-Qual — Financial Assessment',
  prequal_final_review: 'Pre-Qual — Final Review',
  prequal_rejected: 'Pre-Qualification Rejected',
  draft:        'Draft — Pending Export',
  upload:       'Awaiting Ingestion',
  tech_eval:    'Technical Evaluation',
  comm_eval:    'Commercial Evaluation',
  parallel_eval: 'Parallel Evaluation',
  scm_gate1:    'SCM Review — Technical',
  scm_gate2:    'SCM Review — Award',
  scm_gate3:    'SCM Review — Contract Draft',
  award:        'Contract Drafting',
  legal_review:       'Legal Review',
  contract_execution: 'Contract Execution',
  active:             'Contract Active',
  contract_closure:   'Closure In Progress',
  closed:             'Closed & Archived',
}

const statusLabelsAr = {
  prequal_stage1:   'التأهيل المسبق - مطابقة المتقدمين',
  prequal_stage2:   'التأهيل المسبق - الاستبيان',
  prequal_stage3:   'التأهيل المسبق - مراجعة الردود',
  prequal_stage4:   'التأهيل المسبق - التقييم المالي',
  prequal_final_review: 'التأهيل المسبق - المراجعة النهائية',
  prequal_rejected: 'تم رفض التأهيل المسبق',
  draft:        'في انتظار الموافقة',
  upload:       'في انتظار الاستيعاب',
  tech_eval:    'التقييم الفني',
  comm_eval:    'التقييم التجاري',
  parallel_eval: 'التقييم المتوازي',
  scm_gate1:    'مراجعة مدير سلسلة التوريد — الفني',
  scm_gate2:    'مراجعة مدير سلسلة التوريد — الترسية',
  scm_gate3:    'مراجعة مدير سلسلة التوريد — مسودة العقد',
  award:        'صياغة العقد',
  legal_review:       'المراجعة القانونية',
  contract_execution: 'تنفيذ العقد',
  active:             'العقد نشط',
  contract_closure:   'الإغلاق قيد التنفيذ',
  closed:             'مغلق ومؤرشف',
}

export default function TenderList() {
  const navigate = useNavigate()
  const { user, users } = useAuth()
  const { tenders, reassignTender, updateTender } = useTenders()
  const { lang, t } = useLanguage()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [reassignModal, setReassignModal] = useState(null)       // pof: stage reassign
  const [evalModal, setEvalModal] = useState(null)               // biz_admin: evaluator reassign
  const [selectedEvaluator, setSelectedEvaluator] = useState('')
  const [evalSearch, setEvalSearch] = useState('')
  // Contract Holder list paging (main app's ListPagination).
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { can } = useAccess()

  useDismissable(!!reassignModal, () => setReassignModal(null))
  useDismissable(!!evalModal, () => { setEvalModal(null); setSelectedEvaluator(''); setEvalSearch('') })

  useBackHandler(() => {
    if (!expanded) return false
    setExpanded(null)
    return true
  })

  const roleId = user?.role?.id
  const isBizAdmin = roleId === 'biz_admin'
  const isPof = roleId === 'pof'
  const isContractHolder = roleId === 'contract_holder'

  // Map tender status → the role that evaluates it. Technical evaluation is owned
  // by the Contract Holder, commercial by the Contract Engineer.
  const stageRoleMap = { tech_eval: 'contract_holder', comm_eval: 'pof', scm_gate1: 'scm', scm_gate2: 'scm', scm_gate3: 'scm' }

  const getEvaluatorsForTender = td => {
    const roleNeeded = stageRoleMap[td.status]
    if (!roleNeeded) return []
    return (users || []).filter(u => u.roleId === roleNeeded && u.status === 'active')
  }

  const doReassignEvaluator = () => {
    if (!evalModal || !selectedEvaluator) return
    const target = (users || []).find(u => String(u.id) === String(selectedEvaluator))
    if (!target) return
    if (evalModal.status === 'tech_eval')   updateTender(evalModal.id, { assignedTechEval: { id: target.id, name: target.name } })
    if (evalModal.status === 'comm_eval')   updateTender(evalModal.id, { assignedCommEval: { id: target.id, name: target.name } })
    if (evalModal.status?.startsWith('scm_gate')) updateTender(evalModal.id, { assignedScm: { id: target.id, name: target.name } })
    setEvalModal(null)
    setSelectedEvaluator('')
  }

  const statusLabels = lang === 'ar' ? statusLabelsAr : statusLabelsEn

  const tabs = [
    { key: 'all',      label: lang === 'ar' ? 'جميع المناقصات' : 'All Tenders', fn: () => true },
    { key: 'prequal',  label: lang === 'ar' ? 'التأهيل المسبق' : 'Pre-Qual',    fn: td => ['prequal_stage1','prequal_stage2','prequal_stage3','prequal_stage4','prequal_final_review'].includes(td.status) },
    { key: 'progress', label: lang === 'ar' ? 'قيد التقدم'     : 'In Progress',  fn: td => ['draft', 'upload'].includes(td.status) },
    { key: 'tech',     label: lang === 'ar' ? 'التقييم الفني'  : 'Tech Eval',    fn: td => td.status === 'tech_eval' || td.status === 'parallel_eval' },
    { key: 'comm',     label: lang === 'ar' ? 'التقييم التجاري': 'Comm Eval',    fn: td => td.status === 'comm_eval' || td.status === 'parallel_eval' },
    { key: 'review',   label: lang === 'ar' ? 'مراجعة سلسلة التوريد' : 'SCM Review', fn: td => ['scm_gate1','scm_gate2','scm_gate3'].includes(td.status) },
    { key: 'award',    label: lang === 'ar' ? 'الترسية'        : 'Awarded',      fn: td => td.status === 'award' },
    { key: 'contract', label: lang === 'ar' ? 'العقد'          : 'Contract',     fn: td => ['legal_review','contract_execution','active','contract_closure'].includes(td.status) },
    { key: 'closed',   label: lang === 'ar' ? 'مغلقة'          : 'Closed',       fn: td => ['closed','prequal_rejected'].includes(td.status) },
  ]

  // cif_draft tenders (SOW generated, not yet proceeded to Strategy Templates)
  // are WIP-only and resumed from the Contract Initiating Form's own picker —
  // they never appear in the general Tender Tracking list, for any role.
  const nonDraftTenders = tenders.filter(t => t.status !== 'cif_draft')

  const filtered = nonDraftTenders.filter(t => {
    const tabFn = tabs.find(tab => tab.key === activeFilter)?.fn ?? (() => true)
    const tabFilter = activeFilter === 'all' ? true : tabFn(t)
    const q = search.toLowerCase()
    // The ID column shows tenderRef (the cost code), so search that too.
    const searchFilter = t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
      || tenderRef(t).toLowerCase().includes(q)
    return tabFilter && searchFilter
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const formatDeadline = (value) => {
    if (!value) return '—'
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const runChAction = (td, key) => {
    if (key === 'export_tender') { exportTenderPDF(td); return }
    const href = CH_ROW_ACTIONS[key]?.route?.(td)
    if (href) navigate(href)
  }

  return (
    <div className="space-y-5">

      {/* Contract Engineer: Reassign Stage Modal */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Reassign Stage</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tenderRef(reassignModal)} — {reassignModal.title}</p>
              </div>
              <button onClick={() => setReassignModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={15} className="text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Current stage: <span className="font-semibold text-slate-700 dark:text-slate-200">{statusLabels[reassignModal.status] || reassignModal.stage}</span>
            </p>
            <div className="space-y-2">
              {REASSIGN_OPTIONS.map(opt => (
                <button
                  key={opt.status}
                  disabled={opt.status === reassignModal.status}
                  onClick={() => {
                    reassignTender(reassignModal.id, opt.status, opt.stage)
                    setReassignModal(null)
                    setExpanded(null)
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    opt.status === reassignModal.status
                      ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[var(--color-primary)] cursor-pointer'
                  }`}>
                  <span>{opt.label}</span>
                  {opt.status === reassignModal.status
                    ? <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">Current</span>
                    : <RefreshCw size={13} />
                  }
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
              Reassigning will reset evaluation progress to "not started" for the selected stage.
            </p>
          </div>
        </div>
      )}

      {/* Business Admin: Reassign Evaluator Modal */}
      {evalModal && (() => {
        const allEvaluators = getEvaluatorsForTender(evalModal)
        const q = evalSearch.trim().toLowerCase()
        const evaluators = q
          ? allEvaluators.filter(u => [u.name, u.email, u.username]
              .some(v => (v || '').toLowerCase().includes(q)))
          : allEvaluators
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Reassign Evaluator</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tenderRef(evalModal)} — {evalModal.title}</p>
                </div>
                <button onClick={() => { setEvalModal(null); setSelectedEvaluator(''); setEvalSearch('') }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X size={15} className="text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Stage: <span className="font-semibold text-slate-700 dark:text-slate-200">{statusLabels[evalModal.status] || evalModal.stage}</span>
              </p>
              {allEvaluators.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No available evaluators for this stage.</p>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={evalSearch}
                      onChange={e => setEvalSearch(e.target.value)}
                      placeholder={lang === 'ar' ? 'البحث عن مقيّم...' : 'Search evaluators...'}
                      aria-label={lang === 'ar' ? 'البحث عن مقيّم' : 'Search evaluators'}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>
                  {evaluators.length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No matching evaluators.</p>
                  )}
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                  {evaluators.map(u => (
                    <button key={u.id}
                      onClick={() => setSelectedEvaluator(String(u.id))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        selectedEvaluator === String(u.id)
                          ? 'border-[var(--color-primary)] bg-blue-50 dark:bg-blue-950/40 text-[var(--color-primary)]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-slate-800'
                      }`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'var(--color-primary)' }}>
                        {u.avatar || u.name?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{u.email || u.username}</p>
                      </div>
                    </button>
                  ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setEvalModal(null); setSelectedEvaluator(''); setEvalSearch('') }}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={doReassignEvaluator}
                  disabled={!selectedEvaluator}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
                  style={{ background: 'var(--color-primary)' }}>
                  Reassign
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Controls */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[12rem] max-w-sm flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); setExpanded(null) }}
              placeholder={lang === 'ar' ? 'البحث بالرقم أو العنوان...' : 'Search by ID or title...'}
              aria-label={lang === 'ar' ? 'البحث بالرقم أو العنوان' : 'Search by ID or title'}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
          {/* Stage filter dropdown */}
          <div className="w-full shrink-0 sm:w-56">
            <SearchableSelect
              value={activeFilter}
              onChange={key => { setActiveFilter(key); setPage(1); setExpanded(null) }}
              options={tabs}
              getValue={tab => tab.key}
              getLabel={tab => `${tab.label} (${nonDraftTenders.filter(tab.fn).length})`}
              searchable={false}
              ariaLabel={lang === 'ar' ? 'تصفية حسب المرحلة' : 'Filter by stage'}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Same shared buttons as the Dashboard — same size, equal weight. */}
          {isContractHolder && (
            <CreateButton tone="navy" onClick={() => navigate('/contract-strategy/new')}>New CIF</CreateButton>
          )}
          {(isContractHolder || isPof) && (
            <CreateButton tone="blue" onClick={() => navigate('/create-itt')}>New ITT</CreateButton>
          )}
          {isPof && tenders.filter(td => td.status === 'award').length > 0 && (
            <Button onClick={() => navigate(`/contract/${tenders.find(td => td.status === 'award').id}`)} size="sm">
              <Briefcase size={13} /> Open Contract Draft
            </Button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[56rem] table-fixed">
            <thead className="sticky top-0 z-[1] bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="w-[13%] text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('list.id')}</th>
                <th className="w-[24%] text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('list.title')}</th>
                <th className="w-[13%] text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('list.deadline')}</th>
                <th className="w-[8%] text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('list.bidders')}</th>
                <th className="w-[14%] text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('list.budget')}</th>
                <th className="w-[20%] text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('list.stage')}</th>
                <th className="w-[8%] px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('list.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    {search.trim() || activeFilter !== 'all' ? 'No tenders match.' : 'No tenders to show.'}
                  </td>
                </tr>
              )}
              {rows.map(td => (
                <Fragment key={td.id}>
                  <tr
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === td.id ? null : td.id)}
                  >
                    <td className="px-4 py-2"><CostCodeChip value={tenderRef(td)} /></td>
                    <td className="px-4 py-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={td.title}>{td.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{td.department}</p>
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">{formatDeadline(td.deadline)}</td>
                    <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">{td.bidders ?? 0}</td>
                    <td className="px-4 py-2 text-sm"><BudgetAmount value={td.budget} fallback="—" /></td>
                    <td className="px-4 py-2">
                      <Badge variant="info">{statusLabels[td.status] || td.stage}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        aria-expanded={expanded === td.id}
                        aria-label={`${expanded === td.id ? 'Hide' : 'Show'} actions for ${tenderRef(td)}`}
                        onClick={e => { e.stopPropagation(); setExpanded(expanded === td.id ? null : td.id) }}
                        className="ml-auto flex w-7 h-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <ChevronRight size={14} aria-hidden="true"
                          className={`text-slate-400 transition-transform ${expanded === td.id ? 'rotate-90' : ''}`} />
                      </button>
                    </td>
                  </tr>
                  {expanded === td.id && (
                    <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="w-0 min-w-full overflow-x-auto">
                            <StageTimeline currentStage={getTimelineStage(td)} isComplete={td.status === 'closed'} />
                          </div>
                          {/* Row actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="secondary" size="sm" onClick={() => navigate(getTenderRoute(td))}>
                              <Eye size={13} /> View Detail
                            </Button>
                            {isContractHolder && chRowActions(td).filter(k => k !== 'view_detail').map(key => {
                              const config = CH_ROW_ACTIONS[key]
                              const Icon = config.icon
                              const href = config.route ? config.route(td) : null
                              const hasScreen = config.route === null
                                || (href && href !== '/tenders' && can(href))
                              return (
                                <span key={key} title={hasScreen ? undefined : NO_SCREEN_REASON}>
                                  <Button size="sm" variant={config.variant || 'primary'}
                                    disabled={!hasScreen}
                                    onClick={e => { e.stopPropagation(); runChAction(td, key) }}>
                                    {Icon ? <Icon size={13} /> : null} {config.label}
                                  </Button>
                                </span>
                              )
                            })}
                            {!isContractHolder && (
                              <>
                                {isPof && td.status === 'draft' && (
                                  <Button size="sm" onClick={() => navigate(`/create-itt/${td.id}`)}>
                                    <FileText size={13} /> Continue Review
                                  </Button>
                                )}
                                {isPof && td.status === 'upload' && (
                                  <Button variant="secondary" size="sm" onClick={() => exportTenderPDF(td)}>
                                    <Download size={13} /> Export Tender
                                  </Button>
                                )}
                                {isPof && td.status === 'upload' && (
                                  <Button size="sm" onClick={() => navigate(`/upload/${td.id}`)}>
                                    <Upload size={13} /> Ingestion
                                  </Button>
                                )}
                                {isPof && (td.status === 'tech_eval' || td.status === 'parallel_eval') && (
                                  <Button size="sm" onClick={() => navigate(`/technical-eval/${td.id}`)}>
                                    <FileText size={13} /> Technical Evaluation
                                  </Button>
                                )}
                                {isPof && td.status === 'comm_eval' && (
                                  <Button size="sm" onClick={() => navigate(`/commercial-eval/${td.id}`)}>
                                    <FileText size={13} /> Commercial Evaluation
                                  </Button>
                                )}
                                {roleId === 'scm' && ['scm_gate1','scm_gate2','scm_gate3'].includes(td.status) && (
                                  <Button size="sm" onClick={() => navigate(getTenderRoute(td))}>
                                    {statusLabels[td.status]}
                                  </Button>
                                )}
                                {isPof && td.status === 'award' && (
                                  <Button size="sm" onClick={() => navigate(`/contract/${td.id}`)}>
                                    <Briefcase size={13} /> Create Contract
                                  </Button>
                                )}
                                {isPof && td.status === 'legal_review' && (
                                  <Button size="sm" onClick={() => navigate(`/legal-review/${td.id}`)}>
                                    View Legal Review
                                  </Button>
                                )}
                                {isPof && td.status === 'contract_execution' && (
                                  <Button size="sm" onClick={() => navigate(`/contract-execution/${td.id}`)}>
                                    Sign Contract
                                  </Button>
                                )}
                                {isPof && td.status === 'active' && (
                                  <Button size="sm" onClick={() => navigate(`/contract-management/${td.id}`)}>
                                    Manage Contract
                                  </Button>
                                )}
                                {isPof && td.status === 'contract_closure' && (
                                  <Button size="sm" onClick={() => navigate(`/contract-closure/${td.id}`)}>
                                    Close Contract
                                  </Button>
                                )}
                                {/* Contract Engineer: Reassign Stage */}
                                {isPof && ['upload','tech_eval','comm_eval','scm_gate1','scm_gate2'].includes(td.status) && (
                                  <Button size="sm" variant="secondary"
                                    onClick={e => { e.stopPropagation(); setReassignModal(td) }}>
                                    <RefreshCw size={13} /> Reassign Stage
                                  </Button>
                                )}
                                {/* Business Admin: Reassign Evaluator */}
                                {isBizAdmin && ['tech_eval','comm_eval','scm_gate1','scm_gate2','scm_gate3'].includes(td.status) && (
                                  <Button size="sm" variant="secondary"
                                    onClick={e => { e.stopPropagation(); setEvalModal(td); setSelectedEvaluator(''); setEvalSearch('') }}>
                                    <RefreshCw size={13} /> Reassign
                                  </Button>
                                )}
                                {td.aiScore && (
                                  <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                                    AI Score: {td.aiScore}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <ListPagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={p => { setPage(p); setExpanded(null) }}
            onPageSizeChange={size => { setPageSize(size); setPage(1); setExpanded(null) }}
          />
        </div>
      </Card>
    </div>
  )
}
