import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Wand2, X } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useDismissable } from '../../context/NavigationContext'

/**
 * "Select text → floating 'Edit with AI' toolbar → instruction modal" shell
 * (MAIN ui/AiSelectionEditModal). Owns only the UI; the caller supplies the
 * selected text, the instruction state and the apply/close handlers.
 */
export default function AiSelectionEditModal({
  toolbarPosition,
  onOpenEditor,
  isEditorOpen,
  selectedText,
  instruction,
  onInstructionChange,
  onApply,
  onClose,
  isApplying,
  quickPrompts,
  focusToolbarOnAppear = false,
}) {
  const toolbarButtonRef = useRef(null)
  const wasToolbarVisibleRef = useRef(false)
  const hasInstruction = instruction.trim() !== ''

  // Keyboard users who selected a line with Enter can only reach the toolbar
  // if focus moves to it.
  useEffect(() => {
    const isVisible = toolbarPosition !== null
    if (focusToolbarOnAppear && isVisible && !wasToolbarVisibleRef.current && !isEditorOpen) {
      toolbarButtonRef.current?.focus()
    }
    wasToolbarVisibleRef.current = isVisible
  }, [toolbarPosition, isEditorOpen, focusToolbarOnAppear])

  const requestClose = () => { if (!isApplying) onClose() }
  useDismissable(isEditorOpen, requestClose)

  useEffect(() => {
    if (!isEditorOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape' && !isApplying) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isEditorOpen, isApplying, onClose])

  return (
    <>
      {toolbarPosition && (
        <div
          className="fixed z-40 flex flex-col items-center olng-scale-in"
          style={{
            left: `clamp(4rem, ${toolbarPosition.x}px, calc(100vw - 4rem))`,
            top: toolbarPosition.y - 6,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            ref={toolbarButtonRef}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={onOpenEditor}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors"
            style={{ background: '#0089cf' }}
          >
            <Wand2 size={13} aria-hidden="true" /> Edit with AI
          </button>
          <div className="-mt-1 h-2 w-2 rotate-45" style={{ background: '#0089cf' }} aria-hidden="true" />
        </div>
      )}

      {isEditorOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={requestClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-edit-title"
            className="w-full max-w-md olng-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <Card className="p-0 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.08), rgba(27,76,111,0.04))', borderBottom: '1px solid rgba(0,137,207,0.12)' }}
              >
                <span id="ai-edit-title" className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#0089cf' }}>
                  <Wand2 size={14} aria-hidden="true" /> Edit with AI
                </span>
                {!isApplying && (
                  <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Selected text</p>
                  <blockquote
                    tabIndex={0}
                    className="max-h-32 overflow-y-auto rounded-r-lg px-3 py-2 text-sm italic text-slate-500 focus-visible:outline-none"
                    style={{ borderLeft: '2px solid #0089cf', background: 'rgba(236,244,252,0.5)' }}
                  >
                    {selectedText}
                  </blockquote>
                </div>
                <div>
                  <label htmlFor="ai-edit-instruction" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Instruction
                    <span className="font-secondary text-red-400" aria-hidden="true"> *</span>
                  </label>
                  <textarea
                    id="ai-edit-instruction"
                    autoFocus
                    required
                    rows={3}
                    value={instruction}
                    disabled={isApplying}
                    onChange={e => onInstructionChange(e.target.value.trimStart())}
                    placeholder="e.g. 'Make this requirement more specific' or 'Add penalty details'"
                    className="w-full px-3 py-2 text-sm focus:outline-none resize-none transition-all olng-input"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isApplying}
                      onClick={() => onInstructionChange(prompt)}
                      className="cursor-pointer rounded-full px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white"
                      style={{ color: '#0089cf', background: 'rgba(0,137,207,0.06)', border: '1px solid rgba(0,137,207,0.15)' }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid rgba(0,137,207,0.1)', background: 'rgba(236,244,252,0.4)' }}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={isApplying} className="text-xs py-1.5 px-3">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={onApply}
                  disabled={isApplying || !hasInstruction}
                  title={hasInstruction ? undefined : 'Enter an instruction first'}
                  className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                  style={{ background: '#0089cf', color: '#fff' }}
                >
                  {isApplying
                    ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Applying…</>
                    : <><Wand2 size={13} aria-hidden="true" /> Apply AI Edit</>}
                </Button>
              </div>
            </Card>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
