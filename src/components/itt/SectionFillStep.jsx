import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Loader2, Download } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { parseDocxTemplate } from '../../utils/docxTemplate'

export default function SectionFillStep({ section, answers, onAnswersChange, onNext, onBack, isFirst, isLast, standInNotice }) {
  const [load, setLoad] = useState({ docxUrl: null, model: null, error: null })
  const [values, setValues] = useState([])
  const debounceRef = useRef(null)

  const loading = load.docxUrl !== section.docxUrl
  const model = loading ? null : load.model
  const error = loading ? null : load.error

  useEffect(() => {
    let cancelled = false
    parseDocxTemplate(section.docxUrl)
      .then(m => {
        if (cancelled) return
        setLoad({ docxUrl: section.docxUrl, model: m, error: null })
        setValues(m.fields.map((f, i) => (answers && answers[i] != null) ? answers[i] : f.defaultText))
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

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
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
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs leading-relaxed text-slate-700 bg-slate-50 rounded-xl border border-slate-100 p-4">
          {model.paragraphs.map(p => {
            if (p.segments.length === 0) return null
            return (
              <p key={p.id} className="whitespace-pre-wrap">
                {p.segments.map((seg, i) => {
                  if (seg.type === 'text') return <span key={i}>{seg.text}</span>
                  const value = values[seg.fieldIndex] ?? ''
                  const long = value.length > 60 || value.includes('\n')
                  return long ? (
                    <textarea
                      key={i}
                      value={value}
                      onChange={e => updateValue(seg.fieldIndex, e.target.value)}
                      rows={2}
                      className="block w-full my-1 px-2 py-1 text-xs rounded-md border border-amber-300 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                    />
                  ) : (
                    <input
                      key={i}
                      value={value}
                      onChange={e => updateValue(seg.fieldIndex, e.target.value)}
                      style={{ width: `${Math.max(6, value.length + 2)}ch` }}
                      className="inline-block px-1.5 py-0.5 mx-0.5 text-xs rounded border border-amber-300 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  )
                })}
              </p>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400">
          {model ? `${model.fields.length} field${model.fields.length === 1 ? '' : 's'} in this section` : ''}
        </p>
        <Button onClick={handleNext} disabled={loading} className="flex items-center gap-2">
          {isLast ? <>Proceed to Export <Download size={15} /></> : <>Save & Continue <ChevronRight size={15} /></>}
        </Button>
      </div>
    </Card>
  )
}
