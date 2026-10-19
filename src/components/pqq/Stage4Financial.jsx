import { useRef, useState } from 'react'
import { ArrowRight, Award, Bot, CheckCircle, ChevronRight, Download, FileText, RefreshCw, RotateCcw, Trash2, UploadCloud, UserCheck, XCircle } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import SearchableSelect from '../ui/SearchableSelect'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { exportFinancialFailReasonPdf } from '../../utils/pqqExports'
import { cn } from '../../utils/cn'
import { StageHeading, ShellFooter } from './PrequalShell'
import { PqqAlert, PqqButton, ReasonDialog, ReasonPopupLink } from './PqqUi'
import { patchBidderIn } from './useTenderPatcher'
import {
  FINANCIAL_SHEET, PQQ_LONG_TEXT_MAX_LENGTH, PQQ_TEXT_LIMIT_MESSAGE, generateAiStage4, markLabel, stage4Overall,
} from './pqqModel'

function AssignedTeamCard({ assignedCes }) {
  const label = assignedCes.map(u => u.name).filter(Boolean).join(', ')
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-[#0089cf]/10 text-[#0089cf]" aria-hidden="true">
        <UserCheck size={15} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Team</span>
        <span className="block text-[11px] text-slate-400">Runs the financial assessment</span>
      </span>
      {label ? (
        <span className="ml-auto inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-3 pl-1">
          <span className="flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-[#0089cf] text-[11px] font-bold text-white" aria-hidden="true">
            {label.trim().charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 text-sm font-semibold break-words text-slate-700">{label}</span>
        </span>
      ) : (
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Not assigned on the CIF
        </span>
      )}
    </div>
  )
}

// Main app's upload limits (§7.1): per batch, per file, and the batch total.
const MAX_FILES_PER_UPLOAD = 20
const MAX_FILE_BYTES = 512 * 1024 * 1024
const MAX_BATCH_BYTES = 1024 * 1024 * 1024

const formatFileSize = (bytes) => {
  if (bytes == null) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Statements already on file for a bidder — the list, or the single file older uploads stored. */
const financialFilesOf = (bidder) =>
  Array.isArray(bidder?.financialFiles) ? bidder.financialFiles
    : bidder?.financialFileName ? [{ id: 'legacy', name: bidder.financialFileName }]
    : []

/*
 * Bidder picker + financial statement upload — the main app's
 * BidderFinancialUploadCard. Files are staged in "Ready to upload" and only
 * sent on Submit; "Uploaded so far" lists the selected bidder's statements,
 * each replaceable on its own.
 */
function BidderFinancialUploadCard({ bidders, bidderId, onSelectBidder, busy, processingPhase, onSubmit, onReplace }) {
  const [pendingFiles, setPendingFiles] = useState([])
  const [validationError, setValidationError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const bidder = bidders.find(b => String(b.id) === String(bidderId))
  const uploaded = financialFilesOf(bidder)

  const stageFiles = (list) => {
    const files = Array.from(list || [])
    if (files.length === 0) return
    const next = [...pendingFiles, ...files]
    const skipped = Math.max(0, next.length - MAX_FILES_PER_UPLOAD)
    setPendingFiles(next.slice(0, MAX_FILES_PER_UPLOAD))
    setValidationError(skipped > 0
      ? `Only ${MAX_FILES_PER_UPLOAD} files can be uploaded at once — ${skipped} file${skipped === 1 ? ' was' : 's were'} left out.`
      : null)
  }

  const submit = () => {
    if (busy || pendingFiles.length === 0) return
    const oversized = pendingFiles.find(f => f.size > MAX_FILE_BYTES)
    if (oversized) { setValidationError(`File ${oversized.name} exceeds the 512 MB limit.`); return }
    if (pendingFiles.reduce((sum, f) => sum + f.size, 0) > MAX_BATCH_BYTES) {
      setValidationError('Total upload size exceeds the 1 GB limit.')
      return
    }
    setValidationError(null)
    onSubmit(bidderId, pendingFiles)
    setPendingFiles([])
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (!busy) stageFiles(e.dataTransfer?.files)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-lg bg-[#afd9f4] text-[#0089cf]" aria-hidden="true">
          <UploadCloud size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">Upload Financial Statements</h3>
          <p className="text-xs text-slate-500">Choose a bidder, then add their financial statements.</p>
        </div>
      </div>

      <div className="mb-1 text-xs font-semibold text-slate-800">Bidder</div>
      <SearchableSelect
        value={bidderId ?? ''}
        onChange={v => { onSelectBidder(String(v)); setPendingFiles([]); setValidationError(null) }}
        options={bidders}
        getValue={b => String(b.id)}
        getLabel={b => `${b.name}${b.financialReuploadRequested ? ' (Awaiting Re-upload)' : ''}`}
        getSubLabel={b => [b.country, b.category].filter(Boolean).join(' · ')}
        disabled={busy}
        placeholder="Select bidder…"
        searchPlaceholder="Search bidders…"
        emptyText="No matching bidders"
        ariaLabel="Select bidder"
      />
      <p className="mt-2 mb-4 text-xs text-slate-500">
        Up to 20 files per upload, 512 MB each, 1 GB total. Figures are extracted by AI, then confirmed here.
      </p>

      {/* Drop zone — drag files in, or click anywhere on it to browse */}
      <label
        onDragOver={e => { e.preventDefault(); if (!busy) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragOver ? 'border-[#0089cf] bg-[#0089cf]/5' : 'border-slate-300 bg-white hover:border-[#0089cf]/60',
          busy && 'pointer-events-none opacity-50',
        )}
      >
        <span className="flex w-10 h-10 items-center justify-center rounded-full bg-[#afd9f4] text-[#0089cf]" aria-hidden="true">
          <UploadCloud size={18} />
        </span>
        <span className="text-sm font-semibold text-slate-800">Drag and drop the bidder&apos;s financial statements here</span>
        <span className="text-xs text-slate-500">or <span className="font-semibold text-[#0089cf]">click to browse</span></span>
        <input ref={inputRef} type="file" multiple className="hidden" disabled={busy}
          aria-label="Upload Statement"
          onChange={e => { stageFiles(e.target.files); e.target.value = '' }} />
      </label>

      {busy && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Bot size={12} className="animate-pulse" />
          {processingPhase === 'upload' ? 'Uploading financial statements…' : 'AI assessing financial criteria…'}
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready to upload</h3>
            <span className="rounded-full bg-[#afd9f4] px-2 py-0.5 text-[11px] font-semibold text-[#0089cf]">{pendingFiles.length}</span>
          </div>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-md bg-[#afd9f4] text-[#0089cf]" aria-hidden="true">
                    <FileText size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{file.name}</span>
                    <span className="block text-xs text-slate-500">{formatFileSize(file.size)}</span>
                  </span>
                </span>
                <button type="button" aria-label={`Delete ${file.name}`} disabled={busy}
                  onClick={() => { setPendingFiles(p => p.filter((_, i) => i !== index)); setValidationError(null) }}
                  className="flex w-8 h-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <Button size="sm" disabled={busy} onClick={submit}>Submit</Button>
          </div>
        </div>
      )}

      {validationError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{validationError}</div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded so far</h3>
          {uploaded.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{uploaded.length}</span>
          )}
        </div>
        {uploaded.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
            No financial statements uploaded yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
            {uploaded.map(doc => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50/60">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-md bg-[#afd9f4] text-[#0089cf]" aria-hidden="true">
                    <FileText size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{doc.name}</span>
                    {doc.size != null && <span className="block text-xs text-slate-500">{formatFileSize(doc.size)}</span>}
                  </span>
                </span>
                <label className={cn(
                  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50',
                  busy && 'pointer-events-none opacity-50',
                )}>
                  <RefreshCw size={12} aria-hidden="true" /> Replace
                  <input type="file" className="hidden" disabled={busy} aria-label={`Replace ${doc.name}`}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      if (file.size > MAX_FILE_BYTES) { setValidationError(`File ${file.name} exceeds the 512 MB limit.`); return }
                      setValidationError(null)
                      onReplace(bidderId, doc.id, file)
                    }} />
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/*
 * The financial criteria grid. Editable for the Contract Engineer (Pass/Fail
 * with a required reason on Fail, Reset to the AI mark); read-only for the
 * Contract Holder once the assessment has been returned.
 */
function FinancialMatrix({ tender, bidders, canEdit, onSetMark, onReset, onRequestReupload }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white pb-2">
      <table className="w-full min-w-max border-collapse text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-80 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Criteria</th>
            {bidders.map(bidder => {
              const overall = stage4Overall(bidder)
              return (
                <th key={bidder.id} className="border-b border-l border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-1 flex flex-wrap items-center justify-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800">{bidder.name}</span>
                      {overall === 'pass' && <Badge variant="success"><CheckCircle size={10} /> Pass</Badge>}
                      {overall === 'fail' && <Badge variant="error"><XCircle size={10} /> Fail</Badge>}
                    </div>
                    {overall === 'fail' && (
                      <>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onRequestReupload(bidder.id)}
                            className="mt-1 w-full rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 transition-colors hover:bg-amber-100"
                          >
                            Reupload Bidder Documents
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => exportFinancialFailReasonPdf(tender, bidder)}
                          className="mt-1 mb-1 flex w-full items-center justify-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          <Download size={10} /> Export Reason
                        </button>
                      </>
                    )}
                    <span className="text-[10px] font-normal text-slate-400">{[bidder.country, bidder.category].filter(Boolean).join(' · ')}</span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={bidders.length + 1} className="sticky left-0 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
              {FINANCIAL_SHEET.label}
            </td>
          </tr>
          {FINANCIAL_SHEET.criteria.map(c => (
            <tr key={c.id} className="group border-b border-slate-100 transition-colors hover:bg-slate-50">
              <td className="sticky left-0 z-10 border-r border-slate-100 bg-white p-3 group-hover:bg-slate-50">
                <p className="text-xs font-medium text-slate-700">{c.item}</p>
                <p className="mt-0.5 w-72 whitespace-normal text-[10px] text-slate-400">{c.detail}</p>
              </td>
              {bidders.map(bidder => {
                const mark = bidder.stage4Marks?.financial?.[c.id]
                const aiMark = bidder.stage4Ai?.financial?.[c.id]
                const overridden = aiMark != null && mark !== aiMark
                const reason = bidder.stage4Reasons?.financial?.[c.id]
                return (
                  <td key={bidder.id} className="border-l border-slate-100 p-3 text-center align-top">
                    <div className="flex flex-col items-center gap-1.5">
                      {canEdit ? (
                        <div className="flex shrink-0 justify-center gap-1.5">
                          {['pass', 'fail'].map(v => (
                            <button
                              key={v}
                              type="button"
                              aria-pressed={mark === v}
                              onClick={() => onSetMark(bidder, c, v)}
                              className={cn(
                                'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-all',
                                mark === v
                                  ? v === 'pass' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300' : 'border-red-300 bg-red-50 text-red-700 ring-1 ring-red-300'
                                  : v === 'pass' ? 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300' : 'border-slate-200 bg-white text-slate-500 hover:border-red-300',
                              )}
                            >
                              {markLabel(v)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={cn('text-sm font-semibold', mark === 'pass' ? 'text-emerald-700' : mark === 'fail' ? 'text-red-700' : 'text-slate-400')}>
                          {mark ? markLabel(mark) : 'Not yet evaluated'}
                        </span>
                      )}
                      {canEdit && overridden ? (
                        <button type="button" onClick={() => onReset(bidder.id, c.id)} className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700">
                          <RotateCcw size={9} /> Reset
                        </button>
                      ) : !overridden && aiMark != null ? (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400"><Bot size={9} /> AI suggested</span>
                      ) : null}
                      {mark === 'fail' && <ReasonPopupLink subject={`${c.item} for ${bidder.name}`} reason={reason} />}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/*
 * Stage 4 — Financial Assessment. The Contract Engineer owns it (upload each
 * bidder's statements → AI marks → override → Return to Contract Holder); the
 * Contract Holder only looks in (MAIN Stage4Financial's `!canAssess` view) and
 * moves on with "Continue to Final Review" once the CE has handed it back.
 */
export function Stage4Financial({ tender, patch, isCE, assignedCes, isComplete, onReturnToHolder, onContinue }) {
  const [processingId, setProcessingId] = useState(null)
  const [processingPhase, setProcessingPhase] = useState(null)
  const [selectedIdRaw, setSelectedIdRaw] = useState(null)
  const [finalizing, setFinalizing] = useState(false)
  const [reasonTarget, setReasonTarget] = useState(null)

  useAiLockWhile(processingId != null, 'AI assessing financial criteria')

  const all = tender.prequalBidders || []
  const active = all.filter(b => !b.droppedAt)
  // The picker lists every bidder (uploaded ones stay reachable for more
  // statements or a Replace); it opens on the first one still waiting.
  const firstWaiting = active.find(b => !b.financialUploaded)
  const selectedId = active.some(b => String(b.id) === String(selectedIdRaw))
    ? String(selectedIdRaw)
    : (firstWaiting ?? active[0]) ? String((firstWaiting ?? active[0]).id) : null
  const assessed = active.filter(b => b.financialUploaded)
  const allAssessed = active.length > 0 && active.every(b => b.financialUploaded && stage4Overall(b))
  const passers = active.filter(b => stage4Overall(b) === 'pass')

  const patchBidder = (bidderId, fn) => patch(t => ({ prequalBidders: patchBidderIn(t.prequalBidders, bidderId, fn) }))

  const toRecord = (file) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
  })

  // Simulated upload → AI pass. Only a bidder's first upload (or the one after
  // a re-upload request) runs the AI marks; adding statements later never
  // wipes marks the Contract Engineer has already confirmed or overridden.
  const handleFiles = (bidderId, files) => {
    if (!files?.length || bidderId == null) return
    setProcessingId(bidderId)
    setProcessingPhase('upload')
    setTimeout(() => {
      setProcessingPhase('ai')
      setTimeout(() => {
        const records = files.map(toRecord)
        patchBidder(bidderId, b => {
          const filesNow = [...financialFilesOf(b), ...records]
          if (b.financialUploaded) return { financialFiles: filesNow }
          const ai = generateAiStage4()
          return {
            financialUploaded: true,
            financialFiles: filesNow,
            financialFileName: filesNow[0]?.name,
            stage4Marks: ai.marks,
            stage4Ai: ai.marks,
            stage4Reasons: ai.reasons,
            stage4AiReasons: ai.reasons,
            financialReuploadRequested: false,
          }
        })
        setProcessingId(null)
        setProcessingPhase(null)
        // Move the picker on to whoever is still outstanding.
        const next = active.find(b => !b.financialUploaded && String(b.id) !== String(bidderId))
        if (next) setSelectedIdRaw(String(next.id))
      }, 1100)
    }, 700)
  }

  const replaceFile = (bidderId, fileId, file) => {
    setProcessingId(bidderId)
    setProcessingPhase('upload')
    setTimeout(() => {
      patchBidder(bidderId, b => {
        const filesNow = financialFilesOf(b).map(f => (f.id === fileId ? toRecord(file) : f))
        return { financialFiles: filesNow, financialFileName: filesNow[0]?.name }
      })
      setProcessingId(null)
      setProcessingPhase(null)
    }, 700)
  }

  const writeMark = (bidderId, criterionId, value, reason) => {
    patchBidder(bidderId, b => ({
      stage4Marks: { financial: { ...(b.stage4Marks?.financial || {}), [criterionId]: value } },
      stage4Reasons: { financial: { ...(b.stage4Reasons?.financial || {}), [criterionId]: value === 'fail' ? reason : undefined } },
    }))
  }

  const setMark = (bidder, criterion, value) => {
    if (value === 'fail') {
      setReasonTarget({ bidderId: bidder.id, bidderName: bidder.name, criterionId: criterion.id, criterionLabel: criterion.item })
      return
    }
    writeMark(bidder.id, criterion.id, value)
  }

  const resetMark = (bidderId, criterionId) => {
    patchBidder(bidderId, b => {
      if (!b.stage4Ai) return {}
      const ai = b.stage4Ai.financial?.[criterionId]
      return {
        stage4Marks: { financial: { ...(b.stage4Marks?.financial || {}), [criterionId]: ai } },
        stage4Reasons: { financial: { ...(b.stage4Reasons?.financial || {}), [criterionId]: ai === 'fail' ? b.stage4AiReasons?.financial?.[criterionId] : undefined } },
      }
    })
  }

  const requestReupload = (bidderId) => patchBidder(bidderId, {
    financialUploaded: false,
    financialReuploadRequested: true,
    stage4Marks: { financial: {} },
    stage4Reasons: { financial: {} },
  })

  return (
    <>
      <StageHeading>Stage 4 - Financial Assessment</StageHeading>

      <div className="space-y-6 px-4 pt-5 pb-6 sm:px-6">
        {!isCE ? (
          <>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <FileText size={18} className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">With the Contract Engineer</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Financial assessment is the Contract Engineer&apos;s to run, criteria and all — uploading statements and
                  marking criteria are not yours to do, and the matrix stays hidden here until they&apos;re finished.
                </p>
              </div>
            </div>
            <AssignedTeamCard assignedCes={assignedCes} />
            <div className={cn('flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6', !isComplete && 'opacity-60')}>
              <UserCheck size={18} className={cn('mt-0.5 shrink-0', isComplete ? 'text-emerald-600' : 'text-slate-400')} aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Financial Assessment Complete</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isComplete
                    ? 'Every bidder has a verdict — check the matrix below, then use "Continue to Final Review" to move on.'
                    : 'Waiting on the Contract Engineer to finish every bidder’s criteria and verdict — "Continue to Final Review" stays disabled until then.'}
                </p>
              </div>
            </div>
            {isComplete && assessed.length > 0 ? (
              <FinancialMatrix tender={tender} bidders={assessed} canEdit={false} />
            ) : null}
          </>
        ) : (
          <>
            {active.length > 0 ? (
              <BidderFinancialUploadCard
                bidders={active}
                bidderId={selectedId}
                onSelectBidder={setSelectedIdRaw}
                busy={processingId != null}
                processingPhase={processingPhase}
                onSubmit={handleFiles}
                onReplace={replaceFile}
              />
            ) : (
              <PqqAlert tone="info" title="No shortlisted bidders">
                The confirmed shortlist from Stage 3 has no bidders to assess.
              </PqqAlert>
            )}

            {assessed.length > 0 && (
              <FinancialMatrix
                tender={tender}
                bidders={assessed}
                canEdit
                onSetMark={setMark}
                onReset={resetMark}
                onRequestReupload={requestReupload}
              />
            )}

            <div className={cn('rounded-2xl border border-slate-200 bg-white p-4 transition-opacity', !allAssessed && 'opacity-60')}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Award size={14} className="text-[var(--color-primary)]" /> Financial Assessment Complete</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {!allAssessed
                      ? "Upload every bidder's financial statement and mark all criteria before finalising."
                      : `${passers.length} of ${active.length} bidders passed the financial assessment. The Contract Holder decides the final shortlist from both results.`}
                  </p>
                </div>
                <Button disabled={!allAssessed || finalizing} onClick={() => { setFinalizing(true); onReturnToHolder() }}>
                  {finalizing ? 'Processing…' : 'Return to Contract Holder'}
                  {!finalizing && <ChevronRight size={14} />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {!isCE ? (
        <ShellFooter>
          {!isComplete ? <p className="text-xs text-slate-400">The Contract Engineer has not finished the financial assessment yet.</p> : null}
          <PqqButton variant="primary" disabled={!isComplete} onClick={onContinue}>
            Continue to Final Review <ArrowRight size={14} aria-hidden="true" />
          </PqqButton>
        </ShellFooter>
      ) : null}

      {reasonTarget ? (
        <ReasonDialog
          key={`${reasonTarget.bidderId}-${reasonTarget.criterionId}`}
          isOpen
          title={`Reason for marking "${reasonTarget.criterionLabel}" as Fail`}
          description={`This marks ${reasonTarget.bidderName}'s financial statements as "Fail" for this criterion.`}
          reasonLabel="Reason for this mark"
          reasonHint="Required — stored on the audit trail alongside the AI's own mark."
          confirmLabel="Save mark"
          maxLength={PQQ_LONG_TEXT_MAX_LENGTH}
          limitMessage={PQQ_TEXT_LIMIT_MESSAGE}
          onConfirm={reason => { writeMark(reasonTarget.bidderId, reasonTarget.criterionId, 'fail', reason); setReasonTarget(null) }}
          onClose={() => setReasonTarget(null)}
        />
      ) : null}
    </>
  )
}
