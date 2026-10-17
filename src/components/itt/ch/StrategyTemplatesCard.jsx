import { useRef, useState } from 'react'
import { CheckCircle, ChevronUp, FileText, UploadCloud, X } from 'lucide-react'
import Card from '../../ui/Card'
import { STRATEGY_TEMPLATES } from './createIttForm'

/*
 * Strategy Templates — the collapsible upload checklist a direct ITT (no PSF)
 * carries (MAIN's StrategyTemplatesCard). "N of 8 uploaded", a progress bar,
 * and per-row Upload / Replace / remove. Required rows carry a red asterisk and
 * turn red when continuing is attempted without them.
 */

function TemplateRow({ template, file, index, onUpload, onClear, showError, readOnly }) {
  const inputRef = useRef(null)
  const uploaded = !!file
  return (
    <div className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 olng-slide-up" style={{ animationDelay: `${index * 45}ms` }}>
      <div className="flex min-w-0 items-center gap-3">
        <FileText size={16} className="shrink-0" style={{ color: uploaded ? '#059669' : '#0089cf' }} aria-hidden="true" />
        <span className="truncate text-sm font-medium" style={{ color: uploaded ? '#1e293b' : '#0089cf' }}>
          {template.label}
          {template.optional ? null : <> <span className="font-secondary text-red-500" aria-hidden="true">*</span></>}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {readOnly ? (
          uploaded
            ? <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5"><CheckCircle size={13} /><span className="max-w-40 truncate">{file.name}</span></span>
            : <span className="text-xs text-slate-400">Not uploaded</span>
        ) : uploaded ? (
          <>
            <span className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
              <CheckCircle size={13} />
              <span className="max-w-40 truncate">{file.name}</span>
              <button type="button" onClick={() => onClear(template.id)} className="text-emerald-600 hover:text-emerald-800" title="Remove" aria-label={`Remove ${template.label}`}>
                <X size={12} />
              </button>
            </span>
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
              Replace
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium transition-colors ${showError
              ? 'border-red-400 bg-red-50/60 text-red-600 hover:bg-red-50'
              : 'border-slate-300 text-slate-500 hover:border-[#0089cf] hover:text-[#0089cf]'}`}
          >
            <UploadCloud size={13} aria-hidden="true" />
            Upload
          </button>
        )}
        {!readOnly && (
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(template.id, f); e.target.value = '' }}
          />
        )}
      </div>
    </div>
  )
}

export default function StrategyTemplatesCard({ uploads, onUpload, onClear, showError = false, readOnly = false }) {
  const [open, setOpen] = useState(true)
  const uploadedCount = STRATEGY_TEMPLATES.filter(t => uploads[t.id]).length
  const total = STRATEGY_TEMPLATES.length
  const pct = total ? (uploadedCount / total) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))', color: '#0089cf' }}>
            <FileText size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold" style={{ color: '#1e293b', fontSize: '15px' }}>Strategy Templates</h2>
            <p className="text-xs text-slate-400">Upload the completed strategy templates for this ITT</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: '#0089cf' }}>{uploadedCount} of {total} uploaded</span>
          <ChevronUp size={16} className={`text-slate-400 transition-transform duration-300 ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
        </div>
      </button>

      {open && (
        <div>
          {uploadedCount > 0 && (
            <div className="h-1 w-full bg-slate-100">
              <div className="h-full rounded-r-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1b4c6f, #0089cf)' }} />
            </div>
          )}
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {STRATEGY_TEMPLATES.map((t, i) => (
              <TemplateRow
                key={t.id}
                template={t}
                file={uploads[t.id] || null}
                index={i}
                onUpload={onUpload}
                onClear={onClear}
                showError={showError && !t.optional && !uploads[t.id]}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
