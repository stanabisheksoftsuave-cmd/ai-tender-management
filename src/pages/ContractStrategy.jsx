import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Target, Building2, ShieldOff, ArrowRight, FileText, AlertCircle,
  DollarSign, Calendar, Clock, Hash, Briefcase, ShieldAlert,
  UploadCloud, X, Paperclip, Bot, Sparkles, CheckCircle, RefreshCw,
  Circle, Download, Edit3, ChevronRight, Wand2, Undo2
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler, useDismissable } from '../context/NavigationContext'
import { applyAiInstruction } from '../utils/aiTextEdit'

// Dropdown options are now read from TenderContext (admin-configurable)

const SOW_GEN_TASKS = [
  'Analysing contract requirements & scope overview',
  'Identifying key deliverables & milestones',
  'Mapping HSSE & compliance requirements',
  'Defining performance & acceptance criteria',
  'Structuring work breakdown & responsibilities',
  'Drafting contract terms & conditions alignment',
  'Generating Statement of Work document',
  'Finalising SOW for review',
]

/** Generates a detailed SOW document based on form data */
function generateSowContent(form, tenderId) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const riskColor = { Low: '#059669', Medium: '#d97706', High: '#dc2626', Critical: '#7c2d12' }[form.contractRisk] || '#64748b'

  return {
    title: `Statement of Work — ${form.title}`,
    reference: tenderId || 'TBD',
    generatedDate: today,
    sections: [
      {
        heading: '1. Introduction & Background',
        content: `This Statement of Work (SOW) document defines the requirements, deliverables, and responsibilities for "${form.title}" under the ${form.department || 'requesting department'}. The contract has an estimated value of ${form.budget}.`,
      },
      {
        heading: '2. Objective',
        content: form.description || 'The objective of this contract is to deliver the specified goods/services/works in accordance with Oman LNG standards, safety requirements, and applicable regulations.',
      },
      {
        heading: '3. Statement of Work',
        content: `The Contractor shall provide all necessary resources, materials, equipment, and personnel required to execute the following scope:\n\n• Mobilisation and establishment of required facilities\n• Execution of all works/services as described in the project scope overview\n• Compliance with all Oman LNG QHSSE requirements and standards\n• Provision of regular progress reports and documentation\n• Demobilisation and site restoration upon completion`,
      },
      {
        heading: '4. Contract Details',
        items: [
          { label: 'Tender Type', value: form.tenderType },
          { label: 'Estimated Value', value: form.budget },
          ...(form.costCode ? [{ label: 'Cost Code', value: form.costCode }] : []),
          { label: 'Required By', value: form.deadline },
          ...(form.duration ? [{ label: 'Contract Duration', value: form.duration }] : []),
        ],
      },
      {
        heading: '5. Key Deliverables & Milestones',
        content: `The following milestones shall apply to this contract:\n\n• Milestone 1 — Mobilisation & Kick-off: Within 14 days of contract award\n• Milestone 2 — Detailed Work Plan Submission: Within 30 days\n• Milestone 3 — Progress Review (50% completion): As per agreed schedule\n• Milestone 4 — Substantial Completion: Prior to ${form.deadline || 'agreed deadline'}\n• Milestone 5 — Final Completion & Handover: As per contract terms`,
      },
      {
        heading: '6. QHSSE Requirements',
        content: `The Contractor shall comply with all Oman LNG QHSSE requirements including but not limited to:\n\n• Life Saving Rules and Permit to Work system\n• Environmental management and waste disposal standards\n• Incident reporting and investigation procedures\n• Personnel competency and training requirements\n• Emergency response and evacuation procedures`,
      },
      {
        heading: '7. Performance Standards & Acceptance Criteria',
        content: `All deliverables shall meet the following standards:\n\n• Compliance with applicable Omani regulations and Oman LNG standards\n• Quality management system aligned with ISO 9001 requirements\n• Zero LTI (Lost Time Injury) target throughout contract duration\n• Timely delivery per the agreed project schedule\n• Documentation in accordance with Oman LNG document control procedures`,
      },
      {
        heading: '8. Responsibilities',
        subsections: [
          { title: 'Contractor Responsibilities', items: ['Provide all labour, materials, and equipment', 'Maintain compliance with QHSSE requirements', 'Submit progress reports as required', 'Ensure quality control throughout execution'] },
          { title: 'Oman LNG Responsibilities', items: ['Provide site access and necessary permits', 'Designate Contract Holder for contract administration', 'Provide timely reviews and approvals', 'Process payments per contract terms'] },
        ],
      },
    ],
  }
}

