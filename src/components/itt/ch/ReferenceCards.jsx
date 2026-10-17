import { ClipboardCheck, Download, FileSpreadsheet, FileText, Paperclip, User } from 'lucide-react'
import Card from '../../ui/Card'

/*
 * Read-only reference cards on the Create ITT Project Details step:
 * Qualified Bidders (MAIN's QualifiedBiddersCard), Internal Reference Documents
 * (MAIN's InternalReferenceDocumentsCard) and — for a PSF-sourced ITT — the
 * Generated Templates with their Excel downloads.
 */

const headingIcon = (Icon) => (
  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
    <Icon size={16} style={{ color: '#0089cf' }} aria-hidden="true" />
  </span>
)

const rowStyle = { background: 'rgba(0,137,207,0.04)', border: '1px solid rgba(0,137,207,0.1)' }

export function QualifiedBiddersCard({ bidders }) {
  return (
    <Card branded className="p-6">
      <h3 className="mb-4 flex items-center gap-2.5 font-semibold" style={{ color: '#1e293b', fontSize: '15px' }}>
        {headingIcon(User)}
        Qualified Bidders - From Pre-Qualification
      </h3>
      <div className="space-y-2">
        {bidders.map((bidder, idx) => (
          <div key={bidder.id ?? idx} className="flex flex-wrap items-center gap-3 rounded-lg p-3" style={rowStyle}>
            <span className="flex w-6 h-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: '#0089cf' }}>{idx + 1}</span>
            <div className="min-w-0 flex-1 basis-40">
              <p className="text-sm font-medium break-words" style={{ color: '#1e293b' }}>{bidder.name}</p>
              <p className="text-xs text-slate-400">{bidder.country}</p>
            </div>
            <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>✓ Passed Pre-Qual</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

const DOC_LABELS = { icv: 'LC Plan', companyEstimate: 'Company Estimate', riskAssessment: 'Contract Risk Assessment' }

export function InternalReferenceDocumentsCard({ documents, onDownload }) {
  return (
    <Card branded className="p-6">
      <h2 className="mb-4 flex items-center gap-2.5 font-semibold" style={{ color: '#1e293b', fontSize: '15px' }}>
        {headingIcon(Paperclip)}
        Internal Reference Documents
      </h2>
      <div className="space-y-2">
        {Object.entries(documents).map(([key, value]) => {
          const label = DOC_LABELS[key] ?? key
          const fileName = value instanceof Blob ? value.name : value
          return (
            <div key={key} className="flex items-center gap-2.5 rounded-lg p-2.5" style={rowStyle}>
              <FileText size={14} className="shrink-0" style={{ color: '#0089cf' }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: '#1e293b' }}>
                  {label}
                  <span className="ml-1.5 text-xs text-slate-400">- {fileName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDownload(value, label)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white"
                style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}
              >
                <Download size={11} aria-hidden="true" />
                Download
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const excelBtn = 'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-all hover:bg-white'
const excelStyle = { color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }

/* The PSF-sourced ITT's completed strategy templates (+ the PQQ summary). */
export function GeneratedTemplatesCard({ templates, preQual, onExportTemplate, onExportPreQual }) {
  return (
    <Card branded accent className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2.5" style={{ color: '#1e293b', fontSize: '15px' }}>
        {headingIcon(FileSpreadsheet)}
        Generated Templates
      </h3>
      <div className="space-y-2">
        {preQual && (
          <div className="flex items-center gap-3 p-3 rounded-lg" style={rowStyle}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,137,207,0.1)' }}>
              <ClipboardCheck size={15} style={{ color: '#0089cf' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>Pre-Qualification Document</p>
              <p className="text-xs text-slate-400">{preQual.count} qualified bidder{preQual.count === 1 ? '' : 's'}</p>
            </div>
            <button type="button" onClick={onExportPreQual} title="Download Pre-Qualification Document as Excel" aria-label="Download Pre-Qualification Document as Excel" className={excelBtn} style={excelStyle}>
              <Download size={12} /> Excel
            </button>
          </div>
        )}
        {templates.map(({ template, rows }) => (
          <div key={template.id} className="flex items-center gap-3 p-3 rounded-lg" style={rowStyle}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${template.color}15` }}>
              <template.icon size={15} style={{ color: template.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>{template.title}</p>
              <p className="text-xs text-slate-400">
                {rows.length} {template.rowLabel?.toLowerCase() || 'row'}{rows.length === 1 ? '' : 's'} completed
              </p>
            </div>
            <button type="button" onClick={() => onExportTemplate(template, rows)} title={`Download ${template.title} as Excel`} aria-label={`Download ${template.title} as Excel`} className={excelBtn} style={excelStyle}>
              <Download size={12} /> Excel
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
