import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Target, Building2, ShieldOff, ArrowLeft, ArrowRight, FileText, AlertCircle,
  DollarSign, Calendar, Clock, Hash, Briefcase, ShieldAlert,
  UploadCloud, X, Paperclip, Sparkles, RefreshCw,
  Download, Edit3, ChevronRight, Wand2, Undo2, Plus, Bot, Check
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import AiAnalysisLoader from '../components/ui/AiAnalysisLoader'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler, useDismissable } from '../context/NavigationContext'
import { applyAiInstruction } from '../utils/aiTextEdit'
import { tenderRef } from '../utils/tenderRef'

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
    reference: form.costCode || tenderId || 'TBD',
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

/* ─────────── Full-document inline editing (Edit Scope) ───────────
   Every section — free text, the Contract Details grid, or the
   Responsibilities subsections — becomes one plain-text textarea while
   editing, mirroring tender-management-frontend's SowViewer (every SOW
   section there is uniformly a text block). `editTextToSection` is the
   inverse of `sectionToEditText`, re-deriving the section's real shape from
   the edited text on Save. */

function sectionToEditText(section) {
  if (section.content !== undefined) return section.content
  if (section.items) {
    return section.items.map(item => `${item.label}: ${item.value}`).join('\n')
  }
  if (section.subsections) {
    return section.subsections
      .map(sub => `${sub.title}:\n` + sub.items.map(item => `• ${item}`).join('\n'))
      .join('\n\n')
  }
  return ''
}

