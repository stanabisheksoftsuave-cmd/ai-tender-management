import { useEffect, useRef, useState } from 'react'
import { Download, FileText, Maximize2, Minimize2, Pencil, RotateCcw, Save, Undo2, Wand2 } from 'lucide-react'
import Card from '../ui/Card'
import AiEditPopup from '../ui/AiEditPopup'
import AiEditableTextarea from '../ui/AiEditableTextarea'
import { applyAiInstruction } from '../../utils/aiTextEdit'
import { downloadSowDocx } from '../../utils/sowDocx'
import { EMPTY_VALUE_TEXT } from '../../utils/strategyTemplates'
import ConfirmDialog from './ConfirmDialog'
import {
  editTextToSection, editorRows, sectionContent, sectionHeading, sectionToEditText, withSectionContent,
} from './sowText'

const HEADER_BUTTON =
  'inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed'
const OUTLINE = `${HEADER_BUTTON} text-[#0089cf] border-[#0089cf]/20 bg-white hover:bg-[#e8f3fb]`

/** Each line of a section's text with its character offset in that text. */
function splitLines(content) {
  const lines = content.split('\n')
  const starts = lines.reduce((acc, line, index) => [...acc, index === 0 ? 0 : acc[index - 1] + lines[index - 1].length + 1], [])
  return lines.map((line, index) => ({ line, start: starts[index] }))
}

/** Character offset of (node, offset) inside a `[data-sow-line]` element. */
function lineOffset(node, offset) {
  const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node
  const line = element?.closest?.('[data-sow-line]')
  if (!line) return null
  return { si: Number(line.dataset.si), position: Number(line.dataset.start) + offset }
}

/**
 * Strategy Templates' Statement-of-Work card (MAIN RealSowCard): collapsible,
 * select-text → "Edit with AI" in place (mouse, or tab to a line and press
 * Enter), "Edit Scope" for direct per-section editing, Undo AI Edit and
 * Download SOW. Edits are written straight back to `tender.sowDocument`.
 */
