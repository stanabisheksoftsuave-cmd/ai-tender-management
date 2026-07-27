// Lightweight client-side "document" generator. Builds a self-contained, styled
// HTML page and opens it in a new browser tab (via a blob URL). Used for the
// evaluation rationale / fail-reasoning documents and the bidder rejection
// letters — no backend, no dependencies.

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const SHELL_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #eef4fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2d3d; }
  .page { max-width: 800px; margin: 32px auto; background: #fff; border: 1px solid #d8e6f5; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 40px rgba(16,42,72,.10); }
  .bar { height: 6px; background: linear-gradient(90deg, #1b4c6f, #0089cf); }
  .head { padding: 26px 34px 18px; border-bottom: 1px solid #eef2f7; }
  .brand { display: flex; align-items: center; gap: 10px; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #0089cf; font-weight: 700; }
  h1 { font-size: 21px; margin: 12px 0 4px; color: #1b4c6f; }
  .sub { font-size: 13px; color: #64748b; }
  .body { padding: 24px 34px 34px; font-size: 14px; line-height: 1.65; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f6faff; border: 1px solid #e5eefb; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; }
  .meta div { font-size: 12.5px; }
  .meta b { color: #475569; font-weight: 600; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .badge.green { background: #dcfce7; color: #15803d; }
  .badge.amber { background: #fef3c7; color: #b45309; }
  .badge.red { background: #fee2e2; color: #b91c1c; }
  .badge.blue { background: #dbeafe; color: #1d4ed8; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin: 22px 0 8px; }
  ul { margin: 8px 0; padding-left: 20px; }
  li { margin: 4px 0; }
  .evidence { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; padding: 6px 16px; }
  .quote { border-left: 3px solid #0089cf; background: #f6faff; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 12px 0; }
  .foot { margin-top: 28px; padding-top: 16px; border-top: 1px solid #eef2f7; font-size: 11.5px; color: #94a3b8; }
  .sign { margin-top: 26px; font-size: 13.5px; }
  @media print { body { background: #fff; } .page { box-shadow: none; border: none; margin: 0; } }
`

// Opens a self-contained document in a new tab. `title` sets the tab/heading,
// `contentHtml` is the pre-built inner markup (already escaped where needed).
export function openHtmlDoc(title, contentHtml) {
  const html =
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${esc(title)}</title><style>${SHELL_CSS}</style></head>` +
    `<body><div class="page"><div class="bar"></div>${contentHtml}</div></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener')
  // Give the tab time to load before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return win
}

// ── Score narrative by band (0–3) ────────────────────────────────────────────
const SCORE_NARRATIVE = {
  3: 'The submission demonstrates a comprehensive and fully compliant response. The bidder shows a clear, detailed understanding of the requirement with credible supporting evidence, exceeding the minimum expectation for this criterion.',
  2: 'The submission is competent and acceptable. The bidder addresses the requirement adequately, with a workable approach and reasonable supporting detail, though it does not stand out as best-in-class.',
  1: 'The submission is partial and below expectation. Key elements of the requirement are addressed only superficially or with gaps that raise delivery risk.',
  0: 'The submission does not meet the requirement. The response is absent, non-responsive, or materially deficient against what was requested.',
}

const MOCK_EVIDENCE = (bidderName, criterion) => [
  `${bidderName} — Technical Proposal, response to “${criterion}”`,
  `Method Statement / supporting annexes cross-referenced against the ITT scope`,
  `AI extraction index entry for the corresponding proposal section`,
]

// Exposed so the same justification narrative/evidence can be rendered inline in
// the UI (not only in the opened document).
export const scoreNarrative = (score) => SCORE_NARRATIVE[Number(score)] ?? SCORE_NARRATIVE[0]
export const scoreEvidence = (bidderName, criterion) => MOCK_EVIDENCE(bidderName, criterion)

// Builds the per-score AI rationale document.
export function scoreRationaleDoc({ tenderId, tenderTitle, bidderName, criterion, criterionType, score, maxScore = 3, weight, band, minScore, evaluatorName }) {
  const s = Number(score)
  const belowMin = criterionType === 'Must' && minScore != null && s < minScore
  const badgeCls = belowMin ? 'red' : s >= 3 ? 'green' : s >= 2 ? 'blue' : s >= 1 ? 'amber' : 'red'
  const narrative = SCORE_NARRATIVE[s] ?? SCORE_NARRATIVE[0]
  const content = `
    <div class="head">
      <div class="brand">🤖 AI Evaluation Rationale</div>
      <h1>Score Justification — ${esc(bidderName)}</h1>
      <div class="sub">${esc(tenderId || '')}${tenderTitle ? ' · ' + esc(tenderTitle) : ''}</div>
    </div>
    <div class="body">
      <div class="meta">
        <div><b>Criterion:</b> ${esc(criterion)}</div>
        <div><b>Type:</b> ${esc(criterionType || '—')}</div>
        <div><b>Awarded Score:</b> <span class="badge ${badgeCls}">${esc(s)} / ${esc(maxScore)}</span></div>
        <div><b>Weight:</b> ${esc(weight != null ? weight + '%' : '—')}</div>
        ${minScore != null ? `<div><b>Minimum required:</b> ${esc(minScore)}${belowMin ? ' <span class="badge red">below minimum</span>' : ''}</div>` : ''}
        <div><b>Evaluator:</b> ${esc(evaluatorName || 'Contract Holder')}</div>
      </div>

      <h2>Scoring Band</h2>
      <div class="quote">${esc(band || 'Band description not available for this score.')}</div>

      <h2>AI Justification</h2>
      <p>${esc(narrative)}</p>
      ${belowMin ? `<p><b>Note:</b> this is a <b>Must</b> criterion and the awarded score is below the minimum threshold of ${esc(minScore)}. On its own this is sufficient to fail the bidder at the technical stage.</p>` : ''}

      <h2>Evidence Reviewed</h2>
      <div class="evidence"><ul>${MOCK_EVIDENCE(bidderName, criterion).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>

      <div class="foot">This rationale was generated by the AI evaluation assistant to support the evaluator's decision. It is advisory; the recorded score reflects the evaluator's final judgement.</div>
    </div>`
  return { title: `Score Rationale — ${bidderName} · ${criterion}`, content }
}

// Builds the fail-reasoning document for a bidder that failed technical evaluation.
export function failReasonDoc({ tenderId, tenderTitle, bidderName, total, overallPass, fails = [], evaluatorName }) {
  const failRows = fails.length
    ? `<ul>${fails.map(f => `<li><b>${esc(f.criterion)}</b> — scored ${esc(f.score)} / ${esc(f.maxScore ?? 3)}, minimum required ${esc(f.minScore)}. ${esc(f.band || '')}</li>`).join('')}</ul>`
    : `<p>All mandatory (Must) criteria met their minimum, but the overall weighted score of <b>${esc(Number(total).toFixed(1))}</b> is below the required pass mark of <b>${esc(overallPass)}</b>.</p>`
  const content = `
    <div class="head">
      <div class="brand">🤖 AI Evaluation Rationale</div>
      <h1>Technical Fail Reasoning — ${esc(bidderName)}</h1>
      <div class="sub">${esc(tenderId || '')}${tenderTitle ? ' · ' + esc(tenderTitle) : ''}</div>
    </div>
    <div class="body">
      <div class="meta">
        <div><b>Result:</b> <span class="badge red">FAIL</span></div>
        <div><b>Weighted Total:</b> ${esc(Number(total).toFixed(1))} / 100</div>
        <div><b>Pass Mark:</b> ${esc(overallPass)}</div>
        <div><b>Evaluator:</b> ${esc(evaluatorName || 'Contract Holder')}</div>
      </div>

      <h2>Why this bidder did not pass</h2>
      ${failRows}

      <h2>AI Summary</h2>
      <p>Based on the recorded scores, ${esc(bidderName)} does not satisfy the technical qualification criteria for this tender and is therefore not carried forward to the commercial stage.${fails.length ? ' The mandatory shortfalls listed above are decisive.' : ''}</p>

      <div class="foot">Generated by the AI evaluation assistant to accompany the technical evaluation report.</div>
    </div>`
  return { title: `Fail Reasoning — ${bidderName}`, content }
}

// Builds a formal regret / rejection letter for an unsuccessful bidder.
export function rejectionLetterDoc({ tenderId, tenderTitle, bidderName, department, awardedTo, dateStr }) {
  const content = `
    <div class="head">
      <div class="brand">Oman LNG · Tender Management</div>
      <h1>Notification of Tender Outcome</h1>
      <div class="sub">${esc(tenderId || '')}${tenderTitle ? ' · ' + esc(tenderTitle) : ''}</div>
    </div>
    <div class="body">
      <div class="meta">
        <div><b>To:</b> ${esc(bidderName)}</div>
        <div><b>Date:</b> ${esc(dateStr || '')}</div>
        <div><b>Tender:</b> ${esc(tenderTitle || tenderId || '')}</div>
        <div><b>Department:</b> ${esc(department || '—')}</div>
      </div>

      <p>Dear ${esc(bidderName)},</p>

      <p>Thank you for participating in the tender <b>${esc(tenderTitle || tenderId || '')}</b> and for the time and effort invested in preparing and submitting your proposal.</p>

      <p>Following a thorough technical and commercial evaluation of all submissions received, we regret to inform you that your proposal has <b>not been selected</b> for award on this occasion. While your submission was carefully considered, it did not fully meet the evaluation expectations relative to the other competing offers.</p>

      <p>This outcome does not reflect on your standing as a valued supplier. We genuinely appreciate your interest and encourage you to continue participating in our future tender opportunities, where we look forward to receiving your proposals. Better luck next time.</p>

      <p>Should you wish to receive high-level feedback on your submission, you may contact the Contracts &amp; Procurement team quoting the tender reference above.</p>

      <div class="sign">
        Yours sincerely,<br><br>
        <b>Contracts &amp; Procurement Team</b><br>
        Oman LNG
      </div>

      <div class="foot">This is a system-generated notification issued after the contract award decision${awardedTo ? '' : ''}. Reference: ${esc(tenderId || '')}.</div>
    </div>`
  return { title: `Regret Letter — ${bidderName}`, content }
}
