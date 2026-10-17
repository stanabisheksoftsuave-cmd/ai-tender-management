/*
 * ITT Technical Evaluation printable exports — ported from MAIN's
 * `itt-technical-evaluation/{print-document,evaluation-report,
 * fail-reason-document,bidder-document}.ts`.
 *
 * Each export is a standalone, inline-styled HTML page written into a new
 * window with its own print stylesheet and a "Print / Save as PDF" button.
 * The print button is wired with a listener rather than an inline onclick.
 */

import {
  formatPassMark,
  formatPercent,
  hseBanding,
  totalFor,
  weightedFor,
} from '../components/techeval/model'

/** Guards against a bidder name or reference breaking out of the markup. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Writes a standalone, print-ready HTML page into a new window (MAIN's `openPrintDocument`). */
export function openPrintDocument({ title, headerCellPadding, body, printButton }) {
  const win = window.open('', '_blank')
  // Blocked by a popup blocker, or opened from a non-user gesture.
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px;color:#1e293b}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;padding:${headerCellPadding};background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0}
    @media print{.no-print{display:none}body{background:white;padding:0}.page{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
  ${body}
  <button id="print-button" class="no-print" style="position:fixed;bottom:24px;right:24px;background:${printButton.background};color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 4px 12px ${printButton.shadow}">⬇ Print / Save as PDF</button>
</body>
</html>`)
  win.document.close()
  win.document.getElementById('print-button')?.addEventListener('click', () => win.print())
}

const CELL = 'padding:8px 10px;border-bottom:1px solid #f1f5f9'
const META_LABEL = 'font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px'

/**
 * "Download Evaluation Report" — MAIN's `openEvaluationReport`.
 * `resultFor(bidderKey)` is the verdict exactly as the scoring screen shows it.
 */
export function openEvaluationReport({ tenderRef, tenderTitle, department, bidders, scores, passingScore, criteria, resultFor }) {
  const criterionHeaders = criteria.map(c =>
    `<th style="text-align:center;padding:8px 10px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">${escapeHtml(c.criterion)}<br><span style="font-size:9px;color:#94a3b8">${c.type} · weight ${c.weight}</span></th>`
  ).join('')

  const rows = bidders.map(bidder => {
    const total = totalFor(scores, bidder.key, criteria)
    const result = resultFor(bidder.key)
    const cells = criteria.map(c => {
      const value = scores[`${bidder.key}-${c.id}`]
      return `<td style="text-align:center;${CELL}">${value ?? '—'}<br><span style="font-size:9px;color:#94a3b8">${weightedFor(scores, bidder.key, c).toFixed(1)}</span></td>`
    }).join('')
    return `<tr>
        <td style="${CELL};font-weight:600">${escapeHtml(bidder.name)}</td>
        <td style="${CELL};color:#64748b;font-size:11px">${escapeHtml(bidder.country)}</td>
        <td style="text-align:center;${CELL};font-size:11px">${hseBanding(scores, bidder.key, criteria)}</td>
        ${cells}
        <td style="text-align:center;${CELL};font-weight:700;color:${result === 'PASS' ? '#059669' : '#d97706'}">${formatPercent(total)}</td>
        <td style="text-align:center;${CELL};font-weight:700;font-size:11px;color:${result === 'PASS' ? '#059669' : '#dc2626'}">${result}</td>
      </tr>`
  }).join('')

  const passCount = bidders.filter(b => resultFor(b.key) === 'PASS').length

  openPrintDocument({
    title: `Tech-Eval-Report-${escapeHtml(tenderRef)}`,
    headerCellPadding: '8px 10px',
    printButton: { background: '#0089cf', shadow: 'rgba(0,137,207,.4)' },
    body: `<div class="page" style="max-width:960px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
    <div style="background:linear-gradient(135deg,#1b4c6f,#0089cf);color:white;padding:40px 48px">
      <div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Technical Evaluation Report</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:4px">${escapeHtml(tenderTitle)}</div>
      <div style="font-size:13px;opacity:.8">${escapeHtml(tenderRef)} · ${escapeHtml(department)} · Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div style="display:flex;gap:24px;margin-top:20px;flex-wrap:wrap">
        <div><div style="${META_LABEL}">Total Bidders</div><div style="font-size:16px;font-weight:700">${bidders.length}</div></div>
        <div><div style="${META_LABEL}">Pass Mark</div><div style="font-size:16px;font-weight:700">${formatPassMark(passingScore)}</div></div>
        <div><div style="${META_LABEL}">Passed</div><div style="font-size:16px;font-weight:700">${passCount}</div></div>
      </div>
    </div>
    <div style="padding:32px 40px;overflow-x:auto">
      <table>
        <thead><tr><th>Bidder</th><th>Country</th><th style="text-align:center">QHSE</th>${criterionHeaders}<th style="text-align:center">Total</th><th style="text-align:center">Result</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`,
  })
}

const FR_CELL = 'padding:10px 12px;border-bottom:1px solid #f1f5f9'

/** "Export Reason" — MAIN's `openFailReasonDocument`. */
export function openFailReasonDocument(bidder, input) {
  const rows = input.failures.length
    ? input.failures.map(row => `<tr>
        <td style="${FR_CELL}">${escapeHtml(row.criterion)}</td>
        <td style="${FR_CELL};text-align:center;font-weight:700;color:#dc2626">${row.score} / 3</td>
        <td style="${FR_CELL};text-align:center;color:#64748b">${row.minScore ?? '—'}</td>
        <td style="${FR_CELL};color:#b45309">${escapeHtml(row.kind)}</td>
      </tr>`).join('')
    : `<tr><td style="${FR_CELL}" colspan="4">No individual criterion fell below its minimum — the weighted total alone is short of the pass mark.</td></tr>`

  openPrintDocument({
    title: `${escapeHtml(bidder.name)} — Technical Evaluation Reason`,
    headerCellPadding: '10px 12px',
    printButton: { background: '#2563eb', shadow: 'rgba(37,99,235,.4)' },
    body: `<div class="page" style="max-width:860px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;padding:40px 48px">
      <div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Technical Evaluation — Reason for Result</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:16px">${escapeHtml(bidder.name)}</div>
      <div style="display:flex;gap:32px;flex-wrap:wrap">
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Tender</div><div style="font-size:13px;font-weight:600">${escapeHtml(input.tenderRef)}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Weighted Total</div><div style="font-size:13px;font-weight:600">${formatPercent(input.total)}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Pass Mark</div><div style="font-size:13px;font-weight:600">${formatPassMark(input.passingScore)}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Result</div><div style="font-size:13px;font-weight:600">${input.result}</div></div>
      </div>
    </div>
    <div style="padding:40px 48px">
      <div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">${escapeHtml(input.tenderTitle)}</div>
      <p style="font-size:12px;color:#475569;margin-bottom:20px;line-height:1.6">
        Weighted total ${formatPercent(input.total)} against a pass mark of ${formatPassMark(input.passingScore)}. Result: ${input.result}.
        Any criterion scored at or below ${input.threshold} requires clarification before the bidder can proceed.
      </p>
      <table>
        <thead><tr><th>Criterion</th><th style="text-align:center">Score</th><th style="text-align:center">Minimum</th><th>Reason</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`,
  })
}

const SECTION_HEADING = 'font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0'
const META_VALUE = 'font-size:13px;font-weight:600'
const metaField = (label, value) =>
  `<div><div style="${META_LABEL}">${label}</div><div style="${META_VALUE}">${escapeHtml(value)}</div></div>`

const STATUS_DOC = {
  compliant:         { label: 'Compliant',         color: '#059669', background: '#d1fae5' },
  partial_compliant: { label: 'Partial Compliant', color: '#d97706', background: '#fef3c7' },
  non_compliant:     { label: 'Non-Compliant',     color: '#dc2626', background: '#fee2e2' },
}

/**
 * "View Doc" — the bidder's proposal summary (MAIN's `openBidderDocument`).
 * `view` is the bidder's compliance view (Must/Want rows with `present`).
 * The tender reference is the real one, never a hard-coded "ITT-2025-001".
 */
export function openBidderDocument(bidder, view, status, tenderRef) {
  const docRow = (m, okLabel, missLabel, missColor) => `<tr>
        <td style="${FR_CELL}">${escapeHtml(m.name)}</td>
        <td style="${FR_CELL};color:#64748b;font-size:11px">${escapeHtml(m.docRef || '—')}</td>
        <td style="${FR_CELL};font-weight:700;color:${m.present ? '#059669' : missColor}">${m.present ? okLabel : missLabel}</td>
      </tr>`
  const mandatoryRows = view.mandatory.map(m => docRow(m, '✓ Submitted', '✗ Missing', '#dc2626')).join('')
  const optionalRows = view.optional.map(m => docRow(m, '✓ Submitted', '— Not submitted', '#d97706')).join('')
  const counts = {
    mandatory: view.mandatory.filter(m => m.present).length,
    optional: view.optional.filter(m => m.present).length,
  }
  const { label, color, background } = STATUS_DOC[status]
  const submittedDocs = [...view.mandatory, ...view.optional].filter(m => m.present).map(m => `
      <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9">
        <div style="width:36px;height:36px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px">📄</div>
        <div>
          <div style="font-size:12px;font-weight:600;color:#1e293b">${escapeHtml(m.name)}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:2px">${escapeHtml(m.docRef || '—')} · ${escapeHtml(m.docType)}</div>
        </div>
      </div>`).join('')

  openPrintDocument({
    title: `${escapeHtml(bidder.name)} — Bidder Proposal`,
    headerCellPadding: '10px 12px',
    printButton: { background: '#2563eb', shadow: 'rgba(37,99,235,.4)' },
    body: `<div class="page" style="max-width:860px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;padding:40px 48px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0">${escapeHtml(bidder.name[0] ?? '')}</div>
        <div>
          <div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Bidder Proposal Document</div>
          <div style="font-size:22px;font-weight:700">${escapeHtml(bidder.name)}</div>
        </div>
        <div style="margin-left:auto;background:${background};color:${color};border:1px solid ${color}33;border-radius:99px;padding:6px 16px;font-size:12px;font-weight:700">${label}</div>
      </div>
      <div style="display:flex;gap:32px;flex-wrap:wrap">
        ${metaField('Submission ID', '—')}
        ${metaField('Country', bidder.country || '—')}
        ${metaField('Submission Date', '—')}
        ${metaField('Tender', tenderRef)}
        ${metaField('Mandatory Docs', `${counts.mandatory}/${view.mandatory.length}`)}
        ${metaField('Optional Docs', `${counts.optional}/${view.optional.length}`)}
      </div>
    </div>
    <div style="padding:40px 48px">
      <div style="margin-bottom:32px">
        <div style="${SECTION_HEADING}">Mandatory Compliance Documents</div>
        <table><thead><tr><th>Document</th><th>Reference</th><th>Status</th></tr></thead><tbody>${mandatoryRows}</tbody></table>
      </div>
      <div style="margin-bottom:32px">
        <div style="${SECTION_HEADING}">Optional Documents</div>
        <table><thead><tr><th>Document</th><th>Reference</th><th>Status</th></tr></thead><tbody>${optionalRows}</tbody></table>
      </div>
      <div style="margin-bottom:32px">
        <div style="${SECTION_HEADING}">Submitted Documents</div>
        <div style="background:#f8fafc;border-radius:10px;padding:16px 20px">${submittedDocs}</div>
      </div>
    </div>
  </div>`,
  })
}
