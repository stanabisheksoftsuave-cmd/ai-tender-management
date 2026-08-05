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
      <span key={i} className="inline-block px-1 mx-0.5 rounded text-amber-700" style={{
        background: 'rgba(230,156,0,0.08)',
        border: '1px solid rgba(230,156,0,0.2)'
      }}>
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
      return <p key={block.id} className="font-semibold tracking-wide mt-3 mb-1 first:mt-0" style={{ color: '#1e293b' }}>{paraText}</p>
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
      <div key={`tbl-${bi}`} className="my-2 overflow-x-auto rounded-lg" style={{ border: '1px solid #cce6f8' }}>
        <table className="w-full border-collapse text-[11.5px]">
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} style={ri === 0 ? { background: 'rgba(0,137,207,0.04)' } : ri % 2 ? { background: 'rgba(236,244,252,0.3)' } : {}}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={`px-2.5 py-1.5 align-top ${ri === 0 ? 'font-semibold' : ''}`} style={{
                    border: '1px solid #cce6f8',
                    color: ri === 0 ? '#1e293b' : undefined
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
    <Card branded className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold" style={{ color: '#1e293b' }}>Section B1 — General Conditions of Contract</h3>
          <p className="text-xs text-slate-400 mt-1">Choose the value/risk tier, or Purchase of Materials for goods procurement, that applies to this CONTRACT.</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50" style={{ color: '#0089cf' }}>
          <ChevronLeft size={13} /> Back
        </button>
      </div>

      {/* Category dropdown — the user picks the tier that applies to this contract */}
      <div className="mb-4">
        <label className="text-xs font-semibold mb-2 block" style={{ color: '#1e293b' }}>
          Select the value / risk tier that applies to this contract
        </label>
        <select
          value={key}
          onChange={e => setIndex(CATEGORY_KEYS.indexOf(e.target.value))}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30"
          style={{ border: '1px solid rgba(0,137,207,0.25)', background: '#fff', color: '#1e293b' }}
        >
          {CATEGORY_KEYS.map(k => (
            <option key={k} value={k}>{B1_CATEGORY_MAP[k].label} — {B1_CATEGORY_MAP[k].sub}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl p-4 transition-all" style={{
        background: 'linear-gradient(135deg, rgba(0,137,207,0.05), rgba(236,244,252,0.6))',
        border: '2px solid rgba(0,137,207,0.25)',
        boxShadow: '0 0 0 4px rgba(0,137,207,0.06), 0 4px 16px rgba(0,137,207,0.08)'
      }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{cat.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{cat.sub}</p>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #0089cf, #00b4d8)' }}>
            <CheckCircle size={14} className="text-white" />
          </div>
        </div>

        {cat.isStandIn && (
          <div className="mt-3 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[10px]" style={{
            background: 'rgba(230,156,0,0.06)',
            border: '1px solid rgba(230,156,0,0.2)',
            color: '#b07600'
          }}>
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Dedicated template not yet available — uses the nearest {cat.nearestTier} template as a stand-in.
          </div>
        )}

        <button
          onClick={togglePreview}
          className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold hover:underline underline-offset-2 transition-colors"
          style={{ color: '#0089cf' }}>
          {previewOpen ? <EyeOff size={12} /> : <Eye size={12} />}
          {previewOpen ? 'Hide preview' : 'Preview template'}
        </button>

        {previewOpen && (
          <div className="mt-3 rounded-lg bg-white max-h-72 overflow-y-auto px-4 py-4 text-[12px] leading-5 text-slate-700" style={{ border: '1px solid #cce6f8' }}>
            {previewState.loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-xs" style={{ color: '#0089cf' }}>
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

      <div className="flex justify-between items-center mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,137,207,0.1)' }}>
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>Category {index + 1} of {CATEGORY_KEYS.length}</p>
        <Button variant="brand" onClick={() => onConfirm(key)} className="flex items-center gap-2">
          Select & Continue <ChevronRight size={15} />
        </Button>
      </div>
    </Card>
  )
}