/* ─────────── SOW inline AI editing helpers ───────────
   A "path" identifies an editable text node inside the SOW document:
     content:<sectionIdx>              → section.content
     item:<sectionIdx>:<itemIdx>       → section.items[i].value
     sub:<sectionIdx>:<subIdx>:<liIdx> → section.subsections[s].items[i]        */

function readSowPath(doc, path) {
  const [kind, ...ix] = path.split(':')
  const [a, b, c] = ix.map(Number)
  const section = doc.sections[a]
  if (!section) return ''
  if (kind === 'content') return section.content || ''
  if (kind === 'item') return section.items?.[b]?.value || ''
  if (kind === 'subtitle') return section.subsections?.[b]?.title || ''
  if (kind === 'sub') return section.subsections?.[b]?.items?.[c] || ''
  return ''
}

function writeSowPath(doc, path, text) {
  const [kind, ...ix] = path.split(':')
  const [a, b, c] = ix.map(Number)
  return {
    ...doc,
    sections: doc.sections.map((section, si) => {
      if (si !== a) return section
      if (kind === 'content') return { ...section, content: text }
      if (kind === 'item') return { ...section, items: section.items.map((it, ii) => ii === b ? { ...it, value: text } : it) }
      if (kind === 'subtitle') return {
        ...section,
        subsections: section.subsections.map((sub, bi) => bi === b ? { ...sub, title: text } : sub),
      }
      if (kind === 'sub') return {
        ...section,
        subsections: section.subsections.map((sub, bi) => bi !== b ? sub : {
          ...sub, items: sub.items.map((li, li2) => li2 === c ? text : li),
        }),
      }
      return section
    }),
  }
}

// applyAiInstruction now lives in src/utils/aiTextEdit.js so every select-to-edit
// surface shares one engine.

