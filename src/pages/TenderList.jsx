import { useState, Fragment } from 'react'
import { Sparkles, Plus, Eye, Download, Upload, ChevronRight, Briefcase, FileText, RefreshCw, RotateCcw, X, SendHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StageTimeline from '../components/ui/StageTimeline'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { exportTenderPDF } from '../utils/exportPDF'
import { runTenderQuery, QUERY_SUGGESTIONS } from '../utils/tenderQuery'

const REASSIGN_OPTIONS = [
  { status: 'upload',      stage: 'Awaiting Ingestion',      label: 'Bid Ingestion' },
  { status: 'tech_eval',   stage: 'Technical Evaluation',    label: 'Technical Evaluation' },
  { status: 'comm_eval',   stage: 'Commercial Evaluation',   label: 'Commercial Evaluation' },
  { status: 'mgmt_review', stage: 'Management Review',       label: 'Management Review' },
]

const getTenderRoute = (t) => {
  if (['prequal_stage1','prequal_stage2','prequal_stage3','prequal_stage4','prequal_rejected'].includes(t.status)) return `/pre-qualification/${t.id}`
  if (t.status === 'draft')        return `/create-itt/${t.id}`
  if (t.status === 'upload')       return `/upload/${t.id}`
  if (t.status === 'tech_eval')    return `/technical-eval/${t.id}`
  if (t.status === 'comm_eval')    return `/commercial-eval/${t.id}`
  if (t.status === 'mgmt_review')  return `/mgmt-review/${t.id}`
  if (t.status === 'award')        return `/contract/${t.id}`
  if (t.status === 'legal_review')       return `/legal-review/${t.id}`
  if (t.status === 'contract_execution') return `/contract-execution/${t.id}`
  if (t.status === 'active')             return `/contract-management/${t.id}`
  if (t.status === 'contract_closure')   return `/contract-closure/${t.id}`
  return '/tenders'
}

const getTimelineStage = (t) => {
  if (['prequal_stage1','prequal_stage2','prequal_stage3','prequal_stage4','prequal_rejected'].includes(t.status)) return 'prequal'
  if (t.status === 'draft')        return 'approval'
  if (t.status === 'upload')       return 'upload'
  if (t.status === 'tech_eval')    return 'tech_eval'
  if (t.status === 'comm_eval')    return 'comm_eval'
  if (t.status === 'mgmt_review')  return 'mgmt'
  if (t.status === 'award')        return 'award'
  if (t.status === 'legal_review')       return 'legal'
  if (t.status === 'contract_execution') return 'execution'
  if (t.status === 'active')             return 'management'
  if (t.status === 'contract_closure')   return 'closure'
  return 'draft'
}

const statusVariant = {
  prequal_stage1:   'prequal_stage1',
  prequal_stage2:   'prequal_stage2',
  prequal_stage3:   'prequal_stage3',
  prequal_stage4:   'prequal_stage4',
  prequal_rejected: 'prequal_rejected',
  draft:        'draft',
  upload:       'upload',
  tech_eval:    'tech_eval',
  comm_eval:    'comm_eval',
  mgmt_review:  'mgmt_review',
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
  prequal_rejected: 'Pre-Qualification Rejected',
  draft:        'Draft — Pending Export',
  upload:       'Awaiting Ingestion',
  tech_eval:    'Technical Evaluation',
  comm_eval:    'Commercial Evaluation',
  mgmt_review:  'Management Review',
  award:        'Award Recommended',
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
  prequal_rejected: 'تم رفض التأهيل المسبق',
  draft:        'في انتظار الموافقة',
  upload:       'في انتظار الاستيعاب',
  tech_eval:    'التقييم الفني',
  comm_eval:    'التقييم التجاري',
  mgmt_review:  'مراجعة الإدارة',
  award:        'موصى بالترسية',
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
  const [prompt, setPrompt] = useState('')                       // AI chat input
  const [aiResult, setAiResult] = useState(null)                 // { query, results, explanation }
  const [thinking, setThinking] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [reassignModal, setReassignModal] = useState(null)       // pof: stage reassign
  const [evalModal, setEvalModal] = useState(null)               // biz_admin: evaluator reassign
  const [selectedEvaluator, setSelectedEvaluator] = useState('')

  const roleId = user?.role?.id
  const isBizAdmin = roleId === 'biz_admin'
  const isPof = roleId === 'pof'
  const isContractHolder = roleId === 'contract_holder'

  // Map tender status → the role that evaluates it
  const stageRoleMap = { tech_eval: 'tech_eval', comm_eval: 'comm_eval', mgmt_review: 'mgmt_review' }

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
    if (evalModal.status === 'mgmt_review') updateTender(evalModal.id, { assignedMgmt:    { id: target.id, name: target.name } })
    setEvalModal(null)
    setSelectedEvaluator('')
  }

  const statusLabels = lang === 'ar' ? statusLabelsAr : statusLabelsEn

  // AI prompt → filtered list. Everything is resolved locally from the tender
  // records; the short delay just makes the assistant feel like it's working.
  const askAi = (text) => {
    const query = String(text ?? prompt).trim()
    if (!query) return
    setPrompt(query)
    setThinking(true)
    setExpanded(null)
    setTimeout(() => {
      const { results, explanation } = runTenderQuery(query, tenders)
      setAiResult({ query, results, explanation })
      setThinking(false)
    }, 350)
  }

  const resetAi = () => {
    setPrompt('')
    setAiResult(null)
    setThinking(false)
    setExpanded(null)
  }

  const filtered = aiResult ? aiResult.results : tenders

  return (
    <div className="space-y-5">

      {/* Contract Engineer: Reassign Stage Modal */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Reassign Stage</h3>
                <p className="text-xs text-slate-500 mt-0.5">{reassignModal.id} — {reassignModal.title}</p>
              </div>
              <button onClick={() => setReassignModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                <X size={15} className="text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Current stage: <span className="font-semibold text-slate-700">{statusLabels[reassignModal.status] || reassignModal.stage}</span>
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
                      ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:bg-blue-50 hover:text-[var(--color-primary)] cursor-pointer'
                  }`}>
                  <span>{opt.label}</span>
                  {opt.status === reassignModal.status
                    ? <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Current</span>
                    : <RefreshCw size={13} />
                  }
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              Reassigning will reset evaluation progress to "not started" for the selected stage.
            </p>
          </div>
        </div>
      )}

      {/* Business Admin: Reassign Evaluator Modal */}
      {evalModal && (() => {
        const evaluators = getEvaluatorsForTender(evalModal)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Reassign Evaluator</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{evalModal.id} — {evalModal.title}</p>
                </div>
                <button onClick={() => { setEvalModal(null); setSelectedEvaluator('') }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <X size={15} className="text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Stage: <span className="font-semibold text-slate-700">{statusLabels[evalModal.status] || evalModal.stage}</span>
              </p>
              {evaluators.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No available evaluators for this stage.</p>
              ) : (
                <div className="space-y-2">
                  {evaluators.map(u => (
                    <button key={u.id}
                      onClick={() => setSelectedEvaluator(String(u.id))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        selectedEvaluator === String(u.id)
                          ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                          : 'border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:bg-blue-50'
                      }`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'var(--color-primary)' }}>
                        {u.avatar || u.name?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email || u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setEvalModal(null); setSelectedEvaluator('') }}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
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
      <div className="flex items-center justify-end gap-2">
        <div className="flex gap-2">
          {isContractHolder && (
            <Button onClick={() => navigate('/contract-strategy')} size="sm">
              <Plus size={13} /> New Tender
            </Button>
          )}
          {isPof && (
            <Button variant="secondary" onClick={() => navigate('/create-itt')} size="sm">
              <Plus size={13} /> New ITT
            </Button>
          )}
          {isPof && tenders.filter(td => td.status === 'award').length > 0 && (
            <Button onClick={() => navigate(`/contract/${tenders.find(td => td.status === 'award').id}`)} size="sm">
              <Briefcase size={13} /> Open Contract Draft
            </Button>
          )}
        </div>
      </div>

      {/* AI Assistant — natural-language filtering replaces the old tabs/search */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, var(--color-primary))' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {lang === 'ar' ? 'مساعد المناقصات الذكي' : 'Tender AI Assistant'}
              </p>
              <p className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'اكتب ما تريد رؤيته — مثل "المناقصات فوق مليون ريال"'
                  : 'Ask for what you need — e.g. "tenders above OMR 1 million with more than 3 bidders"'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') askAi() }}
                placeholder={lang === 'ar' ? 'اسأل عن المناقصات التي تحتاجها...' : 'Ask the AI to list the tenders you need...'}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300"
              />
            </div>
            <Button size="sm" onClick={() => askAi()} disabled={!prompt.trim() || thinking}>
              <SendHorizontal size={13} /> {thinking ? (lang === 'ar' ? 'جارٍ التحليل...' : 'Thinking...') : (lang === 'ar' ? 'اسأل' : 'Ask')}
            </Button>
            <Button variant="secondary" size="sm" onClick={resetAi} disabled={!aiResult && !prompt}>
              <RotateCcw size={13} /> {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
          </div>

          {/* Suggestion chips */}
          {!aiResult && !thinking && (
            <div className="flex flex-wrap gap-2">
              {QUERY_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => askAi(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 bg-white hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* AI response bubble */}
          {thinking && (
            <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
              <Sparkles size={13} className="animate-pulse" />
              {lang === 'ar' ? 'يتم تحليل الطلب...' : 'Analysing your request...'}
            </div>
          )}
          {!thinking && aiResult && (
            <div className="flex items-start justify-between gap-3 text-xs bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
              <div className="flex gap-2">
                <Sparkles size={13} className="text-violet-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-violet-700 font-medium">
                    {aiResult.results.length} {lang === 'ar' ? 'مناقصة مطابقة' : `of ${tenders.length} tenders matched`}
                  </p>
                  <p className="text-violet-500/80 mt-0.5">{aiResult.explanation}</p>
                </div>
              </div>
              <button onClick={resetAi} className="shrink-0 text-violet-400 hover:text-violet-600" title="Reset">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </Card>

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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Sparkles size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">
                      {lang === 'ar' ? 'لا توجد مناقصات مطابقة لطلبك.' : 'No tenders matched that request.'}
                    </p>
                    <button onClick={resetAi} className="mt-3 text-xs text-[var(--color-primary)] hover:underline">
                      {lang === 'ar' ? 'إعادة تعيين وعرض الكل' : 'Reset and show all tenders'}
                    </button>
                  </td>
                </tr>
              )}
              {filtered.map(td => (
                <Fragment key={td.id}>
                  <tr
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === td.id ? null : td.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{td.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{td.title}</p>
                      <p className="text-xs text-slate-400">{td.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[td.status] || 'info'}>
                        {statusLabels[td.status] || td.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{td.budget}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{td.deadline}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{td.bidders || '—'}</td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className={`text-slate-400 transition-transform ${expanded === td.id ? 'rotate-90' : ''}`} />
                    </td>
                  </tr>
                  {expanded === td.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="overflow-x-auto">
                            <StageTimeline currentStage={getTimelineStage(td)} />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="secondary" size="sm" onClick={() => navigate(getTenderRoute(td))}>
                              <Eye size={13} /> View Detail
                            </Button>
                            {/* Contract Holder actions */}
                            {isContractHolder && ['prequal_stage1','prequal_stage2','prequal_stage3','prequal_stage4'].includes(td.status) && (
                              <Button size="sm" onClick={() => navigate(`/pre-qualification/${td.id}`)}>
                                Continue Pre-Qualification
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
                            {roleId === 'mgmt_review' && td.status === 'mgmt_review' && (
                              <Button size="sm" onClick={() => navigate(`/mgmt-review/${td.id}`)}>
                                Management Review
                              </Button>
                            )}
                            {isPof && td.status === 'award' && (
                              <Button size="sm" onClick={() => navigate(`/contract/${td.id}`)}>
                                <Briefcase size={13} /> Create Contract
                              </Button>
                            )}
                            {/* Contract Engineer: Reassign Stage */}
                            {isPof && ['upload','tech_eval','comm_eval','mgmt_review'].includes(td.status) && (
                              <Button size="sm" variant="secondary"
                                onClick={e => { e.stopPropagation(); setReassignModal(td) }}>
                                <RefreshCw size={13} /> Reassign Stage
                              </Button>
                            )}
                            {/* Business Admin: Reassign Evaluator */}
                            {isBizAdmin && ['tech_eval','comm_eval','mgmt_review'].includes(td.status) && (
                              <Button size="sm" variant="secondary"
                                onClick={e => { e.stopPropagation(); setEvalModal(td); setSelectedEvaluator('') }}>
                                <RefreshCw size={13} /> Reassign
                              </Button>
                            )}
                            {td.aiScore && (
                              <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                                AI Score: {td.aiScore}%
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
