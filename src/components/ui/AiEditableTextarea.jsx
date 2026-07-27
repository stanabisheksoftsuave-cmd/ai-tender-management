import { useState, useRef, useEffect } from 'react'
import { Wand2 } from 'lucide-react'
import AiEditPopup from './AiEditPopup'
import { applyAiInstruction } from '../../utils/aiTextEdit'
import { useDismissable } from '../../context/NavigationContext'

/*
 * A textarea with select-to-edit-with-AI. Select any run of text inside it and
 * an "Edit with AI" popup appears; Apply rewrites just that selection and calls
 * onChange with the full updated value. Drop-in wherever a plain long-text field
 * lives (PSF background, ITT description, SOW section content, …).
 */
export default function AiEditableTextarea({
  value,
  onChange,
  disabled = false,
  rows = 5,
  placeholder,
  className = '',
}) {
  const taRef = useRef(null)
  const [sel, setSel] = useState(null)   // { start, end, text }
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)

  const close = () => { setSel(null); setPrompt('') }
  useDismissable(!!sel, close)

  useEffect(() => {
    if (!sel) return
    const onKey = e => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel])

  const captureSelection = () => {
    if (disabled) return
    const el = taRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = (value || '').slice(start, end).trim()
    if (end > start && text) setSel({ start, end, text: (value || '').slice(start, end) })
  }

  const apply = () => {
    if (!sel || !prompt.trim()) return
    setBusy(true)
    setTimeout(() => {
      const rewritten = applyAiInstruction(sel.text, prompt)
      const next = (value || '').slice(0, sel.start) + rewritten + (value || '').slice(sel.end)
      onChange(next)
      setBusy(false)
      close()
    }, 600)
  }

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        value={value}
        // Any edit while the popup is open would leave sel.start/end pointing at
        // the wrong characters, so close it and make the user reselect.
        onChange={e => { if (sel) close(); onChange(e.target.value) }}
        onMouseUp={captureSelection}
        onScroll={() => { if (sel) close() }}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />

      {!disabled && (
        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
          <Wand2 size={10} /> Select any text to edit it with AI
        </p>
      )}

      {sel && (
        <div className="absolute z-50 mt-1" style={{ top: '100%', left: 0 }}>
          <AiEditPopup
            selectedText={sel.text}
            prompt={prompt}
            onPromptChange={setPrompt}
            onApply={apply}
            onCancel={close}
            busy={busy}
          />
        </div>
      )}
    </div>
  )
}
