import { Bot, FileText, X } from 'lucide-react'
import { ModalShell } from './Dialogs'
import { evidenceDocument } from './model'

/**
 * Read-only view of what the AI extracted for one criterion — MAIN's
 * `SourceProofModal`. The AI strip's figures come from the evidence itself
 * (confidence %, flagged-for-review), never hard-coded copy.
 */
export function SourceProofModal({ metric, bidderName, onClose }) {
  const evidence = metric?.evidence
  return (
    <ModalShell isOpen={!!metric} onClose={onClose} labelledBy="source-proof-title" className="max-w-2xl">
      {metric && (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <FileText size={14} className="text-[var(--color-primary)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Source Proof Document</span>
              </div>
              <h3 id="source-proof-title" className="break-words text-sm font-semibold text-slate-800">{metric.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[11px] text-slate-400">{metric.docRef}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{metric.docType}</span>
                <span className="break-all text-[11px] text-slate-400">· {bidderName}</span>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 sm:px-6">
            <Bot size={12} className="shrink-0 text-[var(--color-primary)]" />
            <span className="text-[11px] font-medium text-[#1b4c6f]">
              {evidence
                ? `AI extraction · Confidence Score: ${Math.round(evidence.confidence * 100)}% · ${evidence.flaggedForReview ? 'Flagged for human review' : 'Not flagged for review'}`
                : 'No AI extraction available for this document'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600 sm:p-5">
              {evidence
                ? evidenceDocument(evidence)
                : `Document Ref: ${metric.docRef}\nType: ${metric.docType}\n\nSource content is not available for this document.`}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-[11px] text-slate-400">Parsed as part of automated compliance review · Read-only</span>
            <button type="button" onClick={onClose}
              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200">
              Close
            </button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