export default function SowCard({ sow, title, reference, budget, onSave }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [isDiscardOpen, setIsDiscardOpen] = useState(false)
  const [selection, setSelection] = useState(null) // { si, start, end, text, x, y }
  const [aiEdit, setAiEdit] = useState(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [undoSow, setUndoSow] = useState(null)
  const [highlighted, setHighlighted] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const docRef = useRef(null)
  const applyTimer = useRef(null)

  useEffect(() => () => clearTimeout(applyTimer.current), [])

  const sections = sow?.sections || []
  const hasUnsavedEdits = isEditing && sections.some((s, si) => drafts[si] !== undefined && drafts[si] !== sectionToEditText(s))

  const toggleExpanded = () => {
    setSelection(null)
    setIsExpanded(prev => !prev)
  }

  const startEditing = () => {
    setIsExpanded(true)
    setSelection(null)
    setAiEdit(null)
    const initial = {}
    sections.forEach((s, si) => { initial[si] = sectionToEditText(s) })
    setDrafts(initial)
    setIsEditing(true)
  }

  const discardEdits = () => {
    setIsDiscardOpen(false)
    setIsEditing(false)
    setDrafts({})
  }

  const saveEdits = () => {
    const updated = { ...sow, sections: sections.map((s, si) => (drafts[si] === undefined ? s : editTextToSection(s, drafts[si]))) }
    onSave(updated)
    setIsEditing(false)
    setDrafts({})
  }

  const downloadSow = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      // Legacy SOWs (items / subsections) are flattened to the plain-text body
      // the .docx builder reads.
      const flat = { ...sow, sections: sections.map(s => ({ ...s, heading: sectionHeading(s), content: sectionToEditText(s) })) }
      await downloadSowDocx(flat, { title: title || '', reference: reference || '', budget: budget || '', generatedOn: sow?.generatedDate || '' })
    } finally {
      setIsDownloading(false)
    }
  }

  // Mouse selection inside one section's free text → floating "Edit with AI".
  const handleMouseUp = () => {
    if (isEditing || aiEdit) return
    const sel = window.getSelection()
    const text = sel?.toString() || ''
    if (!sel || sel.rangeCount === 0 || !text.trim()) { setSelection(null); return }
    const a = lineOffset(sel.anchorNode, sel.anchorOffset)
    const b = lineOffset(sel.focusNode, sel.focusOffset)
    if (!a || !b || a.si !== b.si || !docRef.current?.contains(sel.anchorNode)) { setSelection(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    const start = Math.min(a.position, b.position)
    const end = Math.max(a.position, b.position)
    const content = sectionContent(sections[a.si]) || ''
    setSelection({ si: a.si, start, end, text: content.slice(start, end), x: rect.left + rect.width / 2, y: rect.top })
  }

  // Keyboard: tab to a line, Enter/Space selects the whole line for AI editing.
  const handleLineKey = (event, si, start, line) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (!line.trim()) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    setSelection(null)
    setAiEdit({ si, start, end: start + line.length, text: line, x: rect.left + 24, y: rect.bottom })
    setAiPrompt('')
  }

  const openAiEditor = () => {
    if (!selection) return
    setAiEdit(selection)
    setAiPrompt('')
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const closeAiEditor = () => {
    setAiEdit(null)
    setAiPrompt('')
  }

  const applyAiEdit = () => {
    if (!aiEdit || !aiPrompt.trim() || aiBusy) return
    setAiBusy(true)
    const edit = aiEdit
    const instruction = aiPrompt
    applyTimer.current = setTimeout(() => {
      const section = sections[edit.si]
      const original = sectionContent(section) || ''
      const rewritten = applyAiInstruction(edit.text, instruction)
      const next = (original.slice(0, edit.start) + rewritten + original.slice(edit.end))
        .replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n')
      setUndoSow(sow)
      setHighlighted(edit.si)
      onSave({ ...sow, sections: sections.map((s, si) => (si === edit.si ? withSectionContent(s, next) : s)) })
      setAiBusy(false)
      setAiEdit(null)
      setAiPrompt('')
    }, 700)
  }

  const undoAiEdit = () => {
    if (!undoSow) return
    onSave(undoSow)
    setUndoSow(null)
    setHighlighted(null)
  }

  const popupStyle = aiEdit
    ? {
        position: 'fixed',
        top: Math.min(aiEdit.y + 12, (typeof window !== 'undefined' ? window.innerHeight : 800) - 320),
        left: Math.max(16, Math.min(aiEdit.x - 170, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 356)),
        zIndex: 120,
      }
    : undefined

  return (
    <Card className="p-4 sm:p-6 border border-slate-200 olng-slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f3fb] text-[#0089cf]">
            <FileText size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold break-words text-slate-800">
              Statement of Work - {String(title || '').trim() || EMPTY_VALUE_TEXT}
            </h3>
            <p className="mt-1 text-xs text-slate-400 break-all">
              Cost Code: {String(reference || '').trim() || EMPTY_VALUE_TEXT} - Generated
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <button type="button" className={`${HEADER_BUTTON} text-slate-500 border-slate-200 bg-white hover:bg-slate-50`}
                onClick={() => (hasUnsavedEdits ? setIsDiscardOpen(true) : discardEdits())}>
                Cancel
              </button>
              <button type="button" className={`${HEADER_BUTTON} text-white border-transparent bg-[#0089cf] hover:bg-[#1b4c6f]`} onClick={saveEdits}>
                <Save size={12} aria-hidden="true" /> Save Changes
              </button>
            </>
          ) : (
            <>
              <button type="button" className={OUTLINE} onClick={toggleExpanded}>
                {isExpanded ? <Minimize2 size={12} aria-hidden="true" /> : <Maximize2 size={12} aria-hidden="true" />}
                {isExpanded ? 'Collapse SOW' : 'Expand SOW'}
              </button>
              <button type="button" className={OUTLINE} onClick={startEditing} disabled={aiBusy}>
                <Pencil size={12} aria-hidden="true" /> Edit Scope
              </button>
              {undoSow && (
                <button type="button" className={OUTLINE} onClick={undoAiEdit}>
                  <RotateCcw size={12} aria-hidden="true" /> Undo AI Edit
                </button>
              )}
              <button type="button" className={OUTLINE} onClick={() => { void downloadSow() }} disabled={isDownloading}>
                <Download size={12} aria-hidden="true" /> Download SOW
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-slate-100 pt-5">
          {!isEditing && (
            <div className="mb-5 flex w-max max-w-full items-center gap-2 rounded-lg border border-[#0089cf]/20 bg-[#e8f3fb] px-3 py-2 text-xs font-medium text-[#0089cf]">
              <Wand2 size={14} className="shrink-0" aria-hidden="true" />
              Select any text to edit it with AI, or tab to a line and press Enter
            </div>
          )}
          <div ref={docRef} onMouseUp={handleMouseUp} className="space-y-6 text-sm max-h-[560px] overflow-y-auto pr-1">
            {sections.map((section, si) => {
              const content = sectionContent(section)
              return (
                <div key={si}>
                  <h4 className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-800">
                    <span className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-[#0089cf] to-[#1b4c6f]" aria-hidden="true" />
                    {sectionHeading(section)}
                  </h4>
                  {isEditing ? (
                    <AiEditableTextarea
                      value={drafts[si] ?? ''}
                      rows={editorRows(drafts[si])}
                      onChange={value => setDrafts(prev => ({ ...prev, [si]: value }))}
                      className="w-full px-3 py-2 text-[12.5px] leading-6 text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0089cf] resize-y"
                    />
                  ) : content !== null ? (
                    <div className={`pl-4 text-[12.5px] leading-6 text-slate-600 rounded-lg transition-colors ${highlighted === si ? 'bg-amber-50/70' : ''}`}>
                      {splitLines(content).map(({ line, start }, li) => {
                        return (
                          <span
                            key={li}
                            data-sow-line=""
                            data-si={si}
                            data-start={start}
                            tabIndex={line.trim() ? 0 : -1}
                            onKeyDown={event => handleLineKey(event, si, start, line)}
                            className="block min-h-[1.5rem] whitespace-pre-wrap rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/40"
                          >
                            {line}
                          </span>
                        )
                      })}
                    </div>
                  ) : section.items ? (
                    <div className="pl-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.items.map((item, ii) => (
                        <div key={ii} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-[rgba(236,244,252,0.5)] border border-[#0089cf]/10">
                          <span className="text-[11px] text-slate-400">{item.label}</span>
                          <span className="text-[11px] font-semibold text-slate-800 text-right break-words">{item.value || EMPTY_VALUE_TEXT}</span>
                        </div>
                      ))}
                    </div>
                  ) : section.subsections ? (
                    <div className="pl-4 space-y-3">
                      {section.subsections.map((sub, bi) => (
                        <div key={bi}>
                          <p className="text-[12px] font-semibold mb-1 text-slate-800">{sub.title}</p>
                          <ul className="space-y-1">
                            {(sub.items || []).map((item, ii) => (
                              <li key={ii} className="text-[12px] text-slate-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-[#0089cf]" aria-hidden="true" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating "Edit with AI" button over a mouse selection */}
      {isExpanded && selection && !aiEdit && (
        <button
          type="button"
          onMouseDown={event => event.preventDefault()}
          onClick={openAiEditor}
          className="fixed z-[115] -translate-x-1/2 -translate-y-full inline-flex items-center gap-1.5 rounded-full bg-[#0089cf] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg hover:bg-[#1b4c6f]"
          style={{ top: selection.y - 8, left: selection.x }}
        >
          <Wand2 size={12} aria-hidden="true" /> Edit with AI
        </button>
      )}

      {isExpanded && aiEdit && (
        <AiEditPopup
          selectedText={aiEdit.text}
          prompt={aiPrompt}
          onPromptChange={setAiPrompt}
          onApply={applyAiEdit}
          onCancel={closeAiEditor}
          busy={aiBusy}
          style={popupStyle}
        />
      )}

      <ConfirmDialog
        isOpen={isDiscardOpen}
        icon={Undo2}
        title="Discard unsaved changes?"
        description="Your edits to the Statement of Work have not been saved and will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        confirmVariant="danger"
        onConfirm={discardEdits}
        onClose={() => setIsDiscardOpen(false)}
      />
    </Card>
  )
}
