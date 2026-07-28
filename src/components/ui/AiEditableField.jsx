import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import AiEditPopup from './AiEditPopup'
import { applyAiInstruction } from '../../utils/aiTextEdit'
import { useDismissable } from '../../context/NavigationContext'

/*
 * The one select-to-edit-with-AI primitive. Wraps an <input> or <textarea>:
 * select any run of text inside it and the "Edit with AI" popup opens; Apply
 * rewrites just that selection and calls onChange with the full updated value.
 *
 * The popup is portalled to <body> and positioned fixed against the field's
 * bounding box, so it is never clipped by an ancestor with overflow hidden or
 * a scroll container — which is what the ITT section templates render inside.
 *
 * `inputRef` forwards the underlying DOM node to the caller (SectionFillStep
 * needs it for focus / jump-to-next-empty).
 */

const POPUP_W = 340
const POPUP_H = 300
const GAP = 6

export default function AiEditableField({
  as = 'textarea',
  value = '',
  onChange,
  disabled = false,
  inputRef,          // callback ref: (el) => void
  className = '',
  ...rest
}) {
  const elRef = useRef(null)
  const popRef = useRef(null)
  const [sel, setSel] = useState(null)       // { start, end, text, top, left }
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)

  const close = useCallback(() => { setSel(null); setPrompt('') }, [])
  useDismissable(!!sel, close)

  // Escape, any scroll and any resize drop the popup — its anchor would be stale
  // otherwise. Outside clicks close it too; the popup lives in a body portal, so
  // containment is tested against both the field and the popup node rather than
  // relying on event propagation.
  useEffect(() => {
    if (!sel) return
    const onKey = e => { if (e.key === 'Escape') close() }
    const onMoved = () => close()
    const onDocDown = e => {
      if (elRef.current?.contains(e.target)) return
      if (popRef.current?.contains(e.target)) return
      close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onMoved, true)
    window.addEventListener('resize', onMoved)
    document.addEventListener('mousedown', onDocDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onMoved, true)
      window.removeEventListener('resize', onMoved)
      document.removeEventListener('mousedown', onDocDown)
    }
  }, [sel, close])

  const capture = () => {
    if (disabled) return
    const el = elRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = String(value ?? '').slice(start, end)
    if (end <= start || !text.trim()) { if (sel) close(); return }

    const r = el.getBoundingClientRect()
    // Flip above the field when there isn't room beneath it.
    const above = r.bottom + POPUP_H + GAP > window.innerHeight && r.top > POPUP_H
    setSel({
      start, end, text,
      top: above ? Math.max(8, r.top - POPUP_H - GAP) : r.bottom + GAP,
      left: Math.max(8, Math.min(r.left, window.innerWidth - POPUP_W - 8)),
    })
    setPrompt('')
  }

  // Keyboard selection (shift+arrows, ctrl/cmd+A) should offer the popup too.
  const onKeyUp = (e) => {
    if ((e.shiftKey && e.key.startsWith('Arrow')) || (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey))) capture()
  }

  const apply = () => {
    if (!sel || !prompt.trim()) return
    setBusy(true)
    setTimeout(() => {
      const full = String(value ?? '')
      const rewritten = applyAiInstruction(sel.text, prompt)
      onChange(full.slice(0, sel.start) + rewritten + full.slice(sel.end))
      setBusy(false)
      close()
    }, 600)
  }

  // `inputRef` is a callback ref — SectionFillStep collects the DOM nodes into
  // its own map for focus / jump-to-next-empty.
  const setRef = (el) => {
    elRef.current = el
    if (typeof inputRef === 'function') inputRef(el)
  }

  // `rest` first so a caller's onFocus / rows / style / placeholder pass through,
  // but the selection handlers below always win.
  const shared = {
    ...rest,
    ref: setRef,
    value: value ?? '',
    disabled,
    className,
    // Editing while the popup is open would leave start/end pointing at the
    // wrong characters, so close it and make the user reselect.
    onChange: e => { if (sel) close(); onChange(e.target.value) },
    onMouseUp: capture,
    onDoubleClick: capture,
    onKeyUp,
  }

  return (
    <>
      {as === 'input' ? <input {...shared} /> : <textarea {...shared} />}
      {sel && createPortal(
        <div ref={popRef} className="fixed z-[100]" style={{ top: sel.top, left: sel.left }}>
          <AiEditPopup
            selectedText={sel.text}
            prompt={prompt}
            onPromptChange={setPrompt}
            onApply={apply}
            onCancel={close}
            busy={busy}
          />
        </div>,
        document.body,
      )}
    </>
  )
}
