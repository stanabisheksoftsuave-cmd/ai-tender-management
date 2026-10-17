import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot, CheckCircle2, ChevronRight, Download, Edit2, Edit3, FileText, Loader2, RotateCcw, Save, Wand2, XCircle,
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useTenders } from '../../context/TenderContext'
import { useBackHandler } from '../../context/NavigationContext'
import { applyAiInstruction } from '../../utils/aiTextEdit'
import { downloadSowDocx } from '../../utils/sowDocx'
import SowSectionBody from './SowSectionBody'
import AiSelectionEditModal from './AiSelectionEditModal'
import CifConfirmDialog from './CifConfirmDialog'
import DuplicateWarningAlert from './DuplicateWarningAlert'
import {
  AI_QUICK_PROMPTS,
  SOW_LIMIT_REACHED_MESSAGE,
  SOW_SECTION_BODY_MAX_LENGTH,
} from './cifConstants'
import { formatSowGeneratedDate, normalizeSowDocument } from './cifUtils'

const OUTLINE_BUTTON = 'flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-[rgba(0,137,207,0.06)] disabled:opacity-50 disabled:cursor-not-allowed'
const OUTLINE_STYLE = { color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)', background: 'transparent' }
const AI_EDIT_DELAY_MS = 700
const HIGHLIGHT_MS = 2600

/**
 * `/contract-strategy/:tenderId/sow` — the generated Statement of Work (MAIN
 * SowDocumentPage + GeneratedSowView + use-sow-document-editor). Reads the
 * document off the tender, so it survives a refresh and re-opening a draft.
 * Supports select-to-edit with AI (per-section one-step undo), whole-document
 * manual editing ("Edit Scope"), .docx download and the hand-off to Strategy
 * Templates.
 */
