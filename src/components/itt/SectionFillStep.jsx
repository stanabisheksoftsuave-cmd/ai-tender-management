import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Loader2, Download, ArrowDownToLine, CheckCircle2 } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { parseDocxTemplate } from '../../utils/docxTemplate'

const normKey = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.:]+$/, '')

export default function SectionFillStep({ section, answers, onAnswersChange, onNext, onBack, isFirst, isLast, standInNotice, prefill = {} }) {
  const [load, setLoad] = useState({ docxUrl: null, model: null, error: null })
  const [values, setValues] = useState([])
  const debounceRef = useRef(null)
  const inputRefs = useRef({})
  const cursorRef = useRef(-1)

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
        if (usedPrefill && !answers) onAnswersChange(section.id, initial)
      })
      .catch(err => {
        if (cancelled) return
        setLoad({ docxUrl: section.docxUrl, model: null, error: err.message || 'Failed to load this section template.' })
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.docxUrl])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

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
    if (seg.type === 'text') return <span key={i}>{seg.text}</span>
    const value = values[seg.fieldIndex] ?? ''
    const filled = isFilled(seg.fieldIndex)
    const long = value.length > 60 || value.includes('\n')
    const tone = filled
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 focus:ring-emerald-300'
      : 'border-amber-400 bg-amber-50 text-amber-800 focus:ring-amber-300'
    const setRef = (el) => { inputRefs.current[seg.fieldIndex] = el }
    const onFocus = () => { cursorRef.current = seg.fieldIndex }
    return long ? (
      <textarea
        key={i} ref={setRef} onFocus={onFocus} value={value}
        onChange={e => updateValue(seg.fieldIndex, e.target.value)} rows={2}
        className={`block w-full my-1 px-2 py-1 text-[13px] rounded-md border focus:outline-none focus:ring-2 resize-y transition-colors ${tone}`}
      />
    ) : (
      <input
        key={i} ref={setRef} onFocus={onFocus} value={value}
        onChange={e => updateValue(seg.fieldIndex, e.target.value)}
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
      return <p key={block.id} className="font-semibold text-slate-900 tracking-wide mt-4 mb-1.5 first:mt-0">{paraText}</p>
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
      <div key={`tbl-${bi}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-[12.5px]">
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'bg-slate-50' : (ri % 2 ? 'bg-slate-50/40' : '')}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={`border border-slate-200 px-3 py-2 align-top ${ri === 0 ? 'font-semibold text-slate-700' : ''}`}>
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
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[var(--color-primary)]" />
          <h3 className="font-semibold text-slate-800">{section.title}</h3>
        </div>
        <button
          onClick={onBack}
          disabled={isFirst}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={12} /> Back
        </button>
      </div>

      {!loading && !error && model && total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 text-xs">
              {allFilled
                ? <span className="flex items-center gap-1.5 font-semibold text-emerald-600"><CheckCircle2 size={13} /> All fields filled</span>
                : <span className="font-semibold text-slate-700">{filledCount} <span className="font-normal text-slate-400">of</span> {total} <span className="font-normal text-slate-400">fields filled</span></span>}
              {!allFilled && (
                <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">{remaining} to go</span>
              )}
            </div>
            <button
              onClick={jumpToNextEmpty}
              disabled={allFilled}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] hover:underline underline-offset-2 disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed transition-colors">
              <ArrowDownToLine size={12} /> Jump to next empty
            </button>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allFilled ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>
        </div>
      )}

      {standInNotice}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading template…
        </div>
      )}

      {error && <div className="text-center py-16 text-sm text-red-500">{error}</div>}

      {!loading && !error && model && model.fields.length === 0 && (
        <div className="text-center py-16 text-sm text-slate-400">
          No fillable fields detected in this template — review manually before export.
        </div>
      )}

      {!loading && !error && model && model.fields.length > 0 && (
        <div className="max-h-[62vh] overflow-y-auto rounded-xl border border-slate-200 bg-white">
          <div className="px-6 py-6 sm:px-8 text-[13px] leading-6 text-slate-700">
            {renderBlocks(model.blocks)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400">
          {model
            ? (allFilled
                ? `All ${total} field${total === 1 ? '' : 's'} completed`
                : `${filledCount} of ${total} field${total === 1 ? '' : 's'} filled`)
            : ''}
        </p>
        <Button onClick={handleNext} disabled={loading} className="flex items-center gap-2">
          {isLast ? <>Proceed to Export <Download size={15} /></> : <>Save & Continue <ChevronRight size={15} /></>}
        </Button>
      </div>
    </Card>
  )
}
