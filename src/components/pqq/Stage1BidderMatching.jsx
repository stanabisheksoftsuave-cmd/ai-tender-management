import { Fragment, useState } from 'react'
import { Bot, CheckCircle2, ChevronDown, CloudUpload, Search, Users } from 'lucide-react'
import AiAnalysisLoader from '../ui/AiAnalysisLoader'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { cn } from '../../utils/cn'
import { StageHeading, ShellFooter } from './PrequalShell'
import { ConfirmDialog, DeleteIconButton, PqqAlert, PqqButton, Pill } from './PqqUi'
import { parseBidderList } from './bidderListParser'
import {
  PQQ_SEARCH_LIMIT_MESSAGE, PQQ_SEARCH_MAX_LENGTH, buildRegistry, isAtTextLimit, matchRegistry,
  today, validateBidderListFile, validateSowFile,
} from './pqqModel'

const REGISTRY_SOURCE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'erp', label: 'ERP' },
  { key: 'jsrs', label: 'JSRS' },
]

const LIST_LIMITS = '.xlsx up to 20 MB, 5,000 rows'
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

function matchesRegistryFilter(match, source, query) {
  if (source === 'erp' && !match.sourceErp) return false
  if (source === 'jsrs' && !match.sourceJsrs) return false
  if (!query) return true
  return [match.name, match.category, match.country].some(v => (v || '').toLowerCase().includes(query))
}

function uploadWarning(upload) {
  if (upload.parseStatus === 'partial' && upload.unparsedRowCount > 0) {
    return `${upload.unparsedRowCount} row${upload.unparsedRowCount === 1 ? '' : 's'} could not be read and were skipped. The rest of the list imported normally.`
  }
  return null
}

// The verdict line shows; the evidence stays one click away ("Why?").
function splitRationale(rationale) {
  if (!rationale) return { verdict: '', detail: null }
  const separator = rationale.indexOf('—')
  if (separator === -1) return { verdict: rationale, detail: null }
  const verdict = rationale.slice(0, separator).trim()
  const detail = rationale.slice(separator + 1).trim()
  if (!verdict) return { verdict: rationale, detail: null }
  return { verdict, detail: detail || null }
}