function editTextToSection(section, text) {
  if (section.content !== undefined) return { ...section, content: text }
  if (section.items) {
    const items = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const sep = line.indexOf(':')
        return sep === -1
          ? { label: line, value: '' }
          : { label: line.slice(0, sep).trim(), value: line.slice(sep + 1).trim() }
      })
    return { ...section, items: items.length ? items : section.items }
  }
  if (section.subsections) {
    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    const subsections = blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      const [first, ...rest] = lines
      return {
        title: (first || '').replace(/:\s*$/, ''),
        items: rest.map(l => l.replace(/^[•-]\s*/, '')),
      }
    })
    return { ...section, subsections: subsections.length ? subsections : section.subsections }
  }
  return section
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

  // Tenders that already generated a SOW from this form but haven't yet
  // proceeded to Strategy Templates — the "resume a draft" picker's data
  // source. A brand-new tender only reaches `cif_draft` at that point (see
  // `handleGenerate`); nothing is persisted before then.
  const cifDraftTenders = useMemo(
    () => tenders.filter(t => t.status === 'cif_draft'),
    [tenders]
  )
  // "Start New" (from a non-empty picker) sets this to skip straight to the
  // blank form without navigating — mirrors ITTCreation.jsx's own picker.
  const [skipDraftPicker, setSkipDraftPicker] = useState(false)
  // Auto-skips the picker when there is nothing to resume, same as the
  // reference app's own Contract Initiating Form entry screen.
  const showDraftPicker = !tenderId && !skipDraftPicker && cifDraftTenders.length > 0

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
  // Whole-document inline edit mode ("Edit Scope") — every section becomes a
  // textarea (see sectionToEditText/editTextToSection), keyed by section index
  // since sections have no stable id of their own.
  const [sowEditing, setSowEditing] = useState(false)
  const [draftTexts, setDraftTexts] = useState({})

  // Select-to-edit-with-AI: `selection` is the just-detected text (shows the
  // floating "Edit with AI" button); confirming it moves the same shape into
  // `aiEdit`, which opens the modal. Two steps, matching
  // tender-management-frontend's SowViewer rather than popping a panel
  // straight off the selection.
  const sowBodyRef = useRef(null)
  const [selection, setSelection] = useState(null) // { path, start, end, text, x, y }
  const [aiEdit, setAiEdit] = useState(null)        // same shape, confirmed target
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [sowUndo, setSowUndo] = useState(null) // previous sowContent, for one-step revert

  const closeAiEditor = useCallback(() => {
    setAiEdit(null)
    setAiPrompt('')
  }, [setAiEdit, setAiPrompt])

  useEffect(() => {
    if (!aiEdit) return
    const onKey = e => { if (e.key === 'Escape' && !aiBusy) closeAiEditor() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiEdit, aiBusy, closeAiEditor])

  // Dismissible via the app's shared Back button, like any other overlay.
  useDismissable(!!aiEdit, closeAiEditor)

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

  // Auto-tick generation tasks. Hoisted above every early return (the role
  // check, and the picker below) — `showDraftPicker` can flip mid-mount when
  // "Start New" is clicked, and a hook declared after a return that can
  // toggle like that violates the rules of hooks for real, not just as a
  // lint nitpick.
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

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">{t('access.restricted')}</p>
      <p className="text-xs">Only Contract Holders can access this page.</p>
    </div>
  )

  const backToDrafts = () => {
    if (tenderId) navigate('/contract-strategy')
    else setSkipDraftPicker(false)
  }

  // ══════════════ RESUME-A-DRAFT PICKER ══════════════
  // Bare /contract-strategy with at least one cif_draft tender to resume —
  // matches tender-management-frontend's Contract Initiating Form picker.
  if (showDraftPicker) return (
    <div className="space-y-5 w-full">
      <Card branded className="p-5 olng-slide-up">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
            <FileText size={16} style={{ color: '#0089cf' }} />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: '#1e293b' }}>Contract Initiating Form</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Resume a draft you already started, or begin a new Contract Initiating Form.
        </p>
      </Card>

      <div className="space-y-3 olng-slide-up" style={{ animationDelay: '60ms' }}>
        {cifDraftTenders.map(dt => (
          <Card
            key={dt.id}
            branded
            hover
            className="p-4"
            onClick={() => navigate(`/contract-strategy/${dt.id}`)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                  <Briefcase size={16} style={{ color: '#0089cf' }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}>{dt.id}</span>
                    <Badge variant="draft">Draft</Badge>
                  </div>
                  <p className="text-sm font-semibold mt-1 truncate" style={{ color: '#1e293b' }}>{dt.title || 'Untitled Contract Initiating Form'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {dt.department || 'No department set'}{dt.budget ? ` · ${dt.budget}` : ''}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={() => setSkipDraftPicker(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all olng-slide-up"
        style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)', animationDelay: '90ms' }}
      >
        <Plus size={16} /> Start New Contract Initiating Form
      </button>
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
        // Resumable via the picker until "Proceed to Templates" promotes it —
        // Generate SOW no longer advances the tender past the CIF stage.
        status: 'cif_draft',
        stage: 'Contract Initiating Form',
        created: new Date().toISOString().split('T')[0],
        bidders: 0,
        bidderList: [],
        aiScore: null,
      })
      id = newId
      // Move the URL onto this tender's id right away. Without this, the
      // page is still on the bare /contract-strategy route — and the moment
      // this new cif_draft tender lands in context, showDraftPicker's own
      // `cifDraftTenders.length > 0` flips true and its early return would
      // hijack the very next render away from the AI-generation step,
      // bouncing back to the picker mid-flow instead of showing progress.
      // Same route, same component (no `key`, see App.jsx's CreateIttRoute
      // comment for the equivalent ITT case) — this does not remount and
      // does not lose `step`/`form`/etc.
      navigate(`/contract-strategy/${newId}`, { replace: true })
    }

    setSavedTenderId(id)
    setGenStep(0)
    setStep(1) // Start AI generation
  }

  /** Capture a text selection inside the SOW preview and anchor the prompt popup to it */
  /** Detects a text selection inside the SOW preview — either a read-only
   * `[data-sow-path]` node, or (while editing) inside a section's textarea —
   * and stores it as the *pending* selection. Confirming it via the floating
   * "Edit with AI" button is a separate step (`openAiEditor`). */
  const handleSowSelect = (e) => {
    if (sowEditing) {
      const target = e.target
      if (target.tagName !== 'TEXTAREA' || target.dataset.sectionIndex === undefined) {
        setSelection(null)
        return
      }
      const start = target.selectionStart
      const end = target.selectionEnd
      if (start === end) { setSelection(null); return }
      const text = target.value.slice(start, end).trim()
      if (!text) { setSelection(null); return }
      setSelection({
        path: `draft:${target.dataset.sectionIndex}`,
        start, end, text,
        x: e.clientX,
        y: e.clientY - 8,
      })
      return
    }

    const domSelection = window.getSelection()
    if (!domSelection || domSelection.isCollapsed || !domSelection.rangeCount) {
      setSelection(null)
      return
    }
    const range = domSelection.getRangeAt(0)
    const startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer
    const host = startEl?.closest?.('[data-sow-path]')
    if (!host || !sowBodyRef.current?.contains(host)) { setSelection(null); return }

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
    if (!text.trim()) { setSelection(null); return }

    const rect = range.getBoundingClientRect()
    setSelection({
      path: host.dataset.sowPath,
      start, end, text,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  /** Confirms the pending selection (from the floating button) and opens the
   * "Edit with AI" modal for it. */
  const openAiEditor = () => {
    if (!selection) return
    setAiEdit(selection)
    setAiPrompt('')
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  /** Run the instruction against the selected text and splice the result back
   * in — into `draftTexts` while editing, into `sowContent` otherwise. */
  const handleApplyAiEdit = () => {
    if (!aiEdit || !aiPrompt.trim() || aiBusy) return
    setAiBusy(true)
    setTimeout(() => {
      const rewritten = applyAiInstruction(aiEdit.text, aiPrompt)

      if (aiEdit.path.startsWith('draft:')) {
        const si = aiEdit.path.slice('draft:'.length)
        setDraftTexts(prev => {
          const original = prev[si] || ''
          let next = original.slice(0, aiEdit.start) + rewritten + original.slice(aiEdit.end)
          next = next.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n')
          return { ...prev, [si]: next }
        })
      } else {
        const original = readSowPath(sowContent, aiEdit.path)
        let next = original.slice(0, aiEdit.start) + rewritten + original.slice(aiEdit.end)
        next = next.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n')

        const updatedSow = writeSowPath(sowContent, aiEdit.path, next)
        setSowUndo(sowContent)
        setSowContent(updatedSow)
        if (savedTenderId) updateTender(savedTenderId, { sowDocument: updatedSow })
        // Keep the page description in sync when the Objective section is edited
        if (aiEdit.path === 'content:1') {
          setField('description', next)
          if (savedTenderId) updateTender(savedTenderId, { description: next })
        }
      }

      window.getSelection()?.removeAllRanges()
      setAiBusy(false)
      setAiEdit(null)
      setAiPrompt('')
    }, 700)
  }

  const handleUndoAiEdit = () => {
    if (!sowUndo) return
    setSowContent(sowUndo)
    if (savedTenderId) updateTender(savedTenderId, { sowDocument: sowUndo })
    setSowUndo(null)
  }

  /** Enters whole-document edit mode — every section becomes a textarea. */
  const handleEditScopeClick = () => {
    const initial = {}
    sowContent.sections.forEach((section, si) => {
      initial[si] = sectionToEditText(section)
    })
    setDraftTexts(initial)
    setSowEditing(true)
  }

  const handleCancelSowEdit = () => {
    setSowEditing(false)
    setDraftTexts({})
  }

  const handleSaveSowEdit = () => {
    const updatedSections = sowContent.sections.map((section, si) => {
      const text = draftTexts[si]
      return text === undefined ? section : editTextToSection(section, text)
    })
    const updatedSow = { ...sowContent, sections: updatedSections }
    setSowContent(updatedSow)
    if (savedTenderId) updateTender(savedTenderId, { sowDocument: updatedSow })

    // Section 1 ("Objective") mirrors the page's own Scope Overview field,
    // same as an AI edit to it already did.
    const objectiveText = draftTexts[1]
    if (objectiveText !== undefined) {
      setField('description', objectiveText)
      if (savedTenderId) updateTender(savedTenderId, { description: objectiveText })
    }

    setSowEditing(false)
    setDraftTexts({})
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
    // Only promote a tender still sitting at cif_draft — one already further
    // along (opened here again via the sidebar's cross-nav picker) keeps its
    // real pipeline status untouched.
    const current = savedTenderId ? tenders.find(t => t.id === savedTenderId) : null
    if (current?.status === 'cif_draft') {
      updateTender(savedTenderId, {
        status: 'prequal_stage1',
        stage: 'Pre-Qualification — Bidder Matching',
      })
    }
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
          {/* Back to drafts — only when there's a picker to return to */}
          {cifDraftTenders.length > 0 && (
            <button
              onClick={backToDrafts}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all olng-slide-up"
              style={{ color: '#64748b', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <ArrowLeft size={13} /> Back to drafts
            </button>
          )}

          {/* Header Card */}
          <Card branded className="p-5 olng-slide-up">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                <Target size={16} style={{ color: '#0089cf' }} />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                {existingTender ? `Contract Strategy — ${tenderRef(existingTender)}` : 'New Contract Strategy'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Define the contract details for this tender. AI will generate a Statement of Work document
              from your inputs before proceeding to Pre-Qualification.
            </p>
          </Card>

          {/* CONTRACT DETAILS FORM */}
          <Card branded className="p-6 space-y-5 olng-slide-up" style={{ animationDelay: '60ms' }}>
            <h3 className="font-semibold flex items-center gap-2.5" style={{ color: '#1e293b', fontSize: '15px' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                <FileText size={16} style={{ color: '#0089cf' }} />
              </div>
              Contract Initiating Form
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Contract / Project Title — full width */}
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
                  {t('itt.fieldTitle')}
                  <span className="font-secondary" style={{ color: '#0089cf' }}>*</span>
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
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
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
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
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
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
                  <DollarSign size={12} style={{ color: '#0089cf' }} />
                  {t('itt.fieldBudget')}
                  <span className="font-secondary" style={{ color: '#0089cf' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.currency}
                    onChange={e => handleCurrencyChange(e.target.value)}
                    className="w-28 px-2 py-2.5 text-sm focus:outline-none transition-all olng-input bg-white font-semibold"
                    style={{ color: '#1e293b' }}
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
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
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
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
                  <Calendar size={12} style={{ color: '#0089cf' }} />
                  {t('itt.fieldDeadline')}
                  <span className="font-secondary" style={{ color: '#0089cf' }}>*</span>
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
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
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
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1e293b' }}>
                  {t('strategy.fieldScopeOverview')}
                  <span className="font-secondary" style={{ color: '#0089cf' }}>*</span>
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
        <div className="flex items-center justify-center py-10">
          <AiAnalysisLoader
            className="max-w-md"
            title="AI is Generating Your SOW"
            description="Building the Statement of Work document from your contract details and compliance standards"
            progress={(genStep / SOW_GEN_TASKS.length) * 100}
            steps={SOW_GEN_TASKS.map((task, i) => ({
              id: task,
              label: task,
              status: i < genStep ? 'complete' : i === genStep ? 'active' : 'pending',
            }))}
          />
        </div>
      )}

      {/* ══════════════ STEP 2: SOW REVIEW ══════════════ */}
      {step === 2 && sowContent && (
        <div className="space-y-5 olng-slide-up">
          {/* SOW Header — bordered card, matches tender-management-frontend */}
          <div
            className="flex items-center justify-between"
            style={{ background: '#fff', border: '1px solid #cce6f8', borderRadius: 8, padding: 16 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(0,137,207,0.1)', color: '#0089cf' }}>
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-bold" style={{ color: '#1e293b' }}>Statement of Work — Generated</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {sowContent.reference} · Generated {sowContent.generatedDate}
                </p>
              </div>
            </div>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <Bot size={14} /> AI Generated
            </span>
          </div>

          {/* SOW Document Card — flat top accent border, no gradient title bar */}
          <Card
            className="p-0 overflow-hidden"
            style={{ border: '1px solid rgba(0,137,207,0.2)', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}
          >
            <div style={{ height: 4, background: '#0089cf' }} />

            <div
              ref={sowBodyRef}
              onMouseUp={handleSowSelect}
              className="relative px-8 py-8 text-sm leading-relaxed"
              style={{ color: '#334155' }}
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-1" style={{ color: '#0089cf' }}>{sowContent.title}</h2>
                <p className="text-sm text-slate-400">Reference: {sowContent.reference} · {form.budget}</p>

                <div className="flex justify-between items-center mt-6 gap-4 flex-wrap">
                  {!sowEditing ? (
                    <div
                      className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded"
                      style={{ color: '#0089cf', background: 'rgba(0,137,207,0.08)', border: '1px solid rgba(0,137,207,0.2)' }}
                    >
                      <Wand2 size={14} className="mr-1" /> Select any text in the document to edit it with AI
                    </div>
                  ) : <div />}
                  <div className="flex gap-3">
                    {sowEditing ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={handleCancelSowEdit} className="text-[11px] py-1.5 px-3">
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveSowEdit}
                          className="text-[11px] py-1.5 px-3 flex items-center gap-1.5"
                          style={{ background: '#0089cf', color: '#fff' }}
                        >
                          <Check size={12} /> Save Changes
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleEditScopeClick}
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)', background: 'transparent' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,137,207,0.06)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <Edit3 size={11} /> Edit Scope
                        </button>
                        {sowUndo && (
                          <button
                            onClick={handleUndoAiEdit}
                            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                            style={{ color: '#64748b', border: '1px solid rgba(100,116,139,0.2)', background: 'transparent' }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.06)' }}
                            onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <Undo2 size={11} /> Undo AI Edit
                          </button>
                        )}
                        <button
                          onClick={handleDownloadSow}
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)', background: 'transparent' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,137,207,0.06)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <Download size={11} /> Download SOW
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {sowContent.sections.map((section, si) => (
                  <div key={si}>
                    <h4 className="font-bold text-[13px] mb-2 flex items-center gap-2" style={{ color: '#1e293b' }}>
                      <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #0089cf, #1b4c6f)' }} />
                      {section.heading}
                    </h4>

                    {sowEditing ? (
                      <div className="pl-4">
                        <textarea
                          data-section-index={si}
                          rows={Math.max(3, Math.ceil((draftTexts[si] || '').length / 70))}
                          value={draftTexts[si] ?? ''}
                          onChange={e => setDraftTexts(prev => ({ ...prev, [si]: e.target.value }))}
                          className="w-full text-[12.5px] px-3 py-2.5 resize-y focus:outline-none transition-all olng-input"
                        />
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] font-medium text-slate-400">
                          <Wand2 size={11} /> Select any text to edit it with AI
                        </div>
                      </div>
                    ) : (
                      <>
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
                                <span data-sow-path={`item:${si}:${ii}`} className="text-[11px] font-semibold" style={{ color: item.color || '#1e293b' }}>
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
                                <p data-sow-path={`subtitle:${si}:${si2}`} className="text-[12px] font-semibold mb-1 olng-sow-editable" style={{ color: '#1e293b' }}>{sub.title}</p>
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
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Floating "Edit with AI" button on text selection ── */}
          {selection && (
            <div
              className="fixed z-40 flex flex-col items-center olng-scale-in"
              style={{ left: selection.x, top: selection.y - 6, transform: 'translate(-50%, -100%)' }}
            >
              <button
                onClick={openAiEditor}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors"
                style={{ background: '#0089cf' }}
              >
                <Wand2 size={13} /> Edit with AI
              </button>
              <div className="-mt-1 h-2 w-2 rotate-45" style={{ background: '#0089cf' }} />
            </div>
          )}

          {/* ── "Edit with AI" modal ── */}
          {aiEdit && createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => { if (!aiBusy) closeAiEditor() }}
            >
              <div className="w-full max-w-md olng-scale-in" onClick={e => e.stopPropagation()}>
                <Card branded className="p-0 overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,137,207,0.08), rgba(27,76,111,0.04))',
                      borderBottom: '1px solid rgba(0,137,207,0.12)',
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#0089cf' }}>
                      <Wand2 size={14} /> Edit with AI
                    </span>
                    {!aiBusy && (
                      <button onClick={closeAiEditor} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Selected text</p>
                      <blockquote
                        className="text-xs text-slate-500 italic line-clamp-3 pl-2.5 py-0.5"
                        style={{ borderLeft: '2px solid rgba(0,137,207,0.3)' }}
                      >
                        {aiEdit.text}
                      </blockquote>
                    </div>

                    <div>
                      <label htmlFor="sow-ai-instruction" className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Instruction
                      </label>
                      <textarea
                        id="sow-ai-instruction"
                        autoFocus
                        rows={3}
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleApplyAiEdit() }
                        }}
                        placeholder="Tell AI how to update this… e.g. “make it more formal”, “shorten this”, “replace 14 days with 21 days”"
                        className="w-full px-3 py-2 text-xs focus:outline-none resize-none transition-all olng-input"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
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
                  </div>

                  <div
                    className="flex justify-end gap-2 px-4 py-3"
                    style={{ borderTop: '1px solid rgba(0,137,207,0.1)', background: 'rgba(236,244,252,0.4)' }}
                  >
                    <Button variant="secondary" onClick={closeAiEditor} disabled={aiBusy} className="text-xs py-1.5 px-3">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApplyAiEdit}
                      disabled={!aiPrompt.trim() || aiBusy}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                      style={{ background: '#0089cf', color: '#fff' }}
                    >
                      {aiBusy
                        ? <><RefreshCw size={12} className="animate-spin" /> Applying…</>
                        : <><Wand2 size={12} /> Apply AI Edit</>}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>,
            document.body
          )}

          {/* Contract Summary Strip */}
          <Card branded className="p-4">
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { label: 'Tender', value: savedTenderId, icon: Target },
                { label: 'Budget', value: form.budget, icon: DollarSign },
                { label: 'Deadline', value: form.deadline, icon: Calendar },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.06)' }}>
                    <item.icon size={13} style={{ color: '#0089cf' }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{item.label}</p>
                    <p className="text-xs font-semibold" style={{ color: '#1e293b' }}>{item.value || '—'}</p>
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
