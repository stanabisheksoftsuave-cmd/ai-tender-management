import { useEffect, useRef, useState } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, AlertTriangle, Eye, EyeOff, Loader2, FileText } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { B1_CATEGORY_MAP } from './b1Categories'
import { parseDocxTemplate } from '../../utils/docxTemplate'

const CATEGORY_KEYS = Object.keys(B1_CATEGORY_MAP)

export default function B1CategoryChooser({ selected, onConfirm, onBack }) {
  const startIndex = Math.max(0, CATEGORY_KEYS.indexOf(selected))
  const [index, setIndex] = useState(startIndex)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewState, setPreviewState] = useState({ model: null, loading: false, error: null })
  const modelCache = useRef({})

  const key = CATEGORY_KEYS[index]
  const cat = B1_CATEGORY_MAP[key]

  useEffect(() => {
    setPreviewOpen(false)
    setPreviewState({ model: null, loading: false, error: null })
  }, [key])

  const goPrev = () => setIndex(i => (i - 1 + CATEGORY_KEYS.length) % CATEGORY_KEYS.length)
  const goNext = () => setIndex(i => (i + 1) % CATEGORY_KEYS.length)

  const togglePreview = () => {
    if (previewOpen) { setPreviewOpen(false); return }
    setPreviewOpen(true)
    if (modelCache.current[cat.docxUrl]) {
      setPreviewState({ model: modelCache.current[cat.docxUrl], loading: false, error: null })
      return
    }
    setPreviewState({ model: null, loading: true, error: null })
    parseDocxTemplate(cat.docxUrl)
      .then(m => {
        modelCache.current[cat.docxUrl] = m
        setPreviewState({ model: m, loading: false, error: null })
      })
      .catch(err => setPreviewState({ model: null, loading: false, error: err.message || 'Failed to load preview.' }))
  }

  const renderSegment = (seg, i) => {
    if (seg.type === 'text') return <span key={i}>{seg.text}</span>
    const field = previewState.model?.fields[seg.fieldIndex]
    return (
      <span key={i} className="inline-block px-1 mx-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
        {field?.defaultText || '…'}
      </span>
    )
  }

  const isEmptyPara = (b) => b.type === 'p' && b.segments.every(s => s.type === 'text' && !s.text.trim())
  const cellHasContent = (cell) => cell.blocks.some(b => b.type === 'table' || !isEmptyPara(b))

  const renderParagraph = (block) => {
    if (block.segments.length === 0) return null
    const hasField = block.segments.some(s => s.type === 'field')
    const paraText = block.segments.filter(s => s.type === 'text').map(s => s.text).join('').trim()
    const isHeading = !hasField && paraText.length > 0 && paraText.length <= 60 &&
      paraText === paraText.toUpperCase() && /[A-Z]{3,}/.test(paraText)
    if (isHeading) {
      return <p key={block.id} className="font-semibold text-slate-900 tracking-wide mt-3 mb-1 first:mt-0">{paraText}</p>
    }
    return <p key={block.id} className="whitespace-pre-wrap mb-1">{block.segments.map(renderSegment)}</p>
  }

  const renderTable = (block, bi) => {
    if (block.rows.length <= 1) {
      const cells = block.rows.flatMap(r => r.cells).filter(cellHasContent)
      if (cells.length === 0) return null
      return (
        <div key={`tbl-${bi}`} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 my-1.5">
          {cells.map((cell, ci) => <div key={ci} className="min-w-0">{renderBlocks(cell.blocks)}</div>)}
        </div>
      )
    }
    return (
      <div key={`tbl-${bi}`} className="my-2 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-[11.5px]">
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'bg-slate-50' : (ri % 2 ? 'bg-slate-50/40' : '')}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={`border border-slate-200 px-2.5 py-1.5 align-top ${ri === 0 ? 'font-semibold text-slate-700' : ''}`}>
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
        if (!prevEmpty) out.push(<div key={`sp-${bi}`} className="h-1.5" aria-hidden="true" />)
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-800">Section B1 — General Conditions of Contract</h3>
          <p className="text-xs text-slate-400 mt-0.5">Choose the value / risk category that applies to this CONTRACT.</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={12} /> Back
        </button>
      </div>

      <div className="flex items-stretch gap-3">
        <button
          onClick={goPrev}
          aria-label="Previous category"
          className="shrink-0 self-center w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 min-w-0 rounded-xl border-2 border-blue-300 bg-blue-50/40 ring-2 ring-offset-1 ring-blue-100 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-blue-700">{cat.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{cat.sub}</p>
            </div>
            <CheckCircle size={16} className="text-blue-600 shrink-0" />
          </div>

          {cat.isStandIn && (
            <div className="mt-3 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 text-[10px] text-amber-700">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              Dedicated template not yet available — uses the nearest {cat.nearestTier} template as a stand-in.
            </div>
          )}

          <button
            onClick={togglePreview}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-primary)] hover:underline underline-offset-2 transition-colors">
            {previewOpen ? <EyeOff size={12} /> : <Eye size={12} />}
            {previewOpen ? 'Hide preview' : 'Preview template'}
          </button>

          {previewOpen && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white max-h-72 overflow-y-auto px-4 py-4 text-[12px] leading-5 text-slate-700">
              {previewState.loading && (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-xs">
                  <Loader2 size={14} className="animate-spin" /> Loading preview…
                </div>
              )}
              {previewState.error && (
                <div className="text-center py-10 text-xs text-red-500">{previewState.error}</div>
              )}
              {previewState.model && (
                <>
                  <div className="flex items-center gap-1.5 mb-3 text-slate-400">
                    <FileText size={12} />
                    <span className="text-[10px]">Read-only preview · highlighted fields will be filled in the next step</span>
                  </div>
                  {renderBlocks(previewState.model.blocks)}
                </>
              )}
            </div>
          )}
        </div>

        <button
          onClick={goNext}
          aria-label="Next category"
          className="shrink-0 self-center w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        {CATEGORY_KEYS.map((k, i) => (
          <button
            key={k}
            onClick={() => setIndex(i)}
            aria-label={`Go to ${B1_CATEGORY_MAP[k].label}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-blue-500' : 'w-1.5 bg-slate-200 hover:bg-slate-300'}`}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400">Category {index + 1} of {CATEGORY_KEYS.length}</p>
        <Button onClick={() => onConfirm(key)} className="flex items-center gap-2">
          Select & Continue <ChevronRight size={15} />
        </Button>
      </div>
    </Card>
  )
}
