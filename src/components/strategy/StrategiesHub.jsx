import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CheckCircle, ChevronDown, Download, ExternalLink, FileSpreadsheet, FileText, Info,
  Layout, LayoutGrid, Lock, Sparkles,
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useDismissable } from '../../context/NavigationContext'
import { exportPreQualSummaryExcel, exportTemplateExcel } from '../../utils/exportExcel'
import { tenderRef } from '../../utils/tenderRef'
import {
  AUTO_GENERATE_CONFIRM_DESCRIPTION, AUTO_GENERATE_CONFIRM_TITLE, MANDATORY_TEMPLATE_IDS, PRE_QUAL_ID,
  STRATEGY_DOCUMENTS, findTemplateDef, includedTemplateIds, isPreQualAtFinalReview, isPreQualFinalised,
  isTemplateComplete, openTemplateFile, templateFormHref,
} from '../../utils/strategyTemplates'
import ConfirmDialog from './ConfirmDialog'
import SowCard from './SowCard'
import { YesNoToggle } from './YesNoToggle'

const ACTION_CLASS =
  'mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed'
const OPEN_TONE =
  'border-[rgba(0,137,207,0.125)] bg-[rgba(0,137,207,0.03)] text-[#0089cf] hover:border-[rgba(0,137,207,0.25)] hover:bg-[rgba(0,137,207,0.06)]'
const DONE_TONE =
  'border-[rgba(16,185,129,0.15)] bg-[rgba(16,185,129,0.06)] text-[#059669] hover:border-[rgba(16,185,129,0.3)] hover:bg-[rgba(16,185,129,0.1)]'

