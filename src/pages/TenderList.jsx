import { useState, Fragment } from 'react'
import { Search, Filter, Plus, Eye, Download, Upload, ChevronRight, Briefcase, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StageTimeline from '../components/ui/StageTimeline'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { exportTenderPDF } from '../utils/exportPDF'

const getTenderRoute = (t) => {
  if (t.status === 'draft')        return `/create-itt/${t.id}`
  if (t.status === 'upload')       return `/upload/${t.id}`
  if (t.status === 'tech_eval')    return `/technical-eval/${t.id}`
  if (t.status === 'comm_eval')    return `/commercial-eval/${t.id}`
  if (t.status === 'legal_review') return `/legal-review/${t.id}`
  if (t.status === 'mgmt_review')  return `/mgmt-review/${t.id}`
  if (t.status === 'award')        return `/contract/${t.id}`
  return '/tenders'
}

const getTimelineStage = (t) => {
  if (t.status === 'draft')        return 'approval'
  if (t.status === 'upload')       return 'upload'
  if (t.status === 'tech_eval')    return 'tech_eval'
  if (t.status === 'comm_eval')    return 'comm_eval'
  if (t.status === 'legal_review') return 'legal'
  if (t.status === 'mgmt_review')  return 'mgmt'
  if (t.status === 'award')        return 'award'
  return 'draft'
}

const statusVariant = {
  draft:        'draft',
  upload:       'upload',
  tech_eval:    'tech_eval',
  comm_eval:    'comm_eval',
  legal_review: 'legal_review',
  mgmt_review:  'mgmt_review',
  award:        'award',
}

const statusLabelsEn = {
  draft:        'Pending Approval',
  upload:       'Awaiting Ingestion',
  tech_eval:    'Technical Evaluation',
  comm_eval:    'Commercial Evaluation',
  legal_review: 'Legal Review',
  mgmt_review:  'Management Review',
  award:        'Award Recommended',
}

const statusLabelsAr = {
  draft:        'في انتظار الموافقة',
  upload:       'في انتظار الاستيعاب',
  tech_eval:    'التقييم الفني',
  comm_eval:    'التقييم التجاري',
  legal_review: 'المراجعة القانونية',
  mgmt_review:  'مراجعة الإدارة',
  award:        'موصى بالترسية',
}

export default function TenderList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders } = useTenders()
  const { lang, t } = useLanguage()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const isContractor = user?.role?.id === 'contractor_eng'
  const statusLabels = lang === 'ar' ? statusLabelsAr : statusLabelsEn

  const tabs = [
    { key: 'all',      label: lang === 'ar' ? 'جميع المناقصات' : 'All Tenders', fn: () => true },
    { key: 'progress', label: lang === 'ar' ? 'قيد التقدم'     : 'In Progress',  fn: td => ['draft', 'upload'].includes(td.status) },
    { key: 'tech',     label: lang === 'ar' ? 'التقييم الفني'  : 'Tech Eval',    fn: td => td.status === 'tech_eval' },
    { key: 'comm',     label: lang === 'ar' ? 'التقييم التجاري': 'Comm Eval',    fn: td => td.status === 'comm_eval' },
    { key: 'review',   label: lang === 'ar' ? 'المراجعة'       : 'Review',       fn: td => ['legal_review', 'mgmt_review'].includes(td.status) },
    { key: 'award',    label: lang === 'ar' ? 'الترسية'        : 'Awarded',      fn: td => td.status === 'award' },
  ]

  const filtered = tenders.filter(t => {
    const roleFilter = isContractor ? !['draft', 'upload'].includes(t.status) : true
    const tabFn = tabs.find(tab => tab.key === activeFilter)?.fn ?? (() => true)
    const tabFilter = activeFilter === 'all' ? true : tabFn(t)
    const searchFilter = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
    return roleFilter && tabFilter && searchFilter
  })

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'البحث بالرقم أو العنوان...' : 'Search by ID or title...'}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Filter size={13} /> {t('common.filter')}
          </Button>
          {user?.role?.id === 'pof' && (
            <Button onClick={() => navigate('/create-itt')} size="sm">
              <Plus size={13} /> New ITT
            </Button>
          )}
          {isContractor && tenders.filter(t => t.status === 'award').length > 0 && (
            <Button onClick={() => navigate(`/contract/${tenders.find(t => t.status === 'award').id}`)} size="sm">
              <Briefcase size={13} /> Open Contract Draft
            </Button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {!isContractor ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${activeFilter === tab.key
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {tab.label} <span className="ml-1 opacity-60">({tenders.filter(tab.fn).length})</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Briefcase size={15} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Contract Queue</p>
            <p className="text-xs text-amber-600">{filtered.length} tender{filtered.length !== 1 ? 's' : ''} in post-ingestion flow — {tenders.filter(t => t.status === 'award').length} ready for contract drafting</p>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('list.id')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('list.title')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('list.stage')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('list.budget')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('list.deadline')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('list.bidders')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(t => (
                <Fragment key={t.id}>
                  <tr
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{t.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-400">{t.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[t.status] || 'info'}>
                        {statusLabels[t.status] || t.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{t.budget}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{t.deadline}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.bidders || '—'}</td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className={`text-slate-400 transition-transform ${expanded === t.id ? 'rotate-90' : ''}`} />
                    </td>
                  </tr>
                  {expanded === t.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-3">
                          {!isContractor && (
                            <div className="overflow-x-auto">
                              <StageTimeline currentStage={getTimelineStage(t)} />
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="secondary" size="sm" onClick={() => navigate(getTenderRoute(t))}>
                              <Eye size={13} /> View Detail
                            </Button>
                            {user?.role?.id === 'pof' && t.status === 'draft' && (
                              <Button size="sm" onClick={() => navigate(`/create-itt/${t.id}`)}>
                                <FileText size={13} /> Continue Review
                              </Button>
                            )}
                            {user?.role?.id === 'pof' && t.status === 'upload' && (
                              <Button variant="secondary" size="sm" onClick={() => exportTenderPDF(t)}>
                                <Download size={13} /> Export Tender
                              </Button>
                            )}
                            {user?.role?.id === 'pof' && t.status === 'upload' && (
                              <Button size="sm" onClick={() => navigate(`/upload/${t.id}`)}>
                                <Upload size={13} /> Ingestion
                              </Button>
                            )}
                            {user?.role?.id === 'legal_review' && t.status === 'legal_review' && (
                              <Button size="sm" onClick={() => navigate(`/legal-review/${t.id}`)}>
                                <Upload size={13} /> Legal Review
                              </Button>
                            )}
                            {user?.role?.id === 'mgmt_review' && t.status === 'mgmt_review' && (
                              <Button size="sm" onClick={() => navigate(`/mgmt-review/${t.id}`)}>
                                <Upload size={13} /> Management Review
                              </Button>
                            )}
                            {user?.role?.id === 'contractor_eng' && t.status === 'award' && (
                              <Button size="sm" onClick={() => navigate(`/contract/${t.id}`)}>
                                <Upload size={13} /> Contract Draft
                              </Button>
                            )}
                            {t.aiScore && (
                              <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                                AI Score: {t.aiScore}%
                              </span>
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
      </Card>
    </div>
  )
}
