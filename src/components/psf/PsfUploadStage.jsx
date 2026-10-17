/*
 * PSF Strategy — Stage 1 "Upload Templates" (Next.js Stage1UploadTemplates.tsx).
 *
 * Every upload is optional: nothing is marked required and a missing template
 * never blocks the generate control. Uploads are stored as metadata on
 * `tender.psfUploads[slotId]`, keyed by the row they were picked on, so a file
 * re-attaches to its own row after a reload.
 */

import {
  ArrowRight, Bot, ChevronDown, FileText, Sparkles, Trash2, UploadCloud, UserCheck,
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

/** A file input styled as a button — the label is the control. */
function UploadButton({ label, onSelect }) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-xs font-medium text-slate-700 transition-colors hover:border-[#0089cf]/50 hover:text-[#0089cf] focus-within:border-[#0089cf] focus-within:ring-2 focus-within:ring-[#0089cf]/30">
      <UploadCloud size={13} className="text-slate-400" />
      Upload
      <input
        type="file"
        className="sr-only"
        aria-label={label}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
          // Lets the same filename be re-picked after a delete.
          e.target.value = ''
        }}
      />
    </label>
  )
}

/** The uploaded file, with its delete control. */
function UploadedFileChip({ name, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
      <span className="max-w-28 truncate sm:max-w-40" title={name}>{name}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Delete ${name}`}
        title={`Delete ${name}`}
        className="cursor-pointer hover:opacity-70"
      >
        <Trash2 size={12} />
      </button>
    </span>
  )
}

function UploadControl({ slotLabel, upload, onUpload, onRemove }) {
  return upload
    ? <UploadedFileChip name={upload.name} onRemove={onRemove} />
    : <UploadButton label={`Upload ${slotLabel}`} onSelect={onUpload} />
}

/** One document row — tinted icon tile, title, completion line, then Upload. */
function TemplateRow({ label, icon: Icon, summary, upload, onUpload, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold break-words text-slate-800">{label}</p>
          <p className="text-[11px] text-slate-400">{summary}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <UploadControl slotLabel={label} upload={upload} onUpload={onUpload} onRemove={onRemove} />
      </div>
    </div>
  )
}

/**
 * @param {object} props
 * @param {{id,label,icon,summary}[]} props.templates  the six strategy templates
 * @param {{id,label,summary}} props.prequalDoc        the PQQ row (own card)
 * @param {{id,label}[]} props.supportingDocuments
 * @param {Record<string,{name}>} props.uploads
 */
export default function PsfUploadStage({
  templates, prequalDoc, supportingDocuments, uploads, onUpload, onRemoveUpload,
  onGenerate, isTemplatesOpen, onToggleTemplates, alreadyGenerated,
}) {
  const uploadedCount = templates.filter(t => uploads[t.id]).length

  return (
    <div className="space-y-4">
      <Card className="flex items-start gap-3 p-4">
        <UploadCloud size={16} className="mt-0.5 shrink-0" style={{ color: '#0089cf' }} />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">Re-upload completed strategy templates</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            The line under each template shows what is already completed in this tool.
            Complete or verify a template offline, then upload that copy back to attach it
            to the PSF. Every upload is optional.
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <button
          type="button"
          aria-expanded={isTemplatesOpen}
          onClick={onToggleTemplates}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-left">
            <FileText size={15} className="shrink-0" style={{ color: '#0089cf' }} />
            <span className="text-sm font-semibold text-slate-800">Strategy Templates</span>
            <span className="text-[11px] font-medium text-slate-400">
              {uploadedCount} of {templates.length} uploaded
            </span>
          </span>
          <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isTemplatesOpen ? 'rotate-180' : ''}`} />
        </button>

        {isTemplatesOpen && (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {templates.map(t => (
              <div key={t.id} className="p-4">
                <TemplateRow
                  label={t.label}
                  icon={t.icon || FileText}
                  summary={t.summary}
                  upload={uploads[t.id]}
                  onUpload={file => onUpload(t.id, file)}
                  onRemove={() => onRemoveUpload(t.id)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* The pre-qualification document sits on its own card: it is not a
          strategy template and is not counted with the six above. */}
      <Card className="p-4">
        <TemplateRow
          label={prequalDoc.label}
          icon={UserCheck}
          summary={prequalDoc.summary}
          upload={uploads[prequalDoc.id]}
          onUpload={file => onUpload(prequalDoc.id, file)}
          onRemove={() => onRemoveUpload(prequalDoc.id)}
        />
      </Card>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Supporting Documents <span className="font-normal">(optional)</span>
        </p>
        <div className="space-y-2">
          {supportingDocuments.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <FileText size={16} className="text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold break-words text-slate-800">{d.label}</p>
                </div>
                <div className="shrink-0">
                  <UploadControl
                    slotLabel={d.label}
                    upload={uploads[d.id]}
                    onUpload={file => onUpload(d.id, file)}
                    onRemove={() => onRemoveUpload(d.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles size={14} style={{ color: '#0089cf' }} />
              {alreadyGenerated ? 'Review PSF Strategy' : 'Generate PSF Strategy'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500" aria-live="polite">
              {alreadyGenerated
                ? 'This PSF has already been generated. Continue to review it - nothing is regenerated and uploads stay optional.'
                : 'Ready to generate.'}
            </p>
          </div>
          <Button type="button" variant="brand" onClick={onGenerate} className="flex items-center gap-2">
            {alreadyGenerated
              ? <>Continue to Review <ArrowRight size={13} /></>
              : <><Bot size={13} /> Generate with AI</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