function BidderRow({ match, checked, disabled, sourceFilter, onToggle }) {
  const inputId = `prequal-match-${match.id}`
  const rationaleId = `prequal-match-rationale-${match.id}`
  const [isRationaleOpen, setIsRationaleOpen] = useState(false)
  const { verdict, detail } = splitRationale((match.recommendationRationale || '').trim())

  return (
    <div className={cn('px-4 py-3 transition-colors', disabled ? 'opacity-60' : 'hover:bg-slate-50/60')}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle(match.id)}
          className={cn('mt-0.5 w-4 h-4 shrink-0 accent-[var(--color-primary)]', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className={cn('flex flex-wrap items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
            <span className="min-w-0 text-sm font-semibold break-words text-slate-800">{match.name}</span>
            {match.sourceErp && sourceFilter !== 'erp' ? <Pill tone="info">ERP</Pill> : null}
            {match.sourceJsrs && sourceFilter !== 'jsrs' ? <Pill tone="warning">JSRS</Pill> : null}
            {match.recommended ? (
              <Pill tone="success">AI Recommended{match.recommendationRank == null ? '' : ` #${match.recommendationRank}`}</Pill>
            ) : null}
          </label>
          {verdict ? (
            <div className="mt-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className={cn('min-w-0 text-xs text-slate-500', isRationaleOpen ? '' : 'line-clamp-1')}>{verdict}</p>
                {detail ? (
                  <button
                    type="button"
                    aria-expanded={isRationaleOpen}
                    aria-controls={rationaleId}
                    onClick={() => setIsRationaleOpen(open => !open)}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0089cf] hover:underline"
                  >
                    {isRationaleOpen ? 'Hide AI reasoning' : 'Why?'}
                    <ChevronDown size={12} aria-hidden="true" className={cn('transition-transform', isRationaleOpen && 'rotate-180')} />
                  </button>
                ) : null}
              </div>
              {detail && isRationaleOpen ? (
                <div id={rationaleId} className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <p className="text-xs leading-relaxed text-slate-500">{detail}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function UploadField({ label, uploadedName = null, required = false, limits, disabled, accept, validate, onChoose }) {
  const [selectedName, setSelectedName] = useState(null)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fieldId = `prequal-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const errorId = `${fieldId}-error`
  const name = selectedName ?? uploadedName
  const hasFile = name !== null && name !== undefined && name !== ''

  const take = (file) => {
    if (!file) return
    const message = validate?.(file) ?? null
    setSelectedName(file.name)
    setError(message)
    onChoose(message ? null : file, message !== null)
  }

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-1 text-xs">
        <label htmlFor={fieldId} className="font-medium text-slate-600">
          {label}{required ? <span className="sr-only"> (required)</span> : null}
        </label>
        {required ? <span className="text-red-500" aria-hidden="true">*</span> : null}
      </div>
      <label
        htmlFor={fieldId}
        title={limits}
        onDragOver={e => { if (disabled) return; e.preventDefault(); setIsDragging(true) }}
        onDragLeave={e => {
          if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return
          setIsDragging(false)
        }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); if (disabled) return; take(e.dataTransfer.files[0]) }}
        className={cn(
          'flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors',
          error ? 'border-red-300 bg-red-50/40' : hasFile ? 'border-emerald-300 bg-emerald-50/40' : 'border-[#0089cf]/25 bg-[#0089cf]/5',
          disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:border-solid',
          isDragging && 'border-solid ring-2 ring-[#0089cf]/40',
        )}
      >
        <span className={cn('mb-0.5 flex w-9 h-9 items-center justify-center rounded-full bg-white shadow-sm', error ? 'text-red-500' : hasFile ? 'text-emerald-600' : 'text-[#0089cf]')}>
          {hasFile && !error ? <CheckCircle2 size={18} aria-hidden="true" /> : <CloudUpload size={18} aria-hidden="true" />}
        </span>
        <span className="w-full truncate text-sm font-semibold text-slate-700">{hasFile ? name : label}</span>
        <span className="text-[11px] text-slate-400">
          {isDragging ? 'Drop to upload' : hasFile ? 'Drag and drop or click to replace' : `Drag and drop or click to browse${limits ? ` · ${limits}` : ''}`}
        </span>
        <input
          id={fieldId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={e => { take(e.currentTarget.files?.[0]); e.currentTarget.value = '' }}
        />
      </label>
      {error ? <p id={errorId} role="alert" className="mt-1 text-[11px] text-red-600">{error}</p> : null}
    </div>
  )
}

const STEP_LABEL = {
  sow: 'Uploading Statement of Work...',
  jsrs: 'Uploading JSRS bidder list...',
  erp: 'Uploading ERP bidder list...',
  analyse: 'Analysing the SOW and matching bidders...',
}
const STEP_PROGRESS = { sow: 15, jsrs: 35, erp: 55, analyse: 80 }
const BUTTON_LABEL = {
  sow: 'Uploading SOW...',
  jsrs: 'Uploading JSRS...',
  erp: 'Uploading ERP...',
  analyse: 'Analysing SOW & Matching Bidders...',
}

/*
 * Stage 1 — Bidder Matching (MAIN Stage1BidderMatching). The SOW and the
 * optional ERP/JSRS lists are read at analysis time; the registry the analysis
 * produces is persisted on the tender (pqMatches) together with each row's
 * selection, so a reload keeps the user's ticks.
 */
export function Stage1BidderMatching({ tender, isLocked, patch, onConfirmShortlist, footer }) {
  const [registrySearch, setRegistrySearch] = useState('')
  const [registrySource, setRegistrySource] = useState('all')
  const [pendingSowFile, setPendingSowFile] = useState(null)
  const [pendingJsrsFile, setPendingJsrsFile] = useState(null)
  const [pendingErpFile, setPendingErpFile] = useState(null)
  const [stagedRunId, setStagedRunId] = useState(0)
  const [step, setStep] = useState(null) // null | 'sow' | 'jsrs' | 'erp' | 'analyse'
  const [isConfirmingAnalysis, setIsConfirmingAnalysis] = useState(false)
  const [hasAnalysed, setHasAnalysed] = useState(false)
  const [recentUploads, setRecentUploads] = useState([])
  const [invalidUploads, setInvalidUploads] = useState(() => new Set())

  const isPreparingMatches = step !== null
  useAiLockWhile(isPreparingMatches, 'Analysing SOW & Matching Bidders')

  const markUpload = (field, invalid) => setInvalidUploads(prev => {
    const next = new Set(prev)
    if (invalid) next.add(field); else next.delete(field)
    return next
  })

  const uploads = (tender.pqUploads || []).filter(u => u.parseStatus !== 'failed')
  const storedListName = (type) => {
    const stored = uploads.find(u => u.documentType === type)
    if (stored) return stored.fileName || `${type.toUpperCase()} bidder list uploaded (${stored.rowCount} rows)`
    return (type === 'erp' ? tender.erpBidderListFile : tender.jsrsBidderListFile) || null
  }
  const hasStoredSow = Boolean(tender.sowFileName)

  const matches = Array.isArray(tender.pqMatches) && tender.pqMatches.length > 0
    ? tender.pqMatches
    : isLocked
      ? (tender.prequalBidders || []).map(b => ({ id: `m-${b.id}`, bidderId: b.id, name: b.name, country: b.country, category: b.category, sourceErp: b.sourceErp ?? true, sourceJsrs: !!b.sourceJsrs, recommended: false, recommendationRank: null, recommendationRationale: '', selected: true }))
      : []
  const selected = new Set(matches.filter(m => m.selected).map(m => m.id))

  const writeSelection = (nextIds) => {
    patch(t => ({ pqMatches: (t.pqMatches || []).map(m => ({ ...m, selected: nextIds.has(m.id) })) }))
  }

  const orderedMatches = [...matches].sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
    return (a.recommendationRank ?? Number.MAX_SAFE_INTEGER) - (b.recommendationRank ?? Number.MAX_SAFE_INTEGER)
  })
  const registryQuery = registrySearch.trim().toLowerCase()
  const visibleMatches = orderedMatches.filter(m => matchesRegistryFilter(m, registrySource, registryQuery))
  const visibleSelectedCount = visibleMatches.filter(m => selected.has(m.id)).length
  const allVisibleSelected = visibleMatches.length > 0 && visibleSelectedCount === visibleMatches.length
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected
  const recommendedIds = matches.filter(m => m.recommended).map(m => m.id)
  const allRecommendedSelected = recommendedIds.length > 0 && recommendedIds.every(id => selected.has(id))

  const toggleMatch = (matchId) => {
    const next = new Set(selected)
    if (next.has(matchId)) next.delete(matchId); else next.add(matchId)
    writeSelection(next)
  }

  const selectAllRecommended = () => {
    const next = new Set(selected)
    recommendedIds.forEach(id => next.add(id))
    writeSelection(next)
  }

  const toggleAllVisible = () => {
    const next = new Set(selected)
    visibleMatches.forEach(m => { if (allVisibleSelected) next.delete(m.id); else next.add(m.id) })
    writeSelection(next)
  }

  const removeUpload = (uploadId) => {
    const removed = (tender.pqUploads || []).find(u => u.uploadId === uploadId)
    patch(t => ({
      pqUploads: (t.pqUploads || []).filter(u => u.uploadId !== uploadId),
      ...(removed?.documentType === 'erp' ? { erpBidderListFile: '' } : {}),
      ...(removed?.documentType === 'jsrs' ? { jsrsBidderListFile: '' } : {}),
    }))
  }

  const runAnalysis = async () => {
    if (isPreparingMatches) return
    setRecentUploads([])
    const sowFile = pendingSowFile
    const jsrsFile = pendingJsrsFile
    const erpFile = pendingErpFile
    const fresh = []
    try {
      if (sowFile) { setStep('sow'); await wait(700) }
      if (jsrsFile) { setStep('jsrs'); fresh.push(await parseBidderList(jsrsFile, 'jsrs')); await wait(500) }
      if (erpFile) { setStep('erp'); fresh.push(await parseBidderList(erpFile, 'erp')); await wait(500) }
      setStep('analyse')
      await wait(1800)

      // A freshly uploaded list replaces the stored one of the same type; a
      // list that could not be read is reported and never stored.
      const freshOk = fresh.filter(u => u.parseStatus !== 'failed')
      const replacedTypes = new Set(freshOk.map(u => u.documentType))
      const nextUploads = [
        ...(tender.pqUploads || []).filter(u => u.parseStatus !== 'failed' && !replacedTypes.has(u.documentType)),
        ...freshOk,
      ]
      const sowFileName = sowFile ? sowFile.name : tender.sowFileName
      const { category, matches: nextMatches } = matchRegistry({ ...tender, sowFileName }, buildRegistry(nextUploads))
      patch({
        pqMatches: nextMatches,
        pqUploads: nextUploads,
        pqMatchRunAt: today(),
        sowFileName,
        erpBidderListFile: nextUploads.find(u => u.documentType === 'erp')?.fileName || '',
        jsrsBidderListFile: nextUploads.find(u => u.documentType === 'jsrs')?.fileName || '',
        workCategory: category,
      })
      setRecentUploads(fresh)
      setHasAnalysed(true)
    } finally {
      setStep(null)
      setPendingSowFile(null)
      setPendingJsrsFile(null)
      setPendingErpFile(null)
      setInvalidUploads(new Set())
      setStagedRunId(n => n + 1)
    }
  }

  const analyseDisabled = isLocked || (!pendingSowFile && !hasStoredSow) || invalidUploads.size > 0

  return (
    <>
      <StageHeading>Stage 1 - Bidder Matching</StageHeading>

      <div className="space-y-6 px-4 pt-5 pb-6 sm:px-6">
        {isLocked ? <PqqAlert tone="success">The shortlist is confirmed and Stage 1 is locked.</PqqAlert> : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <UploadField
            key={`sow-${stagedRunId}`}
            label="Statement of Work (SOW)"
            uploadedName={tender.sowFileName || null}
            required
            validate={validateSowFile}
            disabled={isLocked || isPreparingMatches}
            onChoose={(file, invalid) => { setPendingSowFile(file); markUpload('sow', invalid) }}
          />
          <UploadField
            key={`erp-${stagedRunId}`}
            label="ERP Bidder List"
            uploadedName={storedListName('erp')}
            validate={validateBidderListFile}
            limits={LIST_LIMITS}
            accept=".xlsx"
            disabled={isLocked || isPreparingMatches}
            onChoose={(file, invalid) => { setPendingErpFile(file); markUpload('erp', invalid) }}
          />
          <UploadField
            key={`jsrs-${stagedRunId}`}
            label="JSRS Bidder List"
            uploadedName={storedListName('jsrs')}
            validate={validateBidderListFile}
            limits={LIST_LIMITS}
            accept=".xlsx"
            disabled={isLocked || isPreparingMatches}
            onChoose={(file, invalid) => { setPendingJsrsFile(file); markUpload('jsrs', invalid) }}
          />
        </div>

        <p className="-mt-3 text-xs text-slate-500">
          Upload an ERP or JSRS bidder list to match against it — without one, the ERP bidder registry on file is used.
        </p>

        {recentUploads.map(upload => {
          const warning = uploadWarning(upload)
          return (
            <Fragment key={upload.uploadId}>
              {upload.parseStatus === 'failed' ? (
                <PqqAlert tone="danger">{`Could not read this file: ${upload.parseError || 'The bidder list could not be parsed.'}`}</PqqAlert>
              ) : warning ? (
                <PqqAlert tone="warning" title="Imported with skipped rows">{warning}</PqqAlert>
              ) : (
                <PqqAlert tone="success">
                  {`Imported ${upload.rowCount} rows — ${upload.newBidders} new bidders, ${upload.matchedBidders} matched to the registry.`}
                </PqqAlert>
              )}
            </Fragment>
          )
        })}

        {uploads.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded files</h3>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {uploads.map(upload => (
                <li key={upload.uploadId} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-sm text-slate-700">
                    {upload.documentType.toUpperCase()} — {upload.rowCount} rows
                  </span>
                  <DeleteIconButton
                    label={`Delete ${upload.documentType.toUpperCase()} upload`}
                    disabled={isLocked || isPreparingMatches}
                    onClick={() => removeUpload(upload.uploadId)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <PqqButton
          variant="primary"
          className="px-5 py-2.5 text-sm"
          disabled={analyseDisabled || isPreparingMatches}
          title={invalidUploads.size > 0
            ? 'Fix the highlighted upload first'
            : !pendingSowFile && !hasStoredSow ? 'Upload the Statement of Work first' : undefined}
          onClick={() => setIsConfirmingAnalysis(true)}
        >
          <Bot size={16} aria-hidden="true" />
          {step ? BUTTON_LABEL[step] : 'Analyse SOW & Match Bidders'}
        </PqqButton>

        <ConfirmDialog
          isOpen={isConfirmingAnalysis}
          icon={Bot}
          title="Run AI bidder matching?"
          description="The AI will analyse the Statement of Work and match it against the ERP & JSRS bidder registry to recommend a shortlist. This can take a few minutes, and the other pre-qualification steps stay locked until it finishes."
          confirmLabel="Run analysis"
          onConfirm={() => { setIsConfirmingAnalysis(false); runAnalysis() }}
          onClose={() => setIsConfirmingAnalysis(false)}
        />

        {matches.length > 0 || isPreparingMatches || hasAnalysed ? (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="space-y-3 border-b border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Users size={14} className="text-[var(--color-primary)]" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-slate-800">ERP &amp; JSRS Bidder Registry</h3>
                  <Pill tone="neutral" className="normal-case tracking-normal font-semibold">{`${selected.size} of ${matches.length} selected`}</Pill>
                  {recommendedIds.length > 0 && !isPreparingMatches ? (
                    <PqqButton
                      variant="outline"
                      className="ml-auto"
                      disabled={isLocked || allRecommendedSelected}
                      onClick={selectAllRecommended}
                    >
                      {allRecommendedSelected ? 'All recommended selected' : `Select all recommended (${recommendedIds.length})`}
                    </PqqButton>
                  ) : null}
                </div>

                {matches.length > 0 && !isPreparingMatches ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
                      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        type="text"
                        value={registrySearch}
                        onChange={e => setRegistrySearch(e.target.value)}
                        placeholder="Search bidders or category..."
                        maxLength={PQQ_SEARCH_MAX_LENGTH}
                        aria-label="Search bidders"
                        className="olng-input h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                      />
                      {isAtTextLimit(registrySearch, PQQ_SEARCH_MAX_LENGTH) ? (
                        <p className="mt-1 text-[11px] text-red-600">{PQQ_SEARCH_LIMIT_MESSAGE}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      {REGISTRY_SOURCE_FILTERS.map(filter => (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setRegistrySource(filter.key)}
                          aria-pressed={registrySource === filter.key}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                            registrySource === filter.key
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-[var(--color-primary)]/50 hover:text-slate-700',
                          )}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {isPreparingMatches ? (
                <div className="p-4 sm:p-6">
                  <AiAnalysisLoader
                    title="Analysing SOW & Matching Bidders"
                    description="Matching the ERP & JSRS bidder registry against this tender's scope of work."
                    progress={STEP_PROGRESS[step] ?? 10}
                    steps={[{ id: '1', label: STEP_LABEL[step], status: 'active' }]}
                  />
                </div>
              ) : matches.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  No bidders yet. Upload the Statement of Work, then run the analysis to match the registry against this tender.
                </p>
              ) : visibleMatches.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No bidders match this filter.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  <label
                    htmlFor="prequal-select-all"
                    className={cn('flex items-center gap-3 bg-slate-50/70 px-4 py-2 text-xs font-semibold text-slate-700', isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}
                  >
                    <input
                      id="prequal-select-all"
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={el => { if (el) el.indeterminate = someVisibleSelected }}
                      disabled={isLocked}
                      onChange={toggleAllVisible}
                      className="w-4 h-4 shrink-0 accent-[var(--color-primary)]"
                    />
                    {registrySource === 'all' && !registryQuery
                      ? `Select all (${visibleMatches.length})`
                      : `Select all shown (${visibleMatches.length})`}
                  </label>
                  {visibleMatches.map(match => (
                    <BidderRow
                      key={match.id}
                      match={match}
                      checked={selected.has(match.id)}
                      disabled={isLocked}
                      sourceFilter={registrySource}
                      onToggle={toggleMatch}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isLocked ? (
              <div className="flex justify-end">
                <PqqButton
                  variant="primary"
                  disabled={isPreparingMatches || selected.size === 0}
                  onClick={onConfirmShortlist}
                >
                  {`Confirm Shortlist (${selected.size})`}
                </PqqButton>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {footer ? <ShellFooter>{footer}</ShellFooter> : null}
    </>
  )
}
