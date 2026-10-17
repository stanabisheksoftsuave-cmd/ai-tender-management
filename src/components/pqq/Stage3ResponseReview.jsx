import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Ban, CloudUpload, FileText, Loader2, RefreshCw, RotateCcw, Search, Send, UserCheck, UserPlus } from 'lucide-react'
import SearchableSelect from '../ui/SearchableSelect'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { useDismissable } from '../../context/NavigationContext'
import { exportTechnicalFailReasonPdf } from '../../utils/pqqExports'
import { cn } from '../../utils/cn'
import { StageHeading, ShellFooter } from './PrequalShell'
import { CriteriaMatrix } from './CriteriaMatrix'
import {
  ConfirmDialog, DeleteIconButton, FileDropZone, PqqAlert, PqqButton, PqqEvaluationBlocker, Pill,
} from './PqqUi'
import { patchBidderIn } from './useTenderPatcher'
import {
  MAX_UPLOAD_BATCH_SIZE, MAX_UPLOAD_FILE_COUNT, MAX_UPLOAD_FILE_SIZE, PQQ_SEARCH_LIMIT_MESSAGE,
  PQQ_SEARCH_MAX_LENGTH, SHEETS, bidderRowFromMatch, capStagedFiles, describeSkippedFiles,
  docsOf, droppedReasonLabel, findOversizedFile, formatFileSize, generateAiStage3, hasAnyStage3Mark,
  isAtTextLimit, tenderMatches, totalFileSize,
} from './pqqModel'

const RESET_RATIONALE = 'Reset to the AI mark.'

function AddBidderControl({ tender, onAdd, disabled }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef(null)
  useDismissable(open, () => setOpen(false))
  useEffect(() => {
    if (!open) return undefined
    const onDown = e => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const inRun = new Set((tender.prequalBidders || []).map(b => String(b.id)))
  const candidates = tenderMatches(tender).filter(m => !inRun.has(String(m.bidderId)))
  if (candidates.length === 0) return null
  const q = search.trim().toLowerCase()
  const filtered = q
    ? candidates.filter(m => [m.name, m.category, m.country].some(v => (v || '').toLowerCase().includes(q)))
    : candidates

  return (
    <div ref={rootRef} className="relative">
      <PqqButton variant="outline" disabled={disabled} onClick={() => { setOpen(o => !o); setSearch('') }}>
        <UserPlus size={13} aria-hidden="true" /> Add Bidders
      </PqqButton>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bidders..."
                maxLength={PQQ_SEARCH_MAX_LENGTH}
                aria-label="Search bidders"
                className="olng-input h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs focus:outline-none"
              />
            </div>
            {isAtTextLimit(search, PQQ_SEARCH_MAX_LENGTH) ? <p className="mt-1 text-[11px] text-red-600">{PQQ_SEARCH_LIMIT_MESSAGE}</p> : null}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-slate-400">No matching bidders</p>
            ) : filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setOpen(false); onAdd(m) }}
                className="flex w-full flex-col rounded-lg px-2 py-2 text-left hover:bg-slate-50"
              >
                <span className="truncate text-xs font-semibold text-slate-700">{m.name}</span>
                <span className="truncate text-[10px] text-slate-400">{[m.country, m.category].filter(Boolean).join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReplaceDocumentInput({ docId, disabled, isLoading, onChoose, onReject }) {
  const [selectedName, setSelectedName] = useState(null)
  const id = `prequal-replace-${docId}`
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex h-8 max-w-[120px] shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition sm:max-w-[200px]',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#0089cf]/50 hover:text-[#0089cf]',
      )}
    >
      {isLoading
        ? <Loader2 size={12} className="animate-spin text-[#0089cf]" aria-hidden="true" />
        : <RefreshCw size={12} className="text-slate-400 group-hover:text-[#0089cf]" aria-hidden="true" />}
      <span className="truncate">{selectedName ?? 'Replace'}</span>
      <input
        id={id}
        type="file"
        className="sr-only"
        disabled={disabled}
        onChange={e => {
          const file = e.currentTarget.files?.[0]
          if (file) {
            if (file.size > MAX_UPLOAD_FILE_SIZE) onReject(`File ${file.name} exceeds the 512 MB limit.`)
            else { setSelectedName(file.name); onChoose(file) }
          }
          e.currentTarget.value = ''
        }}
      />
    </label>
  )
}

