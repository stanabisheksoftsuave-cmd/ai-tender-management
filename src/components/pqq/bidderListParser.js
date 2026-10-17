import * as XLSX from 'xlsx'
import { MAX_BIDDER_LIST_ROWS, findRegistryBidder } from './pqqModel'

/*
 * Client-side stand-in for MAIN's bidder-list ingestion (POST …/uploads):
 * reads the first sheet of an ERP/JSRS .xlsx, finds the header row, and maps
 * the columns it recognises. Rows with data but no bidder name are skipped and
 * counted, which drives the "Imported with skipped rows" warning.
 */

// Checked in order, first hit wins per column: contact columns before the
// bidder name ("Contact Name" is not the bidder), the name before the looser
// business/registration patterns ("Business Name", "Company Registration No").
const COLUMN_PATTERNS = [
  ['jsrsNo',           /jsrs/i],
  ['contactEmail',     /e-?mail/i],
  ['contactName',      /contact/i],
  ['name',             /\bname\b/i],
  ['country',          /country|nationality/i],
  ['category',         /category|classification|discipline/i],
  ['natureOfBusiness', /nature|business|activit|service/i],
  ['regNo',            /\bcr\b|commercial\s*reg|registration|reg\.?\s*no/i],
  ['name',             /supplier|company|bidder|vendor|contractor/i],
]

function mapHeader(cells) {
  const map = {}
  cells.forEach((cell, i) => {
    const label = String(cell || '').trim()
    if (!label) return
    for (const [key, rx] of COLUMN_PATTERNS) {
      if (!rx.test(label)) continue
      if (map[key] == null) map[key] = i
      break
    }
  })
  return map
}

const cellText = v => (v === null || v === undefined ? '' : String(v).trim())

/**
 * @param {File} file
 * @param {'erp'|'jsrs'} documentType
 * @returns {Promise<{uploadId, documentType, fileName, parseStatus: 'ok'|'partial'|'failed',
 *   parseError?, rowCount, unparsedRowCount, newBidders, matchedBidders, rows}>}
 */
export async function parseBidderList(file, documentType) {
  const base = {
    uploadId: `${documentType}-${file.name}-${file.size}`,
    documentType,
    fileName: file.name,
    rowCount: 0,
    unparsedRowCount: 0,
    newBidders: 0,
    matchedBidders: 0,
    rows: [],
  }
  try {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return { ...base, parseStatus: 'failed', parseError: 'The workbook has no sheets.' }
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })
    const headerIdx = aoa.slice(0, 10).findIndex(r => mapHeader(r).name != null)
    if (headerIdx === -1) {
      return { ...base, parseStatus: 'failed', parseError: 'No header row with a bidder name column was found.' }
    }
    const cols = mapHeader(aoa[headerIdx])
    const body = aoa.slice(headerIdx + 1).filter(r => r.some(c => cellText(c)))
    if (body.length > MAX_BIDDER_LIST_ROWS) {
      return { ...base, parseStatus: 'failed', parseError: 'This file has more than 5,000 rows.' }
    }
    const rows = []
    let unparsed = 0
    body.forEach(r => {
      const pick = key => (cols[key] != null ? cellText(r[cols[key]]) : '')
      const name = pick('name')
      if (!name) { unparsed++; return }
      rows.push({
        name,
        country: pick('country'),
        category: pick('category'),
        natureOfBusiness: pick('natureOfBusiness'),
        regNo: pick('regNo'),
        jsrsNo: pick('jsrsNo'),
        contactName: pick('contactName'),
        contactEmail: pick('contactEmail'),
      })
    })
    if (rows.length === 0) {
      return { ...base, parseStatus: 'failed', unparsedRowCount: unparsed, parseError: 'No bidder rows could be read from this file.' }
    }
    const matched = rows.filter(row => findRegistryBidder(row)).length
    return {
      ...base,
      parseStatus: unparsed > 0 ? 'partial' : 'ok',
      rowCount: rows.length + unparsed,
      unparsedRowCount: unparsed,
      matchedBidders: matched,
      newBidders: rows.length - matched,
      rows,
    }
  } catch (err) {
    return { ...base, parseStatus: 'failed', parseError: err?.message || 'The bidder list could not be parsed.' }
  }
}
