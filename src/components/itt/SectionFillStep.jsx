import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, FileText, Loader2, Download, ArrowDown, CheckCircle2, Wand2, RotateCcw } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import AiEditableField from '../ui/AiEditableField'
import AiEditPopup from '../ui/AiEditPopup'
import { parseDocxTemplate } from '../../utils/docxTemplate'
import { applyAiInstruction } from '../../utils/aiTextEdit'
import { useDismissable } from '../../context/NavigationContext'

const normKey = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.:]+$/, '')

const POPUP_W = 340
const POPUP_H = 300

// bodyMaxHeight caps the scrolling document area. The wizard gives it most of
// the viewport; a caller that nests this inside its own chrome (the contract
// page's review popup) passes something smaller so the whole card still fits.
export default function SectionFillStep({ section, answers, onAnswersChange, onNext, onSkip, onBack, isFirst, isLast, nextLabel, lastLabel, standInNotice, prefill = {}, readOnly = false, readOnlyNote, proseEdits = {}, onProseChange, bodyMaxHeight = '62vh' }) {
  const [load, setLoad] = useState({ docxUrl: null, model: null, error: null })
  const [values, setValues] = useState([])
  const debounceRef = useRef(null)
  const inputRefs = useRef({})
  const cursorRef = useRef(-1)
  const bodyRef = useRef(null)
  const prosePopRef = useRef(null)
  // Select-to-edit over the template's own prose (everything that isn't a field).
  const [proseSel, setProseSel] = useState(null)   // { ti, start, end, text, top, left }
  const [prosePrompt, setProsePrompt] = useState('')
  const [proseBusy, setProseBusy] = useState(false)

  const loading = load.docxUrl !== section.docxUrl
  const model = loading ? null : load.model
  const error = loading ? null : load.error

  useEffect(() => {
    let cancelled = false
    parseDocxTemplate(section.docxUrl)
      .then(m => {
        if (cancelled) return
        setLoad({ docxUrl: section.docxUrl, model: m, error: null })
        let usedPrefill = false
        const initial = m.fields.map((f, i) => {
          if (answers && answers[i] != null) return answers[i]
          const mapped = prefill[normKey(f.defaultText)]
          if (mapped != null && mapped !== '') { usedPrefill = true; return mapped }
          return f.defaultText
        })
        setValues(initial)
        inputRefs.current = {}
        cursorRef.current = -1
        if (usedPrefill && !answers && !readOnly) onAnswersChange(section.id, initial)
      })
      .catch(err => {
        if (cancelled) return
        setLoad({ docxUrl: section.docxUrl, model: null, error: err.message || 'Failed to load this section template.' })
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.docxUrl])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  /* ── Prose select-to-edit ───────────────────────────────────────────────
   * The docx model gives every non-highlighted text run a stable index, so an
   * AI edit to the template's own wording is stored as an override against that
   * index and spliced back into the XML on export — exactly like a field answer.
   */
  const closeProse = () => { setProseSel(null); setProsePrompt('') }
  useDismissable(!!proseSel, closeProse)

  useEffect(() => {
    if (!proseSel) return
    const onKey = e => { if (e.key === 'Escape') closeProse() }
    const onMoved = () => closeProse()
    // The popup lives in a body portal, so containment is tested against the
    // popup node rather than relying on event propagation.
    const onDocDown = e => { if (!prosePopRef.current?.contains(e.target)) closeProse() }
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
  }, [proseSel])

  const proseText = (ti) => proseEdits[ti] ?? model?.texts?.[ti]?.text ?? ''

  // Editing — fields and template wording alike — belongs to the section's
  // owner. A role viewing someone else's section sees it, but cannot change it.
  const canEditProse = !readOnly && !!onProseChange

  const captureProseSelection = () => {
    if (!canEditProse) return

    // A field input with a live selection runs its own select-to-edit popup —
    // don't double up. Anything else (including a merely focused field) is fair
    // game, otherwise dragging out of a field into the prose would do nothing.
    const active = document.activeElement
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
        && active.selectionStart !== active.selectionEnd) return

    const s = window.getSelection()
    if (!s || s.isCollapsed || s.rangeCount === 0) { if (proseSel) closeProse(); return }
    const range = s.getRangeAt(0)
    if (!bodyRef.current?.contains(range.commonAncestorContainer)) { if (proseSel) closeProse(); return }

    // Resolve the text run the selection belongs to. A selection that begins on
    // a paragraph rather than inside a run — a triple-click, a drag from the
    // margin, or a drag that starts on a field — lands on the <p>, so fall back
    // to the first run the range actually touches.
    const startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer
    let host = startEl?.closest?.('[data-ti]') || null
    if (!host || !bodyRef.current.contains(host)) {
      host = null
      // Search only within what was actually selected — Section H alone has
      // 4,000+ runs, so scanning the whole body on every mouseup would drag.
      let scope = range.commonAncestorContainer
      if (scope.nodeType === 3) scope = scope.parentElement
      if (!scope?.querySelectorAll) scope = bodyRef.current
      for (const el of scope.querySelectorAll('[data-ti]')) {
        if (range.intersectsNode(el) && (el.textContent || '').trim()) { host = el; break }
      }
    }
    if (!host) { if (proseSel) closeProse(); return }

    // Offsets within this run. A selection that starts before it, or runs past
    // the end of it, is clamped — the edit then applies to this run alone.
    const hostText = host.textContent || ''
    let start = 0
    if (host.contains(range.startContainer)) {
      const pre = document.createRange()
      pre.selectNodeContents(host)
      pre.setEnd(range.startContainer, range.startOffset)
      start = pre.toString().length
    }
    let end = hostText.length
    if (host.contains(range.endContainer)) {
      const preEnd = document.createRange()
      preEnd.selectNodeContents(host)
      preEnd.setEnd(range.endContainer, range.endOffset)
      end = preEnd.toString().length
    }
    if (end <= start) { if (proseSel) closeProse(); return }
    const text = hostText.slice(start, end)
    if (!text.trim()) { if (proseSel) closeProse(); return }

    const r = range.getBoundingClientRect()
    const above = r.bottom + POPUP_H > window.innerHeight && r.top > POPUP_H
    setProseSel({
      ti: Number(host.dataset.ti), start, end, text,
      top: above ? Math.max(8, r.top - POPUP_H - 6) : r.bottom + 6,
      left: Math.max(8, Math.min(r.left, window.innerWidth - POPUP_W - 8)),
    })
    setProsePrompt('')
  }

  const applyProseEdit = () => {
    if (!proseSel || !prosePrompt.trim()) return
    setProseBusy(true)
    setTimeout(() => {
      const original = proseText(proseSel.ti)
      const rewritten = applyAiInstruction(proseSel.text, prosePrompt)
      const next = original.slice(0, proseSel.start) + rewritten + original.slice(proseSel.end)
      onProseChange(section.id, { ...proseEdits, [proseSel.ti]: next })
      window.getSelection()?.removeAllRanges()
      setProseBusy(false)
      closeProse()
    }, 600)
  }

  const editedProseCount = model?.texts
    ? Object.keys(proseEdits).filter(ti => proseEdits[ti] !== model.texts[ti]?.text).length
    : 0
  const revertAllProse = () => onProseChange?.(section.id, {})

  const updateValue = (fieldIndex, value) => {
    setValues(prev => {
      const next = [...prev]
      next[fieldIndex] = value
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onAnswersChange(section.id, next), 400)
      return next
    })
  }

  const handleNext = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onAnswersChange(section.id, values)
    onNext()
  }

  const isFilled = (i) => {
    const v = (values[i] ?? '').trim()
    if (!v) return false
    const def = (model?.fields[i]?.defaultText ?? '').trim()
    return v !== def
  }

  const total = model ? model.fields.length : 0
  let filledCount = 0
  for (let i = 0; i < total; i++) if (isFilled(i)) filledCount++
  const remaining = total - filledCount
  const pct = total ? Math.round((filledCount / total) * 100) : 0
  const allFilled = total > 0 && remaining === 0

  const jumpToNextEmpty = () => {
    const empties = []
    for (let i = 0; i < total; i++) if (!isFilled(i)) empties.push(i)
    if (!empties.length) return
    const next = empties.find(i => i > cursorRef.current) ?? empties[0]
    cursorRef.current = next
    const el = inputRefs.current[next]
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      setTimeout(() => el.focus({ preventScroll: true }), 160)
    }
  }

  const renderSegment = (seg, i) => {
    if (seg.type === 'text') {
      const ti = seg.textIndex
      if (ti == null) return <span key={i}>{seg.text}</span>
      const edited = proseEdits[ti] != null && proseEdits[ti] !== seg.text
      return (
        <span
          key={i}
          data-ti={ti}
          title={edited ? 'Edited with AI — click the ↺ in the toolbar to revert' : undefined}
          className={edited ? 'rounded-sm' : undefined}
          style={edited ? { background: 'rgba(0,137,207,0.08)', boxShadow: 'inset 0 -1px 0 rgba(0,137,207,0.35)' } : undefined}
        >
          {edited ? proseEdits[ti] : seg.text}
        </span>
      )
    }
    const value = values[seg.fieldIndex] ?? ''
    const filled = isFilled(seg.fieldIndex)
    if (readOnly) {
      const tone = filled
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-slate-200 bg-slate-100 text-slate-400'
      return (
        <span key={i} className={`inline-block px-1.5 py-0.5 mx-0.5 align-baseline text-[13px] rounded border whitespace-pre-wrap ${tone}`}>
          {value || '—'}
        </span>
      )
    }
    const long = value.length > 60 || value.includes('\n')
    const tone = filled
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 focus:ring-emerald-300'
      : 'border-amber-400 bg-amber-50 text-amber-800 focus:ring-amber-300'
    const setRef = (el) => { inputRefs.current[seg.fieldIndex] = el }
    const onFocus = () => { cursorRef.current = seg.fieldIndex }
    // Every template field is select-to-edit-with-AI: highlight any run of text
    // inside it and the Edit with AI popup opens against the field.
    return long ? (
      <AiEditableField
        key={i} as="textarea" inputRef={setRef} onFocus={onFocus} value={value}
        onChange={val => updateValue(seg.fieldIndex, val)} rows={2}
        className={`block w-full my-1 px-2 py-1 text-[13px] rounded-md border focus:outline-none focus:ring-2 resize-y transition-colors ${tone}`}
      />
    ) : (
      <AiEditableField
        key={i} as="input" inputRef={setRef} onFocus={onFocus} value={value}
        onChange={val => updateValue(seg.fieldIndex, val)}
        style={{ width: `${Math.max(6, value.length + 2)}ch`, maxWidth: '100%' }}
        className={`inline-block px-1.5 py-0.5 mx-0.5 align-baseline text-[13px] rounded border focus:outline-none focus:ring-2 transition-colors ${tone} ${filled ? '' : 'font-medium'}`}
      />
    )
  }

  const renderParagraph = (block) => {
    if (block.segments.length === 0) return null
    const hasField = block.segments.some(s => s.type === 'field')
    const paraText = block.segments.filter(s => s.type === 'text').map(s => s.text).join('').trim()
    const isHeading = !hasField && paraText.length > 0 && paraText.length <= 60 &&
      paraText === paraText.toUpperCase() && /[A-Z]{3,}/.test(paraText)
    if (isHeading) {
      // Rendered from its segments, not the joined string, so a heading is
      // selectable and AI-editable like the rest of the section.
      return (
        <p key={block.id} className="font-semibold tracking-wide mt-4 mb-1.5 first:mt-0" style={{ color: '#1b4c6f' }}>
          {block.segments.map(renderSegment)}
        </p>
      )
    }
    return <p key={block.id} className="whitespace-pre-wrap mb-1.5">{block.segments.map(renderSegment)}</p>
  }

  const isEmptyPara = (b) => b.type === 'p' && b.segments.every(s => s.type === 'text' && !s.text.trim())
  const cellHasContent = (cell) => cell.blocks.some(b => b.type === 'table' || !isEmptyPara(b))

  const renderTable = (block, bi) => {
    if (block.rows.length <= 1) {
      const cells = block.rows.flatMap(r => r.cells).filter(cellHasContent)
      if (cells.length === 0) return null
      return (
        <div key={`tbl-${bi}`} className="flex flex-wrap items-baseline gap-x-8 gap-y-1 my-2">
          {cells.map((cell, ci) => (
            <div key={ci} className="min-w-0">{renderBlocks(cell.blocks)}</div>
          ))}
        </div>
      )
    }
    return (
      <div key={`tbl-${bi}`} className="my-3 overflow-x-auto rounded-lg" style={{ border: '1px solid #cce6f8' }}>
        <table className="w-full border-collapse text-[12.5px]">
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? '' : ''} style={ri === 0 ? { background: 'rgba(0,137,207,0.04)' } : ri % 2 ? { background: 'rgba(236,244,252,0.4)' } : {}}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={`px-3 py-2 align-top ${ri === 0 ? 'font-semibold' : ''}`} style={{
                    border: '1px solid #cce6f8',
                    color: ri === 0 ? '#1b4c6f' : undefined
                  }}>
                    {renderBlocks(cell.blocks)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderBlocks = (blocks) => {
    const out = []
    let prevEmpty = false
    blocks.forEach((block, bi) => {
      if (isEmptyPara(block)) {
        if (!prevEmpty) out.push(<div key={`sp-${bi}`} className="h-2" aria-hidden="true" />)
        prevEmpty = true
        return
      }
      prevEmpty = false
      out.push(block.type === 'table' ? renderTable(block, bi) : renderParagraph(block))
    })
    return out
  }

  return (
    <Card branded accent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
            <FileText size={16} style={{ color: '#0089cf' }} />
          </div>
          <h3 className="font-semibold" style={{ color: '#1b4c6f' }}>{section.title}</h3>
          {section.optional && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}>
              Optional
            </span>
          )}
          {readOnly && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}>
              Read only
            </span>
          )}
        </div>
        <button
          onClick={onBack}
          disabled={isFirst}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-slate-50"
          style={{ color: '#0089cf' }}>
          <ChevronLeft size={13} /> Back
        </button>
      </div>

      {section.attachmentUrl && (
        <a
          href={section.attachmentUrl}
          download
          className="mb-4 flex items-center gap-1.5 w-fit text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-50"
          style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)', background: 'rgba(0,137,207,0.04)' }}>
          <Download size={11} /> Download {section.attachmentLabel || 'attachment'}
        </a>
      )}

      {/* Shown when the section has fields to track, and also when it has none
          but its wording can still be refined with AI (e.g. Section B1). */}
      {!loading && !error && model && (total > 0 || canEditProse) && (
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 text-xs">
              {total === 0
                ? <span className="font-semibold" style={{ color: '#1b4c6f' }}>No fillable fields <span className="font-normal text-slate-400">· refine the wording with AI</span></span>
                : allFilled
                ? <span className="flex items-center gap-1.5 font-bold" style={{ color: '#0089cf' }}><CheckCircle2 size={14} /> All AI-filled fields · can be overwritten</span>
                : <span className="font-semibold" style={{ color: '#1b4c6f' }}>{filledCount} <span className="font-normal text-slate-400">of</span> {total} <span className="font-normal text-slate-400">AI-filled fields · can be overwritten</span></span>}
              {total > 0 && !allFilled && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{
                  color: '#e69c00',
                  background: 'rgba(230,156,0,0.08)',
                  border: '1px solid rgba(230,156,0,0.2)'
                }}>{remaining} to go</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {canEditProse && (
                <span className="hidden md:flex items-center gap-1 text-[10px] text-slate-400">
                  <Wand2 size={10} /> Select any text — a field or the wording itself — to edit it with AI
                </span>
              )}
              {canEditProse && editedProseCount > 0 && (
                <button
                  onClick={revertAllProse}
                  title="Revert every AI edit made to this section's wording"
                  className="flex items-center gap-1 text-[11px] font-semibold hover:underline underline-offset-2 transition-colors"
                  style={{ color: '#e69c00' }}>
                  <RotateCcw size={11} /> {editedProseCount} AI edit{editedProseCount === 1 ? '' : 's'}
                </button>
              )}
              {total > 0 && (
                <button
                  onClick={jumpToNextEmpty}
                  disabled={allFilled || readOnly}
                  className="flex items-center gap-1.5 text-[11px] font-semibold hover:underline underline-offset-2 disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                  style={{ color: '#0089cf' }}>
                  <ArrowDown size={12} /> Jump to next empty
                </button>
              )}
            </div>
          </div>
          <div className="olng-progress-bar h-2" style={total === 0 ? { display: 'none' } : undefined}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${allFilled ? '' : ''}`}
              style={{
                width: `${Math.max(pct, 2)}%`,
                background: allFilled
                  ? 'linear-gradient(90deg, #0089cf, #10b981)'
                  : 'linear-gradient(90deg, #1b4c6f, #0089cf)',
                position: 'relative', overflow: 'hidden'
              }}
            />
          </div>
        </div>
      )}

      {standInNotice}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: '#0089cf' }}>
          <Loader2 size={16} className="animate-spin" /> Loading template…
        </div>
      )}

      {error && <div className="text-center py-16 text-sm text-red-500">{error}</div>}

      {!loading && !error && model && model.fields.length === 0 && (
        <div className="mb-3 text-center text-xs text-slate-400">
          No fillable fields detected in this template — review the content below before export.
        </div>
      )}

      {!loading && !error && model && (
        <div className="overflow-y-auto rounded-xl bg-white" style={{ maxHeight: bodyMaxHeight, border: '1px solid #cce6f8' }}>
          <div
            ref={bodyRef}
            onMouseUp={captureProseSelection}
            className="px-6 py-6 sm:px-8 text-[13px] leading-6 text-slate-700"
          >
            {renderBlocks(model.blocks)}
          </div>
        </div>
      )}

      {/* Edit with AI — anchored to a selection made in the template's own prose */}
      {proseSel && createPortal(
        <div ref={prosePopRef} className="fixed z-[100]" style={{ top: proseSel.top, left: proseSel.left }}>
          <AiEditPopup
            selectedText={proseSel.text}
            prompt={prosePrompt}
            onPromptChange={setProsePrompt}
            onApply={applyProseEdit}
            onCancel={closeProse}
            busy={proseBusy}
          />
        </div>,
        document.body,
      )}

      <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,137,207,0.1)' }}>
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          {model
            ? (allFilled
                ? `All ${total} AI-filled field${total === 1 ? '' : 's'} · can be overwritten`
                : `${filledCount} of ${total} AI-filled field${total === 1 ? '' : 's'} · can be overwritten`)
            : ''}
        </p>
        <div className="flex items-center gap-2">
          {readOnly ? (
            <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg" style={{ color: '#64748b', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)' }}>
              {readOnlyNote || 'Read-only — owned by another role'}
            </span>
          ) : (
            <>
              {onSkip && (
                <Button variant="secondary" onClick={onSkip} disabled={loading} className="flex items-center gap-1.5">
                  Skip (optional) <ChevronRight size={14} />
                </Button>
              )}
              <Button variant="brand" onClick={handleNext} disabled={loading} className="flex items-center gap-2">
                {isLast
                  ? (lastLabel ? <>{lastLabel} <CheckCircle2 size={15} /></> : <>Proceed to Export <Download size={15} /></>)
                  : (nextLabel ? <>{nextLabel} <CheckCircle2 size={15} /></> : <>Save & Continue <ChevronRight size={15} /></>)}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