/** "Manage Templates" — an "Include this template?" menu; each Yes/No saves at once. */
function ManageTemplatesDropdown({ included, onToggle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useDismissable(open, () => setOpen(false))

  useEffect(() => {
    if (!open) return undefined
    const onDown = event => { if (ref.current && !ref.current.contains(event.target)) setOpen(false) }
    const onKey = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-[12px] font-semibold text-slate-600"
      >
        Manage Templates
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg z-40 py-2 olng-fade-in">
          <p className="px-4 pt-1 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Include this template?
          </p>
          {STRATEGY_DOCUMENTS.map(doc => (
            <div key={doc.id} className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2 hover:bg-slate-50">
              <span className="min-w-0 truncate text-[12px] font-medium text-slate-700">{doc.label}</span>
              {MANDATORY_TEMPLATE_IDS.has(doc.id) ? (
                <span
                  title="Always included - required for every tender"
                  className="flex shrink-0 items-center gap-1 rounded-md border border-[#0089cf]/30 bg-[#e8f3fb] px-2.5 py-1 text-[11px] font-semibold text-[#0089cf]"
                >
                  <Lock size={10} aria-hidden="true" />
                  Included
                </span>
              ) : (
                <YesNoToggle compact label={doc.label} value={included.includes(doc.id)} onChange={value => onToggle(doc.id, value)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** One required-template card (MAIN TemplateCard). */
function TemplateCard({ doc, isSubmitted, actionLabel, isLocked, onOpen }) {
  const Icon = doc.icon || LayoutGrid
  const isWorkflow = doc.isWorkflow
  let button
  if (isLocked) {
    button = (
      <button type="button" disabled className={`${ACTION_CLASS} ${DONE_TONE}`}>
        <CheckCircle size={13} aria-hidden="true" />
        {actionLabel ?? (isWorkflow ? 'Pre-Qualified - Generated' : 'Completed')}
      </button>
    )
  } else if (isSubmitted) {
    button = (
      <button type="button" onClick={onOpen} className={`${ACTION_CLASS} ${DONE_TONE}`}>
        <CheckCircle size={13} aria-hidden="true" />
        {actionLabel ?? (isWorkflow ? 'Pre-Qualified - Generated' : 'Completed - Click to Edit')}
      </button>
    )
  } else {
    button = (
      <button type="button" onClick={onOpen} className={`${ACTION_CLASS} ${OPEN_TONE}`}>
        {isWorkflow ? <ArrowRight size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
        {actionLabel ?? (isWorkflow ? 'Start Pre-Qualification' : 'Open AI-Powered Form')}
      </button>
    )
  }

  return (
    <Card className="flex flex-col p-5 border border-slate-100 transition-all duration-200 hover:-translate-y-1 hover:border-[#0089cf]/40">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#e8f3fb] text-[#0089cf]">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800 leading-tight break-words">{doc.label}</h4>
          <div className="text-[10px] font-bold tracking-wider mt-1.5 uppercase text-[#0089cf]">
            {isWorkflow ? 'Workflow' : 'AI-POWERED TEMPLATE'}
          </div>
        </div>
      </div>
      <p className="flex-1 text-xs text-slate-500">{doc.description}</p>
      {button}
    </Card>
  )
}

/** Footer progress trail + Back / Move Forward (MAIN TemplatesProgressFooter). */
function TemplatesProgressFooter({ includedDocs, completed, onBack, onNext }) {
  const submittedCount = includedDocs.filter(d => completed[d.id]).length
  const canProceed = submittedCount >= includedDocs.length
  const shortLabel = doc => (doc.id === PRE_QUAL_ID ? 'Pre-Qual' : doc.label.split(' ').slice(0, 2).join(' '))
  return (
    <div className="flex flex-col gap-5">
      <Card branded className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {includedDocs.map(doc => {
              const done = completed[doc.id]
              return (
                <div key={doc.id} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${done ? 'bg-[rgba(16,185,129,0.12)]' : 'bg-[rgba(148,163,184,0.12)]'}`}>
                    {done
                      ? <CheckCircle size={11} className="text-[#10b981]" aria-hidden="true" />
                      : <div className="w-2 h-2 rounded-full bg-[#cbd5e1]" aria-hidden="true" />}
                  </div>
                  <span className={`text-[10px] font-semibold ${done ? 'text-[#059669]' : 'text-[#94a3b8]'}`}>{shortLabel(doc)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex-1" />
          <span className="shrink-0 text-[11px] text-[#94a3b8]">{submittedCount} of {includedDocs.length} completed</span>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack} className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </Button>
        <Button
          type="button"
          variant="brand"
          onClick={onNext}
          disabled={!canProceed}
          title={!canProceed ? 'Submit every included template before moving forward' : undefined}
          className="flex items-center justify-center gap-2 py-3 px-6 text-[15px] w-full sm:w-auto"
        >
          Move Forward to PSF Strategy <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

/**
 * The Strategies hub (MAIN StrategyTemplatesPage): SOW card, the Yes/No
 * inclusion menu, one card per included template, the submitted documents
 * and the progress footer that releases PSF Strategy.
 */
export default function StrategiesHub({ tender, tenderId, navigate, updateTender }) {
  const [pendingOpenId, setPendingOpenId] = useState(null)

  const included = includedTemplateIds(tender)
  const includedDocs = STRATEGY_DOCUMENTS.filter(doc => included.includes(doc.id))
  const completed = Object.fromEntries(STRATEGY_DOCUMENTS.map(doc => [doc.id, isTemplateComplete(tender, doc.id)]))
  const ref = tenderRef(tender)

  const handleToggle = (id, include) => {
    const current = Array.isArray(tender.selectedTemplates) ? tender.selectedTemplates : STRATEGY_DOCUMENTS.map(d => d.id)
    const next = STRATEGY_DOCUMENTS.map(d => d.id).filter(docId => (
      MANDATORY_TEMPLATE_IDS.has(docId) || (docId === id ? include : current.includes(docId))
    ))
    updateTender(tenderId, { selectedTemplates: next })
  }

  const openTemplate = doc => {
    if (doc.id === PRE_QUAL_ID) {
      navigate(`/pre-qualification/${tenderId}`)
      return
    }
    if (completed[doc.id]) {
      navigate(templateFormHref(tenderId, doc.id))
      return
    }
    setPendingOpenId(doc.id)
  }

  const pqqAction = () => {
    if (isPreQualFinalised(tender)) return { isLocked: true }
    if (isPreQualAtFinalReview(tender)) return { actionLabel: 'Final Review' }
    return {}
  }

  const submittedDocs = includedDocs.filter(doc => doc.id !== PRE_QUAL_ID && completed[doc.id])
  const qualifiedBidders = (tender.prequalBidders || []).filter(b => !b.droppedAt)
  const showPreQualSummary = included.includes(PRE_QUAL_ID) && (tender.prequalBidders?.length || 0) > 0

  const goNext = () => {
    updateTender(tenderId, { cifProgressStage: 'psf' })
    navigate(`/psf-strategy/${tenderId}`)
  }

  return (
    <div className="space-y-5 w-full">
      <Card branded className="p-5 olng-slide-up">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#e8f3fb] text-[#0089cf]">
            <Layout size={16} aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-sm text-slate-800">{`Strategies - ${ref || tenderId}`}</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Complete the strategies below. AI will pre-fill the template data for your review - edit as needed, then submit each template to download.
        </p>
      </Card>

      {tender.sowDocument ? (
        <SowCard
          sow={tender.sowDocument}
          title={tender.title}
          reference={ref}
          budget={tender.budget}
          onSave={sow => updateTender(tenderId, { sowDocument: sow })}
        />
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#0089cf]/20 bg-[#e8f3fb] px-4 py-3 text-xs text-[#1b4c6f]" role="status">
          <Info size={15} className="shrink-0 mt-px text-[#0089cf]" aria-hidden="true" />
          No generated Statement of Work is available for this draft.
        </div>
      )}

      <Card className="p-4 sm:p-6 border border-slate-100 olng-slide-up relative z-20" style={{ animationDelay: '40ms' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-800">Required Templates</h3>
          <ManageTemplatesDropdown included={included} onToggle={handleToggle} />
        </div>

        {includedDocs.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#0089cf]/20 bg-[#e8f3fb] px-4 py-3 text-xs text-[#1b4c6f]" role="status">
            <Info size={15} className="shrink-0 mt-px text-[#0089cf]" aria-hidden="true" />
            Since you haven&apos;t selected any templates, we will move straight to your PSF (Procurement Strategy Form) strategy.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {includedDocs.map(doc => (
              <TemplateCard
                key={doc.id}
                doc={doc}
                isSubmitted={completed[doc.id]}
                {...(doc.id === PRE_QUAL_ID ? pqqAction() : {})}
                onOpen={() => openTemplate(doc)}
              />
            ))}
          </div>
        )}
      </Card>

      {(submittedDocs.length > 0 || showPreQualSummary) && (
        <Card className="p-4 sm:p-6 border border-slate-100 olng-slide-up" style={{ animationDelay: '75ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <FileText size={18} className="shrink-0 text-[#0089cf]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-x-2">
              Submitted Documents <span className="text-slate-400 font-normal text-xs">- download as Excel</span>
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {submittedDocs.map(doc => {
              const def = findTemplateDef(doc.id)
              const rows = tender[def.dataKey] || []
              // The row's download is always the Excel export (MAIN labels every
              // submitted document "Excel Spreadsheet (.xlsx)"), so a Word label
              // here would promise a file type the button never delivers.
              const typeLabel = 'Excel Spreadsheet (.xlsx)'
              return (
                <div key={doc.id} className="flex items-center justify-between gap-3 p-3 sm:px-4 rounded-xl border border-slate-200 bg-white hover:border-[#0089cf]/40 transition-colors group">
                  <button
                    type="button"
                    onClick={() => openTemplateFile(def, rows, tender, tenderId)}
                    title="Open in new tab"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#e8f3fb] text-[#0089cf]">
                      <FileText size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800 leading-tight break-words">{doc.label}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{typeLabel}</span>
                    </span>
                    <ExternalLink size={14} className="ml-auto shrink-0 text-slate-300 group-hover:text-[#0089cf] transition-colors" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => exportTemplateExcel(def, rows, tender)}
                    title={`Download ${doc.label} as Excel`}
                    aria-label={`Download ${doc.label} as Excel`}
                    className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 px-2.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Download size={14} aria-hidden="true" /> Excel
                  </button>
                </div>
              )
            })}
            {showPreQualSummary && (
              <div className="flex items-center justify-between gap-3 p-3 sm:px-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                    <FileSpreadsheet size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 leading-tight break-words">Pre-Qualification Summary</h4>
                    <div className="text-[10px] text-slate-400 mt-0.5">Excel Spreadsheet (.xlsx) - bidders, outcomes and financial results</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => exportPreQualSummaryExcel(tender, qualifiedBidders)}
                  title="Download Pre-Qualification Summary as Excel"
                  aria-label="Download Pre-Qualification Summary as Excel"
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 px-2.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Download size={14} aria-hidden="true" /> Excel
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      <TemplatesProgressFooter
        includedDocs={includedDocs}
        completed={completed}
        onBack={() => navigate(`/contract-strategy/${tenderId}`)}
        onNext={goNext}
      />

      <ConfirmDialog
        isOpen={pendingOpenId !== null}
        icon={Sparkles}
        title={AUTO_GENERATE_CONFIRM_TITLE}
        description={AUTO_GENERATE_CONFIRM_DESCRIPTION}
        confirmLabel="Open form"
        onConfirm={() => {
          const id = pendingOpenId
          setPendingOpenId(null)
          if (id) navigate(templateFormHref(tenderId, id, true))
        }}
        onClose={() => setPendingOpenId(null)}
      />
    </div>
  )
}
