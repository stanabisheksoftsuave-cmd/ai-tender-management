import * as XLSX from 'xlsx'

/*
 * Excel export helpers.
 *
 * The app already renders .xlsx through react-excel-renderer; this is the write
 * side. Everything funnels through downloadSheets so filenames, sheet-name
 * limits and the Blob dance live in one place.
 */

// Excel refuses sheet names over 31 chars or containing : \ / ? * [ ]
function safeSheetName(name) {
  return (name || 'Sheet').replace(/[:\\/?*[\]]/g, '-').slice(0, 31)
}

/**
 * Build and download a workbook.
 * @param {string} filename           e.g. 'ITT-2025-020-PreQual-Summary.xlsx'
 * @param {Array<{name: string, aoa: any[][]}>} sheets  array-of-arrays per sheet
 */
export function downloadSheets(filename, sheets) {
  const wb = XLSX.utils.book_new()
  sheets.forEach((s, i) => {
    const ws = XLSX.utils.aoa_to_sheet(s.aoa)
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(s.name || `Sheet${i + 1}`))
  })
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const dash = v => (v === undefined || v === null || v === '' ? '—' : String(v))

/**
 * Pre-Qualification summary: tender header, qualified bidders, and the full
 * stage-3/stage-4 outcome for every bidder including the dropped ones.
 */
export function exportPreQualSummaryExcel(tender, qualifiedBidders = []) {
  const all = tender?.prequalBidders || []

  const overview = [
    ['Pre-Qualification Summary'],
    [],
    ['Tender ID', dash(tender?.id)],
    ['Title', dash(tender?.title)],
    ['Department', dash(tender?.department)],
    ['Tender Type', dash(tender?.tenderType)],
    ['Work Category', dash(tender?.workCategory)],
    ['Stage', dash(tender?.stage)],
    ['Financial Assessment Required', tender?.financialAssessmentRequired ? 'Yes' : 'No'],
    ['Financial Assessment By', dash(tender?.financialAssessmentCompletedBy)],
    ['Financial Assessment Date', dash(tender?.financialAssessmentCompletedAt)],
    [],
    ['Bidders Invited', all.length],
    ['Qualified', qualifiedBidders.length],
  ]

  const qualified = [
    ['Qualified Bidders'],
    [],
    ['#', 'Bidder', 'Country', 'Category', 'Financial Result', 'Recommendation'],
    ...qualifiedBidders.map((b, i) => [
      i + 1,
      dash(b.name),
      dash(b.country),
      dash(b.category),
      dash(b.stage4?.result),
      dash(b.stage4?.recommendation),
    ]),
  ]

  const outcome = [
    ['All Bidders — Outcome'],
    [],
    ['Bidder', 'Country', 'Category', 'Response Uploaded', 'Dropped At', 'Financial Result', 'Recommendation'],
    ...all.map(b => [
      dash(b.name),
      dash(b.country),
      dash(b.category),
      b.responseUploaded ? 'Yes' : 'No',
      b.droppedAt ? String(b.droppedAt) : '—',
      dash(b.stage4?.result),
      dash(b.stage4?.recommendation),
    ]),
  ]

  downloadSheets(`${tender?.id || 'tender'}-PreQual-Summary.xlsx`, [
    { name: 'Overview', aoa: overview },
    { name: 'Qualified Bidders', aoa: qualified },
    { name: 'All Bidders', aoa: outcome },
  ])
}

/**
 * A single strategy template's filled rows.
 * @param {{title: string, fields: Array<{key: string, label: string, compute?: Function}>}} template
 * @param {Array<object>} rows   the saved rows from tender[template.dataKey]
 */
export function exportTemplateExcel(template, rows = [], tender) {
  const fields = template?.fields || []
  // Template field definitions key their columns by `id`; `key` is tolerated in
  // case a caller passes a plainer shape.
  const fieldKey = f => f.id ?? f.key
  const headers = fields.map(f => f.label || fieldKey(f))

  const body = rows.map(row =>
    fields.map(f => {
      const value = typeof f.compute === 'function' ? f.compute(row) : row?.[fieldKey(f)]
      return dash(value)
    })
  )

  const aoa = [
    [template?.title || 'Template'],
    [`${dash(tender?.id)} — ${dash(tender?.title)}`],
    [],
    headers,
    ...body,
  ]

  const safeFile = (template?.title || 'template').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  downloadSheets(`${tender?.id || 'tender'}-${safeFile}.xlsx`, [{ name: template?.title || 'Sheet1', aoa }])
}