function BidderDocumentsCard({
  bidder, bidderOptions, onSelectBidder, onMarkNotParticipating, isEvaluating, isUploading,
  onUpload, onReplace, replacingDocId,
}) {
  const [pendingFiles, setPendingFiles] = useState([])
  const [validationError, setValidationError] = useState(null)
  const [reuploadNote, setReuploadNote] = useState(null)
  const [confirmDrop, setConfirmDrop] = useState(false)
  const [batch, setBatch] = useState([])
  const documents = docsOf(bidder)

  const stageFiles = (files) => {
    const { files: staged, skipped } = capStagedFiles(pendingFiles, files)
    setValidationError(skipped > 0 ? describeSkippedFiles(skipped) : null)
    setPendingFiles(staged)
  }

  const submitPending = async () => {
    setValidationError(null)
    if (pendingFiles.length === 0) return
    if (pendingFiles.length > MAX_UPLOAD_FILE_COUNT) {
      setValidationError(describeSkippedFiles(pendingFiles.length - MAX_UPLOAD_FILE_COUNT))
      return
    }
    const oversized = findOversizedFile(pendingFiles)
    if (oversized) { setValidationError(`File ${oversized.name} exceeds the 512 MB limit.`); return }
    if (totalFileSize(pendingFiles) > MAX_UPLOAD_BATCH_SIZE) { setValidationError('Total upload size exceeds the 1 GB limit.'); return }
    setReuploadNote(null)
    const uploaded = await onUpload(bidder.id, pendingFiles)
    setBatch(uploaded)
    setPendingFiles([])
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-lg bg-[#0089cf]/10 text-[#0089cf]" aria-hidden="true">
          <CloudUpload size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">Upload Bidder Response</h3>
          <p className="text-xs text-slate-500">Choose a bidder, then add their response documents.</p>
        </div>
      </div>

      <div className="mb-1 text-xs font-semibold text-slate-700">Bidder</div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <SearchableSelect
            value={String(bidder.id)}
            onChange={v => onSelectBidder(String(v))}
            options={bidderOptions}
            getValue={o => String(o.id)}
            getLabel={o => o.name}
            getSubLabel={o => `${docsOf(o).length > 0 ? `${docsOf(o).length} document${docsOf(o).length === 1 ? '' : 's'}` : 'No response yet'}${o.country ? ` · ${o.country}` : ''}`}
            disabled={isUploading || isEvaluating}
            placeholder="Select bidder…"
            searchPlaceholder="Search bidders…"
            emptyText="No matching bidders"
            ariaLabel="Select bidder"
          />
        </div>
        <PqqButton
          variant="secondary"
          className="hover:border-red-300 hover:text-red-600"
          disabled={isEvaluating || isUploading}
          onClick={() => setConfirmDrop(true)}
        >
          <Ban size={13} aria-hidden="true" /> Mark as Not Participating
        </PqqButton>
      </div>
      <p className="mt-2 mb-4 text-xs text-slate-500">
        If a bidder does not submit a response, mark them as Not Participating to remove them from evaluation.
      </p>

      <FileDropZone
        id={`prequal-upload-${bidder.id}`}
        label="Upload Response"
        title="Drag and drop the bidder's response documents here"
        hint={`Up to ${MAX_UPLOAD_FILE_COUNT} files · 512 MB per file · 1 GB per upload`}
        disabled={isUploading || isEvaluating}
        onChoose={stageFiles}
      />

      <ConfirmDialog
        isOpen={confirmDrop}
        title={`Mark "${bidder.name}" as Not Participating?`}
        description="They did not submit a response and will be excluded from this pre-qualification. You can restore them later."
        confirmLabel="Confirm"
        confirmVariant="danger"
        onConfirm={() => { setConfirmDrop(false); onMarkNotParticipating(bidder.id) }}
        onClose={() => setConfirmDrop(false)}
      />

      {pendingFiles.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready to upload</h4>
            <span className="rounded-full bg-[#0089cf]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0089cf]">{pendingFiles.length}</span>
          </div>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-md bg-[#0089cf]/10 text-[#0089cf]" aria-hidden="true"><FileText size={16} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-700">{file.name}</span>
                    <span className="block text-xs text-slate-400">{formatFileSize(file.size)}</span>
                  </span>
                </span>
                <DeleteIconButton
                  label={`Delete ${file.name}`}
                  disabled={isUploading}
                  onClick={() => { setValidationError(null); setPendingFiles(prev => prev.filter((_, i) => i !== index)) }}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <PqqButton variant="primary" disabled={isEvaluating || isUploading} onClick={submitPending}>
              {isUploading ? 'Uploading…' : 'Submit'}
            </PqqButton>
          </div>
        </div>
      ) : null}

      {validationError ? <PqqAlert tone="danger" className="mt-4">{validationError}</PqqAlert> : null}
      {reuploadNote ? <PqqAlert tone="success" className="mt-4">{reuploadNote}</PqqAlert> : null}

      {batch.length > 0 ? (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Last upload</h4>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {batch.map(doc => (
              <li key={doc.id} className="px-3 py-2">
                <span className="min-w-0 truncate text-sm text-slate-700">{doc.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="mb-2 flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded so far</h4>
          {documents.length > 0 ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{documents.length}</span>
          ) : null}
        </div>
        {documents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
            No response documents uploaded yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {documents.map(doc => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50/60">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-md bg-[#0089cf]/10 text-[#0089cf]" aria-hidden="true"><FileText size={16} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-700">{doc.name}</span>
                    {doc.pageCount == null ? null : (
                      <span className="block text-xs text-slate-400">{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                    )}
                  </span>
                </span>
                <ReplaceDocumentInput
                  docId={doc.id}
                  disabled={isUploading || isEvaluating || replacingDocId !== null}
                  isLoading={replacingDocId === doc.id}
                  onReject={setValidationError}
                  onChoose={async file => {
                    setValidationError(null)
                    setReuploadNote(null)
                    await onReplace(bidder.id, doc.id, file, 'card')
                    setReuploadNote(`${file.name} replaced the previous document. When you submit this stage, answers will be re-evaluated against the new document.`)
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

/*
 * Stage 3 — Response Review (MAIN Stage3ResponseReview), done on the tender:
 * distribute, per-bidder response documents, Not Participating / Restore, the
 * financial-assessment switch (showing the CE assigned on the CIF), the AI
 * criteria matrix with reasoned overrides, Save to Draft and Submit Stage 3.
 *
 * `isReadOnly` is the look-back view once Stage 3 has been submitted.
 */
export function Stage3ResponseReview({ tender, patch, assignedCes, userName, isReadOnly, onSubmit, onContinue, continueLabel }) {
  const [selectedBidderId, setSelectedBidderId] = useState(null)
  const [evalPhase, setEvalPhase] = useState(null) // null | 'running' | 'done'
  const [isUploading, setIsUploading] = useState(false)
  const [replacingDocId, setReplacingDocId] = useState(null)
  const [recentlyReuploaded, setRecentlyReuploaded] = useState(() => new Set())
  const [notice, setNotice] = useState(null)
  const [evalProgress, setEvalProgress] = useState(10)

  const isEvaluating = evalPhase !== null
  useAiLockWhile(isEvaluating, 'Evaluating every bidder with AI')

  const all = tender.prequalBidders || []
  const inReview = all.filter(b => !b.droppedAt)
  const notInReview = all.filter(b => b.droppedAt)
  const distributed = Boolean(tender.pqDistributedAt) || all.some(b => b.responseUploaded || b.droppedAt || hasAnyStage3Mark(b))
  const activeBidder = inReview.find(b => String(b.id) === String(selectedBidderId)) || inReview[0] || null
  const withDocuments = inReview.filter(b => docsOf(b).length > 0)
  const evidenceReadiness = inReview.some(b => docsOf(b).length === 0) ? 'missing' : 'ready'
  const hasEverEvaluated = all.some(b => b.stage3Ai && SHEETS.some(s => Object.keys(b.stage3Ai[s.key] || {}).length > 0))
  const financialRequired = tender.financialAssessmentRequired ?? true
  const everyBidderEvaluated = inReview.length > 0 && inReview.every(hasAnyStage3Mark)
  const canSubmit = everyBidderEvaluated && (!financialRequired || assignedCes.length > 0)
  const assignedLabel = assignedCes.map(u => u.name).filter(Boolean).join(', ')
  const nextStage = financialRequired ? 'prequal_stage4' : 'prequal_final_review'
  const showNotice = (tone, message) => setNotice({ tone, message })

  const patchBidder = (bidderId, fn) => patch(t => ({ prequalBidders: patchBidderIn(t.prequalBidders, bidderId, fn) }))

  const advanceToNextBidderWithoutDocuments = (uploadedId) => {
    const roster = inReview
    const from = roster.findIndex(b => String(b.id) === String(uploadedId))
    if (from === -1) return
    for (let step = 1; step < roster.length; step++) {
      const candidate = roster[(from + step) % roster.length]
      if (candidate && String(candidate.id) !== String(uploadedId) && docsOf(candidate).length === 0) {
        setSelectedBidderId(String(candidate.id))
        return
      }
    }
  }

  const uploadDocuments = async (bidderId, files) => {
    setIsUploading(true)
    try {
      await wait(900)
      const stamp = new Date().toISOString()
      const docs = files.map((f, i) => ({
        id: `doc-${bidderId}-${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        pageCount: Math.max(1, Math.round(f.size / 60000)),
        uploadedAt: stamp,
      }))
      patchBidder(bidderId, b => {
        const nextDocs = [...docsOf(b).map(d => (String(d.id).startsWith('legacy-') ? { ...d, id: `doc-${bidderId}-legacy` } : d)), ...docs]
        return { pqDocuments: nextDocs, responseUploaded: true, responseFileName: nextDocs[0]?.name, reuploadRequested: false }
      })
      advanceToNextBidderWithoutDocuments(bidderId)
      return docs
    } finally {
      setIsUploading(false)
    }
  }

  const replaceDocument = async (bidderId, docId, file, origin) => {
    setReplacingDocId(docId)
    try {
      await wait(700)
      patchBidder(bidderId, b => {
        const nextDocs = docsOf(b).map(d => (d.id === docId
          ? { ...d, id: String(d.id).startsWith('legacy-') ? `doc-${bidderId}-${Date.now()}` : d.id, name: file.name, size: file.size, pageCount: Math.max(1, Math.round(file.size / 60000)), replacedAt: new Date().toISOString() }
          : d))
        return { pqDocuments: nextDocs, responseUploaded: true, responseFileName: nextDocs[0]?.name }
      })
      setRecentlyReuploaded(prev => new Set(prev).add(String(bidderId)))
      if (origin === 'matrix') showNotice('info', `${file.name} replaced the previous document. Run Evaluate with AI to re-check the answers against it.`)
    } finally {
      setReplacingDocId(null)
    }
  }

  const markNotParticipating = (bidderId) => {
    patchBidder(bidderId, { droppedAt: 'no_response', reuploadRequested: false })
    if (String(selectedBidderId) === String(bidderId)) setSelectedBidderId(null)
  }

  const restoreBidder = (bidderId) => patchBidder(bidderId, { droppedAt: undefined, pqExcludeRationale: undefined })

  const addBidder = (match) => {
    patch(t => ({ prequalBidders: [...(t.prequalBidders || []), bidderRowFromMatch(match)] }))
  }

  const evaluateAll = () => {
    setNotice(null)
    setEvalPhase('running')
    setEvalProgress(10)
    const ticks = [35, 60, 85]
    ticks.forEach((p, i) => setTimeout(() => setEvalProgress(p), 800 * (i + 1)))
    setTimeout(() => {
      patch(t => ({
        prequalBidders: (t.prequalBidders || []).map(b => {
          if (b.droppedAt || docsOf(b).length === 0) return b
          const { marks, reasons } = generateAiStage3({ ...b, pqDocuments: docsOf(b) })
          const failReasons = Object.fromEntries(SHEETS.map(s => [
            s.key,
            Object.fromEntries(Object.entries(marks[s.key]).filter(([, v]) => v === 'fail').map(([cid]) => [cid, reasons[s.key][cid]])),
          ]))
          return {
            ...b,
            stage3: marks,
            stage3Ai: marks,
            stage3AiReasons: reasons,
            stage3Reasons: failReasons,
            stage3Overrides: {},
            pqEvaluatedAt: new Date().toISOString(),
          }
        }),
      }))
      setRecentlyReuploaded(new Set())
      setEvalPhase('done')
      setTimeout(() => setEvalPhase(null), 700)
    }, 3400)
  }

  const saveMark = (bidderId, sheetKey, criterionId, value, rationale) => {
    patchBidder(bidderId, b => {
      const ai = b.stage3Ai?.[sheetKey]?.[criterionId] ?? null
      const overrides = { ...(b.stage3Overrides || {}), [sheetKey]: { ...(b.stage3Overrides?.[sheetKey] || {}) } }
      if (rationale === RESET_RATIONALE || (value === ai && value === 'pass')) delete overrides[sheetKey][criterionId]
      else overrides[sheetKey][criterionId] = { value, rationale, by: userName, at: new Date().toISOString() }
      const reasons = { ...(b.stage3Reasons || {}), [sheetKey]: { ...(b.stage3Reasons?.[sheetKey] || {}) } }
      if (value === 'fail') reasons[sheetKey][criterionId] = overrides[sheetKey][criterionId]?.rationale ?? b.stage3AiReasons?.[sheetKey]?.[criterionId] ?? ''
      else delete reasons[sheetKey][criterionId]
      return {
        stage3: { ...(b.stage3 || {}), [sheetKey]: { ...(b.stage3?.[sheetKey] || {}), [criterionId]: value } },
        stage3Overrides: overrides,
        stage3Reasons: reasons,
      }
    })
  }

  const saveToDraft = () => {
    patch({ pqStage3DraftSavedAt: new Date().toISOString() })
    showNotice('success', 'Draft saved. This Pre-Qualification will reopen on Response Review.')
  }

  const busy = isUploading || isEvaluating || replacingDocId !== null

  return (
    <>
      {isEvaluating ? (
        <PqqEvaluationBlocker
          title="Evaluating every bidder with AI"
          description="Marking each bidder's response documents against the pre-qualification criteria."
          stepLabel="Evaluating the bidders' responses..."
          helperText="This can take a few minutes on a large roster. Keep this page open. The other pre-qualification steps stay locked until it finishes."
          progress={evalProgress}
          isComplete={evalPhase === 'done'}
        />
      ) : null}

      <StageHeading
        action={!isReadOnly ? <AddBidderControl tender={tender} onAdd={addBidder} disabled={busy} /> : null}
      >
        Stage 3 - Response Review
      </StageHeading>

      <div className="space-y-6 px-4 pt-5 pb-6 sm:px-6" inert={isEvaluating || undefined}>
        {isReadOnly ? (
          <PqqAlert tone="info">Stage 3 has been submitted — this is a read-only view of the response review.</PqqAlert>
        ) : null}

        {!distributed && !isReadOnly ? (
          <div className="flex flex-wrap items-center gap-3">
            <PqqButton variant="primary" onClick={() => patch({ pqDistributedAt: new Date().toISOString() })}>
              <Send size={14} aria-hidden="true" /> Distribute to Bidders
            </PqqButton>
            <span className="text-sm text-slate-500">No responses are being reviewed yet.</span>
          </div>
        ) : null}

        <div className={cn('overflow-hidden rounded-xl border transition-colors', financialRequired ? 'border-[#0089cf]/30 bg-[#0089cf]/[0.03]' : 'border-slate-200 bg-white')}>
          <label htmlFor="prequal-financial-required" className={cn('flex items-start gap-3 px-4 py-3.5', isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer')}>
            <input
              id="prequal-financial-required"
              type="checkbox"
              checked={financialRequired}
              disabled={isReadOnly || isEvaluating}
              onChange={e => patch({ financialAssessmentRequired: e.target.checked })}
              className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--color-primary)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">Financial assessment required</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {financialRequired ? 'A Contract Engineer runs the financial stage after Stage 3.' : 'Stage 3 goes straight to Final Review.'}
              </span>
            </span>
          </label>
          {financialRequired ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#0089cf]/20 bg-white px-4 py-3">
              <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-[#0089cf]/10 text-[#0089cf]" aria-hidden="true">
                <UserCheck size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Team</span>
                <span className="block text-[11px] text-slate-400">Runs the financial assessment</span>
              </span>
              {assignedLabel ? (
                <span className="ml-auto inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-3 pl-1">
                  <span className="flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-[#0089cf] text-[11px] font-bold text-white" aria-hidden="true">
                    {assignedLabel.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 text-sm font-semibold break-words text-slate-700">{assignedLabel}</span>
                </span>
              ) : (
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Not assigned on the CIF
                </span>
              )}
            </div>
          ) : null}
        </div>

        {financialRequired ? (
          <PqqAlert tone="info">
            This tender includes a financial assessment. It runs in the Contract Engineer&apos;s own stage — their verdict
            is not reported here, and the pass/fail beside each bidder above is this stage&apos;s alone.
          </PqqAlert>
        ) : null}

        {notice ? <PqqAlert tone={notice.tone}>{notice.message}</PqqAlert> : null}

        {distributed && !isReadOnly && activeBidder ? (
          <BidderDocumentsCard
            key={`documents-${activeBidder.id}`}
            bidder={activeBidder}
            bidderOptions={inReview}
            onSelectBidder={setSelectedBidderId}
            onMarkNotParticipating={markNotParticipating}
            isEvaluating={isEvaluating}
            isUploading={isUploading}
            onUpload={uploadDocuments}
            onReplace={replaceDocument}
            replacingDocId={replacingDocId}
          />
        ) : null}

        {distributed && notInReview.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="mb-2 flex items-center gap-2">
              <Ban size={16} className="text-slate-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-800">Did Not Participate</h3>
              <Pill tone="neutral">{notInReview.length}</Pill>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Removed for not submitting a response — excluded from evaluation. Restore if a response is received later.
            </p>
            <ul className="space-y-3">
              {notInReview.map(b => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold break-words text-slate-500 line-through">{b.name}</span>
                    <span className="text-xs text-slate-400">{droppedReasonLabel(b.droppedAt)}</span>
                  </div>
                  {!isReadOnly ? (
                    <PqqButton variant="outline" disabled={busy} onClick={() => restoreBidder(b.id)}>
                      <RotateCcw size={13} aria-hidden="true" /> Restore
                    </PqqButton>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {withDocuments.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <CriteriaMatrix
              bidders={withDocuments}
              sheets={SHEETS}
              canEdit={!isReadOnly}
              isEvaluating={isEvaluating}
              hasEverEvaluated={hasEverEvaluated}
              evidenceReadiness={evidenceReadiness}
              recentlyReuploaded={recentlyReuploaded}
              isUploadInProgress={isUploading || replacingDocId !== null}
              onEvaluateAll={evaluateAll}
              onSaveMark={saveMark}
              onReplaceDocument={replaceDocument}
              onNotice={showNotice}
              onExportReason={b => exportTechnicalFailReasonPdf(tender, b)}
            />
          </div>
        ) : null}
      </div>

      <ShellFooter>
        {isReadOnly ? (
          <PqqButton variant="primary" onClick={onContinue}>
            {continueLabel}
            <ArrowRight size={14} aria-hidden="true" />
          </PqqButton>
        ) : (
          <>
            {!canSubmit ? (
              <p className="mr-auto text-xs text-slate-400">
                {!everyBidderEvaluated
                  ? 'Upload every bidder\'s response and run the AI evaluation before submitting.'
                  : 'No Contract Engineer is assigned on the CIF for the financial assessment.'}
              </p>
            ) : null}
            <PqqButton variant="secondary" disabled={busy} onClick={saveToDraft}>Save to Draft</PqqButton>
            <PqqButton variant="primary" disabled={!canSubmit || busy} onClick={() => onSubmit(nextStage)}>
              Submit Stage 3
            </PqqButton>
          </>
        )}
      </ShellFooter>
    </>
  )
}
