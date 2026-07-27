import { useEffect, useRef } from 'react'
import { Wand2, X } from 'lucide-react'
import { AI_QUICK_ACTIONS } from '../../utils/aiTextEdit'

/*
 * The "Edit with AI" popup body — selected-text preview, an instruction box,
 * quick-action chips and Cancel/Apply. Pure UI: the parent owns the selection,
 * the prompt string and what Apply does. Position it however you like (the SOW
 * anchors it to the selection; the textarea anchors it under the field).
 */
export default function AiEditPopup({
  selectedText,
  prompt,
  onPromptChange,
  onApply,
  onCancel,
  busy = false,
  style,
  className = '',
}) {
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div
      className={`w-[340px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden ${className}`}
      style={style}
      onMouseUp={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-primary)]">
          <Wand2 size={14} /> Edit with AI
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600" aria-label="Close">
          <X size={15} />
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Selected text</p>
          <p className="text-xs text-slate-500 italic line-clamp-3 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
            {selectedText}
          </p>
        </div>

        <textarea
          ref={inputRef}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) { e.preventDefault(); onApply() }
          }}
          rows={2}
          placeholder={'Tell AI how to update this… e.g. "make it more formal", "shorten this", "replace 14 days with 21 days"'}
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />

        <div className="flex flex-wrap gap-1.5">
          {AI_QUICK_ACTIONS.map(sug => (
            <button
              key={sug}
              onClick={() => onPromptChange(sug)}
              className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-0.5">
          <button onClick={onCancel} className="text-xs font-medium text-slate-500 px-3 py-1.5 hover:text-slate-700">
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={!prompt.trim() || busy}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--color-primary)' }}
          >
            <Wand2 size={12} /> {busy ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