export default function ContractStrategy() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { tenders, addTender, updateTender, dropdownConfig } = useTenders()

  // Read admin-configurable dropdown options from context
  const TENDER_TYPES = dropdownConfig.tenderTypes
  const CONTRACT_MODES = dropdownConfig.contractModes
  const CONTRACT_RISKS = dropdownConfig.contractRisks
  const CURRENCIES = dropdownConfig.currencies
  const CONFIGURED_DEPARTMENTS = dropdownConfig.departments || []

  const existingTender = tenderId ? tenders.find(t => t.id === tenderId) : null

  const [form, setForm] = useState({
    title:           existingTender?.title || '',
    tenderType:      existingTender?.tenderType || TENDER_TYPES[0],
    department:      existingTender?.department || '',
    budget:          existingTender?.budget || '',
    costCode:        existingTender?.costCode || '',
    deadline:        existingTender?.deadline || '',
    duration:        existingTender?.duration || '',
    description:     existingTender?.description || '',
    contractMode:    existingTender?.contractMode || '',
    contractRisk:    existingTender?.contractRisk || '',
    currency:        existingTender?.currency || 'USD',
  })
  const [hsseFile, setHsseFile] = useState(existingTender?.hsseRiskRegister || null)
  const [showErrors, setShowErrors] = useState(false)
  const hsseInputRef = useRef(null)

  // Step system: 0 = Form, 1 = AI Generation, 2 = SOW Review
  const [step, setStep] = useState(0)
  const [genStep, setGenStep] = useState(0)
  const [savedTenderId, setSavedTenderId] = useState(existingTender?.id || null)
  const [sowContent, setSowContent] = useState(null)
  const [sowEditing, setSowEditing] = useState(false)
  const [sowEditText, setSowEditText] = useState('')

  // Inline AI editing: text selection inside the SOW preview opens a prompt popup
  const sowBodyRef = useRef(null)
  const [sowSel, setSowSel] = useState(null)   // { path, start, end, text, top, left }
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [sowUndo, setSowUndo] = useState(null) // previous sowContent, for one-step revert

  const closeSowSel = useCallback(() => setSowSel(null), [])

  useEffect(() => {
    if (!sowSel) return
    const onKey = e => { if (e.key === 'Escape') closeSowSel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sowSel, closeSowSel])

  // Overlays unwind before the step handler below, newest-first: the selection
  // popover sits above the edit panel, so it must register last.
  useDismissable(sowEditing, () => setSowEditing(false))
  useDismissable(sowSel, closeSowSel)

  // Step 1 is a transient animation, so both it and the SOW review unwind to the
  // form — stepping 2 -> 1 would just re-run generation.
  const backToForm = () => {
    setGenStep(0)
    setStep(0)
  }

  useBackHandler(() => {
    if (step === 0) return false
    backToForm()
    return true
  }, [step])

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">{t('access.restricted')}</p>
      <p className="text-xs">Only Contract Holders can access this page.</p>
    </div>
  )

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const setBudget = (raw) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (!digits) { setField('budget', ''); return }
    const num = parseInt(digits, 10)
    const cur = CURRENCIES.find(c => c.code === form.currency) || CURRENCIES[0]
    setField('budget', cur.code + ' ' + num.toLocaleString('en-US'))
  }

  const handleCurrencyChange = (code) => {
    setField('currency', code)
    // Re-format budget with new currency
    const digits = (form.budget || '').replace(/[^0-9]/g, '')
    if (!digits) return
    const num = parseInt(digits, 10)
    setField('budget', code + ' ' + num.toLocaleString('en-US'))
  }

  const requiredFields = ['title', 'budget', 'deadline', 'description']
  const isFormValid = requiredFields.every(f => form[f].trim() !== '')
  const fieldError = (key) => showErrors && form[key].trim() === ''

  // Duration helpers
  const yearOpts  = Array.from({ length: 11 }, (_, i) => i)
  const monthOpts = Array.from({ length: 12 }, (_, i) => i)
  const durationMatch = (form.duration || '').match(/^(\d+)\s+year[s]?\s+(\d+)\s+month[s]?$/)
  const selYears  = durationMatch ? durationMatch[1] : ''
  const selMonths = durationMatch ? durationMatch[2] : ''
  const setDuration = (y, m) => {
    if (y === '' && m === '') { setField('duration', ''); return }
    const yv = y !== '' ? y : '0'
    const mv = m !== '' ? m : '0'
    setField('duration', `${yv} year${yv === '1' ? '' : 's'} ${mv} month${mv === '1' ? '' : 's'}`)
  }

  const handleHsseUpload = (file) => {
    if (!file) return
    setHsseFile(file)
  }

  // Save the tender and start AI generation
  const handleGenerate = () => {
    if (!isFormValid) { setShowErrors(true); return }

    const payload = {
      ...form,
      hsseRiskRegister: hsseFile || null,
    }

    let id = savedTenderId

    if (existingTender) {
      updateTender(existingTender.id, payload)
      id = existingTender.id
    } else {
      const maxNum = tenders.reduce((max, t) => Math.max(max, parseInt(t.id.split('-')[2]) || 0), 0)
      const newId = `ITT-2025-${String(maxNum + 1).padStart(3, '0')}`
      addTender({
        id: newId,
        ...payload,
        status: 'prequal_stage1',
        stage: 'Pre-Qualification — Bidder Matching',
        created: new Date().toISOString().split('T')[0],
        bidders: 0,
        bidderList: [],
        aiScore: null,
      })
      id = newId
    }

    setSavedTenderId(id)
    setGenStep(0)
    setStep(1) // Start AI generation
  }

  // Auto-tick generation tasks
  useEffect(() => {
    if (step !== 1) return
    if (genStep >= SOW_GEN_TASKS.length) {
      const timer = setTimeout(() => {
        const sow = generateSowContent(form, savedTenderId)
        setSowContent(sow)
        // Save SOW content to tender
        if (savedTenderId) {
          updateTender(savedTenderId, { sowDocument: sow })
        }
        setStep(2) // Move to SOW Review
      }, 400)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setGenStep(g => g + 1), 600)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, genStep])

  /** Capture a text selection inside the SOW preview and anchor the prompt popup to it */
  const handleSowSelect = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) return
    const range = selection.getRangeAt(0)
    const startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer
    const host = startEl?.closest?.('[data-sow-path]')
    if (!host || !sowBodyRef.current?.contains(host)) { setSowSel(null); return }

    // Offset of the selection start within the host's text
    const pre = document.createRange()
    pre.selectNodeContents(host)
    pre.setEnd(range.startContainer, range.startOffset)
    const start = pre.toString().length

    // Clamp the end to this node. A drag that runs past it — into the next
    // bullet, or starting on a subsection title — still edits the node it began
    // in, instead of silently doing nothing (the old cross-node guard bug).
    const hostText = host.textContent || ''
    let end
    if (host.contains(range.endContainer)) {
      const preEnd = document.createRange()
      preEnd.selectNodeContents(host)
      preEnd.setEnd(range.endContainer, range.endOffset)
      end = preEnd.toString().length
    } else {
      end = hostText.length
    }
    const text = hostText.slice(start, end)
    if (!text.trim()) { setSowSel(null); return }

    const rect = range.getBoundingClientRect()
    const bodyRect = sowBodyRef.current.getBoundingClientRect()
    setSowSel({
      path: host.dataset.sowPath,
      start, end, text,
      top: rect.bottom - bodyRect.top + 10,
      left: Math.max(0, Math.min(rect.left - bodyRect.left, bodyRect.width - 400)),
    })
    setAiPrompt('')
  }

  /** Run the instruction against the selected text and splice the result back in */
  const handleApplyAiEdit = () => {
    if (!sowSel || !aiPrompt.trim() || aiBusy) return
    setAiBusy(true)
    setTimeout(() => {
      const original = readSowPath(sowContent, sowSel.path)
      const selected = original.slice(sowSel.start, sowSel.end)
      const rewritten = applyAiInstruction(selected, aiPrompt)
      let next = original.slice(0, sowSel.start) + rewritten + original.slice(sowSel.end)
      next = next.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n')

      const updatedSow = writeSowPath(sowContent, sowSel.path, next)
      setSowUndo(sowContent)
      setSowContent(updatedSow)
      if (savedTenderId) updateTender(savedTenderId, { sowDocument: updatedSow })
      // Keep the page description in sync when the Objective section is edited
      if (sowSel.path === 'content:1') {
        setField('description', next)
        if (savedTenderId) updateTender(savedTenderId, { description: next })
      }
      window.getSelection()?.removeAllRanges()
      setAiBusy(false)
      setSowSel(null)
      setAiPrompt('')
    }, 700)
  }

  const handleUndoAiEdit = () => {
    if (!sowUndo) return
    setSowContent(sowUndo)
    if (savedTenderId) updateTender(savedTenderId, { sowDocument: sowUndo })
    setSowUndo(null)
  }

  const handleDownloadSow = () => {
    if (!sowContent) return
    let text = `${sowContent.title}\nReference: ${sowContent.reference}\nGenerated: ${sowContent.generatedDate}\n${'='.repeat(60)}\n\n`
    sowContent.sections.forEach(s => {
      text += `${s.heading}\n${'-'.repeat(40)}\n`
      if (s.content) text += `${s.content}\n\n`
      if (s.items) s.items.forEach(i => { text += `  ${i.label}: ${i.value}\n` }); if (s.items) text += '\n'
      if (s.subsections) s.subsections.forEach(sub => {
        text += `  ${sub.title}:\n`
        sub.items.forEach(item => { text += `    • ${item}\n` })
        text += '\n'
      })
    })
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SOW-${savedTenderId || 'Draft'}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleProceedToTemplates = () => {
    navigate(`/strategy-templates/${savedTenderId}`)
  }

  const riskBadgeStyle = (risk) => {
    const map = {
      Low:      { bg: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' },
      Medium:   { bg: 'rgba(217,119,6,0.08)',   color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' },
      High:     { bg: 'rgba(220,38,38,0.08)',   color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' },
      Critical: { bg: 'rgba(124,45,18,0.08)',   color: '#7c2d12', border: '1px solid rgba(124,45,18,0.2)' },
    }
    return map[risk] || map.Low
  }

  return (
    <div className="space-y-5 w-full">

      {/* ══════════════ STEP 0: CONTRACT DETAILS FORM ══════════════ */}
      {step === 0 && (
        <>
          {/* Header Card */}
          <Card branded className="p-5 olng-slide-up">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                <Target size={16} style={{ color: '#0089cf' }} />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: '#1b4c6f' }}>
                {existingTender ? `Contract Strategy — ${existingTender.id}` : 'New Contract Strategy'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Define the contract details for this tender. AI will generate a Statement of Work document
              from your inputs before proceeding to Pre-Qualification.
            </p>
          </Card>

          {/* CONTRACT DETAILS FORM */}
          <Card branded className="p-6 space-y-5 olng-slide-up" style={{ animationDelay: '60ms' }}>
            <h3 className="font-semibold flex items-center gap-2.5" style={{ color: '#1b4c6f', fontSize: '15px' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                <FileText size={16} style={{ color: '#0089cf' }} />
              </div>
              Contract Initiating Form
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Contract / Project Title — full width */}
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  {t('itt.fieldTitle')}
                  <span style={{ color: '#0089cf' }}>*</span>
                </label>
                <input
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="e.g. Supply of Gas Turbine Spare Parts"
                  className={`w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${fieldError('title') ? 'olng-input--error' : ''}`}
                />
                {fieldError('title') && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />Project Title is required</p>
                )}
              </div>

              {/* Tender Type */}
              <div>
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  <Briefcase size={12} style={{ color: '#0089cf' }} />
                  Tender Type
                </label>
                <select
                  value={form.tenderType}
                  onChange={e => setField('tenderType', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input bg-white"
                >
                  {TENDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  <Building2 size={12} style={{ color: '#0089cf' }} />
                  {t('itt.fieldDept')}
                </label>
                <select
                  value={form.department}
                  onChange={e => setField('department', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input"
                >
                  <option value="">Select department…</option>
                  {/* An existing tender may carry a department predating this list —
                      keep it as an option so editing doesn't silently blank it. */}
                  {(form.department && !CONFIGURED_DEPARTMENTS.includes(form.department)
                    ? [form.department, ...CONFIGURED_DEPARTMENTS]
                    : CONFIGURED_DEPARTMENTS
                  ).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Anticipated Value */}
              <div>
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  <DollarSign size={12} style={{ color: '#0089cf' }} />
                  {t('itt.fieldBudget')}
                  <span style={{ color: '#0089cf' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.currency}
                    onChange={e => handleCurrencyChange(e.target.value)}
                    className="w-28 px-2 py-2.5 text-sm focus:outline-none transition-all olng-input bg-white font-semibold"
                    style={{ color: '#1b4c6f' }}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <input
                    value={form.budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="e.g. 500,000"
                    className={`flex-1 px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${fieldError('budget') ? 'olng-input--error' : ''}`}
                  />
                </div>
                {fieldError('budget') && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />Budget is required</p>
                )}
              </div>

              {/* Cost Code */}
              <div>
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  <Hash size={12} style={{ color: '#0089cf' }} />
                  {t('strategy.fieldCostCode')}
                </label>
                <input
                  value={form.costCode}
                  onChange={e => setField('costCode', e.target.value)}
                  placeholder="e.g. CC-2025-001"
                  className="w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input"
                />
              </div>

              {/* Date Required */}
              <div>
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  <Calendar size={12} style={{ color: '#0089cf' }} />
                  {t('itt.fieldDeadline')}
                  <span style={{ color: '#0089cf' }}>*</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setField('deadline', e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${fieldError('deadline') ? 'olng-input--error' : ''}`}
                />
                {fieldError('deadline') && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />Deadline is required</p>
                )}
              </div>

              {/* Duration (Years + Months) */}
              <div>
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  <Clock size={12} style={{ color: '#0089cf' }} />
                  {t('itt.fieldDuration')}
                </label>
                <div className="flex gap-2">
                  <select
                    value={selYears}
                    onChange={e => setDuration(e.target.value, selMonths)}
                    className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input bg-white">
                    <option value="">Years</option>
                    {yearOpts.map(y => <option key={y} value={y}>{y} year{y === 1 ? '' : 's'}</option>)}
                  </select>
                  <select
                    value={selMonths}
                    onChange={e => setDuration(selYears, e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input bg-white">
                    <option value="">Months</option>
                    {monthOpts.map(m => <option key={m} value={m}>{m} month{m === 1 ? '' : 's'}</option>)}
                  </select>
                </div>
              </div>


              {/* Scope Overview — full width textarea */}
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  {t('strategy.fieldScopeOverview')}
                  <span style={{ color: '#0089cf' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Provide Scope Overview — describe the project scope, objectives, and key requirements..."
                  className={`w-full px-3.5 py-2.5 text-sm focus:outline-none resize-none transition-all olng-input ${fieldError('description') ? 'olng-input--error' : ''}`}
                />
                {fieldError('description') && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />Scope Overview is required</p>
                )}
              </div>

            </div>
          </Card>

          {/* Submit / Generate SOW */}
          <div className="flex items-center justify-end gap-3 olng-slide-up" style={{ animationDelay: '120ms' }}>
            {showErrors && !isFormValid && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 mr-auto">
                <AlertCircle size={11} />Please fill in all required fields marked with *
              </p>
            )}
            <Button variant="brand" onClick={handleGenerate} className="flex items-center gap-2 py-3 px-6 text-[15px]">
              <Sparkles size={16} />
              Generate SOW with AI
            </Button>
          </div>

          {!showErrors && (
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              AI will generate a detailed Statement of Work document based on your contract details.
            </p>
          )}
        </>
      )}

      {/* ══════════════ STEP 1: AI GENERATION LOADER ══════════════ */}
      {step === 1 && (
        <Card branded className="p-12 olng-scale-in">
          <div className="olng-dot-pattern absolute inset-0 opacity-40 pointer-events-none rounded-2xl" style={{ position: 'absolute' }} />
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 olng-float" style={{
                background: 'linear-gradient(135deg, rgba(0,137,207,0.15), rgba(27,76,111,0.1))',
                boxShadow: '0 8px 32px rgba(0,137,207,0.15)'
              }}>
                <Bot size={36} style={{ color: '#0089cf' }} />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1b4c6f' }}>AI is Generating Your SOW</h3>
              <p className="text-sm text-slate-400">Building the Statement of Work document from your contract details and compliance standards</p>
            </div>

            <div className="max-w-sm mx-auto space-y-3 mb-10">
              {SOW_GEN_TASKS.map((task, i) => (
                <div key={i} className="flex items-center gap-3 olng-slide-up olng-stagger" style={{ '--i': i }}>
                  <div className={`olng-gen-dot shrink-0 ${
                    i < genStep ? 'olng-gen-dot--done' :
                    i === genStep ? 'olng-gen-dot--active' :
                    'olng-gen-dot--pending'
                  }`}>
                    {i < genStep
                      ? <CheckCircle size={14} className="text-white" />
                      : i === genStep
                      ? <RefreshCw size={13} className="text-white animate-spin" />
                      : <Circle size={12} style={{ color: '#cce6f8' }} />}
                  </div>
                  <span className={`text-sm transition-colors ${
                    i < genStep ? 'text-slate-400 line-through' :
                    i === genStep ? 'font-semibold' : 'text-slate-300'
                  }`} style={i === genStep ? { color: '#1b4c6f' } : {}}>{task}</span>
                </div>
              ))}
            </div>

            <div className="max-w-sm mx-auto">
              <div className="olng-progress-bar h-2">
                <div
                  className="olng-progress-fill"
                  style={{ width: `${Math.round((genStep / SOW_GEN_TASKS.length) * 100)}%` }}
                />
              </div>
              <p className="text-center text-xs mt-2.5 font-medium" style={{ color: '#0089cf' }}>
                {Math.round((genStep / SOW_GEN_TASKS.length) * 100)}% complete
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ══════════════ STEP 2: SOW REVIEW ══════════════ */}
      {step === 2 && sowContent && (
        <div className="space-y-5 olng-slide-up">
          {/* SOW Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))'
              }}>
                <FileText size={20} style={{ color: '#0089cf' }} />
              </div>
              <div>
                <h2 className="font-bold" style={{ color: '#1b4c6f' }}>Statement of Work — Generated</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {sowContent.reference} · Generated {sowContent.generatedDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{
                background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)'
              }}>
                <CheckCircle size={12} /> AI Generated
              </span>
            </div>
          </div>

          {/* SOW Document Card */}
          <Card branded className="p-0 overflow-hidden">
            {/* Document title bar */}
            <div className="px-6 py-4 flex items-center justify-between" style={{
              background: 'linear-gradient(135deg, rgba(27,76,111,0.06), rgba(0,137,207,0.04))',
              borderBottom: '1px solid rgba(0,137,207,0.1)'
            }}>
              <div>
                <h3 className="font-bold text-[15px]" style={{ color: '#1b4c6f' }}>{sowContent.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Reference: {sowContent.reference} · {form.contractMode} · {form.budget}</p>
                <p className="flex items-center gap-1 text-[10.5px] mt-1 font-medium" style={{ color: '#0089cf' }}>
                  <Wand2 size={10} /> Select any text in the document to edit it with AI
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sowUndo && (
                  <button
                    onClick={handleUndoAiEdit}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white"
                    style={{ color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}
                  >
                    <Undo2 size={11} /> Undo AI Edit
                  </button>
                )}
                <button
                  onClick={() => { setSowEditing(!sowEditing); if (!sowEditing) setSowEditText(form.description) }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white"
                  style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}
                >
                  <Edit3 size={11} /> {sowEditing ? 'Cancel Edit' : 'Edit Scope'}
                </button>
                <button
                  onClick={handleDownloadSow}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white"
                  style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}
                >
                  <Download size={11} /> Download SOW
                </button>
              </div>
            </div>

            {/* Document body — select any text to open the AI instruction popup */}
            <div
              ref={sowBodyRef}
              onMouseUp={handleSowSelect}
              className="relative px-6 py-5 space-y-5 text-sm leading-relaxed"
              style={{ color: '#334155' }}
            >
              {sowContent.sections.map((section, si) => (
                <div key={si}>
                  <h4 className="font-bold text-[13px] mb-2 flex items-center gap-2" style={{ color: '#1b4c6f' }}>
                    <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #0089cf, #1b4c6f)' }} />
                    {section.heading}
                  </h4>

                  {section.content && (
                    <div
                      data-sow-path={`content:${si}`}
                      className="pl-4 text-[12.5px] whitespace-pre-line text-slate-600 leading-6 olng-sow-editable"
                    >
                      {section.content}
                    </div>
                  )}

                  {section.items && (
                    <div className="pl-4 grid grid-cols-2 gap-2 mt-2">
                      {section.items.map((item, ii) => (
                        <div key={ii} className="flex items-center justify-between rounded-lg px-3 py-2" style={{
                          background: 'rgba(236,244,252,0.5)',
                          border: '1px solid rgba(0,137,207,0.08)'
                        }}>
                          <span className="text-[11px] text-slate-400">{item.label}</span>
                          <span data-sow-path={`item:${si}:${ii}`} className="text-[11px] font-semibold" style={{ color: item.color || '#1b4c6f' }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.subsections && (
                    <div className="pl-4 space-y-3 mt-2">
                      {section.subsections.map((sub, si2) => (
                        <div key={si2}>
                          <p data-sow-path={`subtitle:${si}:${si2}`} className="text-[12px] font-semibold mb-1 olng-sow-editable" style={{ color: '#1b4c6f' }}>{sub.title}</p>
                          <ul className="space-y-1">
                            {sub.items.map((item, ii) => (
                              <li key={ii} className="text-[12px] text-slate-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#0089cf' }} />
                                <span data-sow-path={`sub:${si}:${si2}:${ii}`} className="olng-sow-editable">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* ── AI instruction popup (anchored to the selected text) ── */}
              {sowSel && (
                <div
                  onMouseUp={e => e.stopPropagation()}
                  className="absolute z-30 w-[400px] rounded-xl olng-slide-up"
                  style={{
                    top: sowSel.top, left: sowSel.left,
                    background: '#fff',
                    border: '1px solid rgba(0,137,207,0.25)',
                    boxShadow: '0 12px 32px rgba(27,76,111,0.18)',
                  }}
                >
                  <div className="flex items-center justify-between px-3.5 py-2.5" style={{
                    background: 'linear-gradient(135deg, rgba(0,137,207,0.08), rgba(27,76,111,0.04))',
                    borderBottom: '1px solid rgba(0,137,207,0.12)',
                  }}>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: '#0089cf' }}>
                      <Wand2 size={12} /> Edit with AI
                    </span>
                    <button onClick={() => setSowSel(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={13} />
                    </button>
                  </div>

                  <div className="p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Selected text</p>
                    <p className="text-[11px] text-slate-500 italic line-clamp-3 mb-3 pl-2" style={{ borderLeft: '2px solid rgba(0,137,207,0.3)' }}>
                      {sowSel.text}
                    </p>

                    <textarea
                      autoFocus
                      rows={2}
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleApplyAiEdit() }
                      }}
                      placeholder="Tell AI how to update this… e.g. “make it more formal”, “shorten this”, “replace 14 days with 21 days”"
                      className="w-full px-3 py-2 text-[12px] focus:outline-none resize-none transition-all olng-input"
                    />

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['Make it more formal', 'Shorten this', 'Expand with more detail', 'Convert to bullet points'].map(sug => (
                        <button
                          key={sug}
                          onClick={() => setAiPrompt(sug)}
                          className="text-[10px] px-2 py-1 rounded-md transition-all hover:bg-white"
                          style={{ color: '#0089cf', background: 'rgba(0,137,207,0.06)', border: '1px solid rgba(0,137,207,0.15)' }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="secondary" onClick={() => setSowSel(null)} className="text-[11px] py-1.5 px-3">Cancel</Button>
                      <Button
                        variant="brand"
                        disabled={!aiPrompt.trim() || aiBusy}
                        onClick={handleApplyAiEdit}
                        className="text-[11px] py-1.5 px-3 flex items-center gap-1.5"
                      >
                        {aiBusy
                          ? <><RefreshCw size={11} className="animate-spin" /> Applying…</>
                          : <><Sparkles size={11} /> Apply</>}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Scope Edit Mode */}
          {sowEditing && (
            <Card branded accent className="p-5 olng-slide-up">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#0089cf' }}>Edit Scope Overview</h4>
              <textarea
                rows={5}
                value={sowEditText}
                onChange={e => setSowEditText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm focus:outline-none resize-none transition-all olng-input"
                placeholder="Update the scope overview..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="secondary" onClick={() => setSowEditing(false)}>Cancel</Button>
                <Button variant="brand" onClick={() => {
                  setField('description', sowEditText)
                  if (savedTenderId) updateTender(savedTenderId, { description: sowEditText })
                  const updatedSow = generateSowContent({ ...form, description: sowEditText }, savedTenderId)
                  setSowContent(updatedSow)
                  if (savedTenderId) updateTender(savedTenderId, { sowDocument: updatedSow })
                  setSowEditing(false)
                }}>
                  <RefreshCw size={12} /> Regenerate SOW
                </Button>
              </div>
            </Card>
          )}

          {/* Contract Summary Strip */}
          <Card branded className="p-4">
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { label: 'Tender', value: savedTenderId, icon: Target },
                { label: 'Budget', value: form.budget, icon: DollarSign },
                { label: 'Mode', value: form.contractMode, icon: Briefcase },
                { label: 'Deadline', value: form.deadline, icon: Calendar },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.06)' }}>
                    <item.icon size={13} style={{ color: '#0089cf' }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{item.label}</p>
                    <p className="text-xs font-semibold" style={{ color: '#1b4c6f' }}>{item.value || '—'}</p>
                  </div>
                </div>
              ))}
              {form.contractRisk && (
                <div className="ml-auto">
                  <span className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{
                    background: riskBadgeStyle(form.contractRisk).bg,
                    color: riskBadgeStyle(form.contractRisk).color,
                    border: riskBadgeStyle(form.contractRisk).border
                  }}>
                    Risk: {form.contractRisk}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={backToForm} className="flex items-center gap-2">
              <Edit3 size={14} /> Back to Contract Initiating Form
            </Button>
            <Button variant="brand" onClick={handleProceedToTemplates} className="flex items-center gap-2 py-3 px-6 text-[15px]">
              Proceed to Templates <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