export default function SowDocumentPage({ tenderId, initialDuplicateWarning = null }) {
  const navigate = useNavigate()
  const { tenders, updateTender } = useTenders()
  const tender = tenders.find(t => t.id === tenderId) || null
  const sow = useMemo(() => normalizeSowDocument(tender?.sowDocument), [tender?.sowDocument])

  const [duplicateWarning, setDuplicateWarning] = useState(initialDuplicateWarning)
  const [notice, setNotice] = useState(null) // { tone: 'success' | 'danger', message }
  const [selection, setSelection] = useState(null) // { sectionId, start, end, text, x, y }
  const [aiEdit, setAiEdit] = useState(null)       // { sectionId, start, end, text }
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiApplying, setAiApplying] = useState(false)
  const [lastEdit, setLastEdit] = useState(null)   // { sectionId, previous }
  const [highlightedSectionId, setHighlightedSectionId] = useState(null)
  const [isManualEditMode, setIsManualEditMode] = useState(false)
  const [editedSections, setEditedSections] = useState({})
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const docRef = useRef(null)
  const aiTimerRef = useRef(null)

  // Nothing to show: unknown tender → picker; no SOW yet → its form.
  const redirectTo = !tender ? '/contract-strategy' : !sow ? `/contract-strategy/${tenderId}` : null
  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true })
  }, [redirectTo, navigate])

  useEffect(() => () => clearTimeout(aiTimerRef.current), [])

  useEffect(() => {
    if (!highlightedSectionId) return undefined
    const timer = setTimeout(() => setHighlightedSectionId(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [highlightedSectionId])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const saveSections = (sections) => {
    updateTender(tenderId, { sowDocument: { ...sow, sections } })
  }

  // ── Selection → floating toolbar (MAIN handleDocumentMouseUp) ──
  const handleDocumentSelect = useCallback(() => {
    if (!sow) return
    const domSelection = window.getSelection()
    if (!domSelection || domSelection.isCollapsed || !domSelection.rangeCount) { setSelection(null); return }
    if (!domSelection.toString().trim()) { setSelection(null); return }
    const range = domSelection.getRangeAt(0)
    const boundaryNode = (container, offset, isEnd) => {
      if (!(container instanceof Element) || container.childNodes.length === 0) return container
      const index = isEnd ? Math.max(0, offset - 1) : Math.min(offset, container.childNodes.length - 1)
      return container.childNodes[index] ?? container
    }
    const lineElFor = node => (node instanceof Element ? node : node.parentElement)?.closest('[data-line-start]') ?? null
    const startLineEl = lineElFor(boundaryNode(range.startContainer, range.startOffset, false))
    const endLineEl = lineElFor(boundaryNode(range.endContainer, range.endOffset, true))
    if (!startLineEl || !endLineEl || !docRef.current?.contains(startLineEl) || !docRef.current.contains(endLineEl)) {
      setSelection(null)
      return
    }
    const sectionId = startLineEl.getAttribute('data-section-id')
    const startLineStart = Number(startLineEl.getAttribute('data-line-start'))
    const endLineStart = Number(endLineEl.getAttribute('data-line-start'))
    if (!sectionId || sectionId !== endLineEl.getAttribute('data-section-id')
      || Number.isNaN(startLineStart) || Number.isNaN(endLineStart)) {
      setSelection(null)
      return
    }
    const offsetInLine = (lineEl, container, offset) => {
      const pre = document.createRange()
      pre.selectNodeContents(lineEl)
      pre.setEnd(container, offset)
      return Math.min(pre.toString().length, (lineEl.textContent ?? '').length)
    }
    const start = startLineStart + offsetInLine(startLineEl, range.startContainer, range.startOffset)
    const end = endLineStart + offsetInLine(endLineEl, range.endContainer, range.endOffset)
    if (end <= start) { setSelection(null); return }
    const body = sow.sections.find(s => s.id === sectionId)?.content ?? ''
    const text = body.slice(start, end)
    if (!text.trim()) { setSelection(null); return }
    const rect = range.getBoundingClientRect()
    setSelection({ sectionId, start, end, text, x: rect.left + rect.width / 2, y: rect.top })
  }, [sow])

  // Keyboard selection (caret browsing / Enter on a line) reaches this too.
  useEffect(() => {
    document.addEventListener('keyup', handleDocumentSelect)
    return () => document.removeEventListener('keyup', handleDocumentSelect)
  }, [handleDocumentSelect])

  // The toolbar's coordinates go stale on scroll, and it must vanish once the
  // selection is cleared or moves outside the document.
  useEffect(() => {
    const hide = () => setSelection(null)
    const hideIfCleared = () => {
      const s = window.getSelection()
      if (!s || s.isCollapsed || !s.anchorNode || !s.focusNode
        || !docRef.current?.contains(s.anchorNode) || !docRef.current.contains(s.focusNode)) {
        setSelection(null)
      }
    }
    window.addEventListener('scroll', hide, true)
    document.addEventListener('selectionchange', hideIfCleared)
    return () => {
      window.removeEventListener('scroll', hide, true)
      document.removeEventListener('selectionchange', hideIfCleared)
    }
  }, [])

  const openAiEditor = () => {
    if (!selection) return
    const { sectionId, start, end, text } = selection
    setAiEdit({ sectionId, start, end, text })
    setAiInstruction('')
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const closeAiEditor = useCallback(() => {
    setAiEdit(null)
    setAiInstruction('')
  }, [])

  const applyAiEdit = () => {
    if (!aiEdit || !sow || aiApplying) return
    const instruction = aiInstruction.trim()
    if (!instruction) return
    setAiApplying(true)
    const target = aiEdit
    aiTimerRef.current = setTimeout(() => {
      setAiApplying(false)
      const section = sow.sections.find(s => s.id === target.sectionId)
      if (!section || section.content.slice(target.start, target.end) !== target.text) {
        closeAiEditor()
        setNotice({ tone: 'danger', message: 'This section changed since you selected it - please reselect your text and try again.' })
        return
      }
      const rewritten = applyAiInstruction(target.text, instruction)
      const next = (section.content.slice(0, target.start) + rewritten + section.content.slice(target.end))
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+\n/g, '\n')
      saveSections(sow.sections.map(s => (s.id === section.id ? { ...s, content: next } : s)))
      setLastEdit({ sectionId: section.id, previous: section.content })
      setHighlightedSectionId(section.id)
      closeAiEditor()
    }, AI_EDIT_DELAY_MS)
  }

  const handleUndoLastEdit = () => {
    if (!lastEdit || !sow) return
    saveSections(sow.sections.map(s => (s.id === lastEdit.sectionId ? { ...s, content: lastEdit.previous } : s)))
    setHighlightedSectionId(lastEdit.sectionId)
    setLastEdit(null)
  }

  // ── Manual edit ("Edit Scope") ──
  const hasUnsavedEdits = Boolean(sow) && sow.sections.some(s => (editedSections[s.id] ?? s.content) !== s.content)

  const handleStartManualEdit = () => {
    setSelection(null)
    setEditedSections(Object.fromEntries(sow.sections.map(s => [s.id, s.content])))
    setIsManualEditMode(true)
  }

  const discardManualEdits = () => {
    setIsDiscardConfirmOpen(false)
    setIsManualEditMode(false)
    setEditedSections({})
  }

  const handleCancelManualEdit = () => {
    if (hasUnsavedEdits) { setIsDiscardConfirmOpen(true); return }
    discardManualEdits()
  }

  const handleSaveManualEdits = () => {
    const updated = sow.sections.map(s => ({ ...s, content: editedSections[s.id] ?? s.content }))
    const changed = updated.filter((s, i) => s.content !== sow.sections[i].content)
    if (changed.length === 0) { discardManualEdits(); return }
    if (changed.some(s => s.content.length > SOW_SECTION_BODY_MAX_LENGTH)) {
      setNotice({ tone: 'danger', message: SOW_LIMIT_REACHED_MESSAGE })
      return
    }
    saveSections(updated)
    // The undo snapshot predates the manual change — it would now discard it.
    if (lastEdit && changed.some(s => s.id === lastEdit.sectionId)) setLastEdit(null)
    setIsManualEditMode(false)
    setEditedSections({})
    setNotice({ tone: 'success', message: 'Scope changes saved.' })
  }

  useBackHandler(() => {
    if (!isManualEditMode) return false
    handleCancelManualEdit()
    return true
  })

  const displayReference = String(tender?.costCode ?? '').trim() || 'New Draft'
  const budgetDisplay = tender?.budget || ''
  const generatedOn = formatSowGeneratedDate(sow)

  const handleDownload = async () => {
    if (!sow || isDownloading) return
    setIsDownloading(true)
    try {
      await downloadSowDocx(sow, { title: tender.title, reference: displayReference, budget: budgetDisplay, generatedOn })
    } catch {
      setNotice({ tone: 'danger', message: 'Could not download the Statement of Work.' })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleProceedToTemplates = () => {
    const progress = tender.cifProgressStage
    updateTender(tenderId, {
      ...(!progress || progress === 'cif_creation' ? { cifProgressStage: 'select_templates' } : {}),
      // Only a tender still at cif_draft is promoted; one further along keeps its status.
      ...(tender.status === 'cif_draft' ? { status: 'prequal_stage1', stage: 'Pre-Qualification — Bidder Matching' } : {}),
    })
    navigate(`/strategy-templates/${tenderId}?new=true`)
  }

  if (redirectTo) return null

  return (
    <div className="w-full">
      <DuplicateWarningAlert warning={duplicateWarning} onDismiss={() => setDuplicateWarning(null)} className="mb-5" />

      {/* Header card */}
      <Card className="mb-6 flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm olng-slide-up">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(0,137,207,0.1)', color: '#0089cf' }}>
            <FileText size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold" style={{ color: '#1e293b' }}>Statement of Work - Generated</h2>
            <p className="text-xs text-slate-400 mt-0.5 break-words">{displayReference} • Generated {generatedOn}</p>
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <Bot size={14} aria-hidden="true" /> AI Generated
        </span>
      </Card>

      {notice && (
        <div
          role={notice.tone === 'danger' ? 'alert' : 'status'}
          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium"
          style={notice.tone === 'danger'
            ? { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', color: '#b91c1c' }
            : { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#047857' }}
        >
          {notice.tone === 'danger' ? <XCircle size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
          {notice.message}
        </div>
      )}

      {/* Document card */}
      <Card className="p-0 overflow-hidden" style={{ border: '1px solid rgba(0,137,207,0.2)', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <div style={{ height: 4, background: '#0089cf' }} />
        <div ref={docRef} onMouseUp={handleDocumentSelect} className="p-4 sm:p-8 text-sm" style={{ color: '#334155' }}>
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-1 break-words" style={{ color: '#0089cf' }}>
              Statement of Work - {tender.title}
            </h2>
            <p className="text-sm text-slate-400 break-words">Cost Code: {displayReference} • {budgetDisplay}</p>

            <div className="flex justify-between items-center mt-6 gap-4 flex-wrap">
              {!isManualEditMode ? (
                <>
                  <div
                    className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded"
                    style={{ color: '#0089cf', background: 'rgba(0,137,207,0.08)', border: '1px solid rgba(0,137,207,0.2)' }}
                  >
                    <Wand2 size={14} className="mr-1 shrink-0" aria-hidden="true" />
                    Select any text, or tab to a line and press Enter, to edit it with AI
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={handleStartManualEdit} className={OUTLINE_BUTTON} style={OUTLINE_STYLE}>
                      <Edit2 size={12} aria-hidden="true" /> Edit Scope
                    </button>
                    {lastEdit && (
                      <button type="button" onClick={handleUndoLastEdit} className={OUTLINE_BUTTON} style={OUTLINE_STYLE}>
                        <RotateCcw size={12} aria-hidden="true" /> Undo AI Edit
                      </button>
                    )}
                    <button type="button" onClick={handleDownload} disabled={isDownloading} className={OUTLINE_BUTTON} style={OUTLINE_STYLE}>
                      {isDownloading
                        ? <><Loader2 size={12} className="animate-spin" aria-hidden="true" /> Downloading…</>
                        : <><Download size={12} aria-hidden="true" /> Download SOW</>}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded"
                    style={{ color: '#b45309', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
                  >
                    <Wand2 size={14} className="mr-1 shrink-0" aria-hidden="true" />
                    Edit the document text directly below - these edits are not yet saved to the server, and will be lost if you leave this page
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" size="sm" onClick={handleCancelManualEdit} className="text-[11px] py-1.5 px-3">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveManualEdits}
                      className="text-[11px] py-1.5 px-3 flex items-center gap-1.5"
                      style={{ background: '#0089cf', color: '#fff' }}
                    >
                      <Save size={12} aria-hidden="true" /> Save Changes
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-8 text-sm mt-8">
            {sow.sections.map(section => (
              <div key={section.id}>
                {isManualEditMode ? (
                  <div className="mb-4">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3" style={{ color: '#1e293b' }}>
                      <span className="w-1.5 h-6 shrink-0 rounded-full" style={{ background: 'linear-gradient(180deg, #0089cf, #1b4c6f)' }} aria-hidden="true" />
                      {section.heading}
                    </h3>
                    {(() => {
                      const value = editedSections[section.id] ?? section.content
                      const atLimit = value.length >= SOW_SECTION_BODY_MAX_LENGTH
                      return (
                        <>
                          <textarea
                            aria-label={section.heading}
                            value={value}
                            maxLength={SOW_SECTION_BODY_MAX_LENGTH}
                            rows={Math.min(24, Math.max(4, value.split('\n').length + 1))}
                            onChange={e => setEditedSections(prev => ({ ...prev, [section.id]: e.target.value }))}
                            className={`w-full min-h-24 max-h-[70vh] px-3 py-2.5 text-sm leading-relaxed resize-y overflow-y-auto focus:outline-none transition-all olng-input ${atLimit ? 'olng-input--error' : ''}`}
                          />
                          {atLimit && (
                            <p className="text-[11px] text-red-500 mt-1.5">{SOW_LIMIT_REACHED_MESSAGE}</p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <SowSectionBody
                    section={section}
                    highlighted={section.id === highlightedSectionId}
                    onLineActivate={handleDocumentSelect}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <AiSelectionEditModal
        toolbarPosition={selection && !isManualEditMode ? { x: selection.x, y: selection.y } : null}
        onOpenEditor={openAiEditor}
        isEditorOpen={aiEdit !== null}
        selectedText={aiEdit?.text ?? ''}
        instruction={aiInstruction}
        onInstructionChange={setAiInstruction}
        onApply={applyAiEdit}
        onClose={closeAiEditor}
        isApplying={aiApplying}
        quickPrompts={AI_QUICK_PROMPTS}
        focusToolbarOnAppear
      />

      {/* Footer */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/contract-strategy/${tenderId}`)}
          className="w-full sm:w-auto justify-center flex items-center gap-2"
        >
          <Edit3 size={14} aria-hidden="true" /> Back to Contract Initiating Form
        </Button>
        <Button
          type="button"
          variant="brand"
          onClick={handleProceedToTemplates}
          className="w-full sm:w-auto justify-center flex items-center gap-2 py-3 px-6 text-[15px]"
        >
          Proceed to Templates <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>

      <CifConfirmDialog
        isOpen={isDiscardConfirmOpen}
        title="Discard unsaved changes?"
        description="Your edits to the Statement of Work have not been saved and will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        danger
        onConfirm={discardManualEdits}
        onClose={() => setIsDiscardConfirmOpen(false)}
      />
    </div>
  )
}
