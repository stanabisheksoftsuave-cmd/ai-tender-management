import JSZip from 'jszip'

const bufferCache = new Map()

export function fetchDocxArrayBuffer(url) {
  if (!bufferCache.has(url)) {
    bufferCache.set(url, fetch(url).then(res => {
      if (!res.ok) throw new Error(`Failed to load template: ${url}`)
      return res.arrayBuffer()
    }))
  }
  return bufferCache.get(url)
}

function decodeXmlEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function escapeXmlText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function tagName(token) {
  const m = /^<\/?([A-Za-z0-9_:.-]+)/.exec(token)
  return m ? m[1] : null
}

function attrValue(token, name) {
  const m = new RegExp(name + '="([^"]*)"').exec(token)
  return m ? m[1] : null
}

// Walks word/document.xml as a flat token stream (tag or text run) and builds:
//  - blocks: renderable content in reading order — either a paragraph
//    ({ type:'p', segments }) or a table ({ type:'table', rows:[{ cells:[{ blocks }] }] }),
//    so tables render as real tables instead of a flattened line-per-cell stream.
//  - paragraphs: flat list of every paragraph block (back-compat / convenience).
//  - fields: merged runs of highlighted text, with byte offsets into the ORIGINAL xml
//    string so export can splice in answers without a lossy DOM round-trip.
// w:delText (tracked-change deletions) is a distinct tag name from w:t, so deleted
// placeholder text is naturally excluded without any extra bookkeeping.
export function buildFieldModel(xml) {
  const tokenRe = /<[^>]+>|[^<]+/g
  const rootBlocks = []
  const paragraphs = []
  const fields = []
  const containerStack = [rootBlocks]
  const tableStack = []
  const container = () => containerStack[containerStack.length - 1]

  let currentParagraph = null
  let insideRun = false
  let runHighlightSpan = null
  let lastWasField = false

  const openParagraph = () => {
    currentParagraph = { type: 'p', id: paragraphs.length, segments: [] }
    container().push(currentParagraph)
    paragraphs.push(currentParagraph)
    lastWasField = false
  }

  let match
  while ((match = tokenRe.exec(xml)) !== null) {
    const token = match[0]
    const start = match.index
    const end = start + token.length
    if (token[0] !== '<') continue

    const closing = token.startsWith('</')
    const name = tagName(token)

    if (name === 'w:tbl') {
      if (!closing) {
        const table = { type: 'table', rows: [] }
        container().push(table)
        tableStack.push(table)
      } else {
        tableStack.pop()
      }
      currentParagraph = null
      lastWasField = false
      continue
    }
    if (name === 'w:tr') {
      if (!closing && tableStack.length) tableStack[tableStack.length - 1].rows.push({ cells: [] })
      currentParagraph = null
      lastWasField = false
      continue
    }
    if (name === 'w:tc') {
      if (!closing) {
        const table = tableStack[tableStack.length - 1]
        const row = table && table.rows[table.rows.length - 1]
        const cell = { blocks: [] }
        if (row) row.cells.push(cell)
        containerStack.push(cell.blocks)
      } else if (containerStack.length > 1) {
        containerStack.pop()
      }
      currentParagraph = null
      lastWasField = false
      continue
    }
    if (name === 'w:p') {
      if (!closing) openParagraph()
      continue
    }
    if (name === 'w:r') {
      insideRun = !closing
      runHighlightSpan = null
      continue
    }
    if (name === 'w:highlight' && insideRun && !closing) {
      const val = attrValue(token, 'w:val')
      runHighlightSpan = val && val !== 'none' ? { start, end } : null
      continue
    }
    if (name === 'w:t' && !closing) {
      const selfClosing = /\/>$/.test(token.trim())
      let textStart = end
      let textEnd = end
      if (!selfClosing) {
        // Keep consuming the shared token stream (same regex, same lastIndex)
        // until the matching close tag — this is what lets a single exec loop
        // handle nested "content" tokens without a separate parser pass.
        let inner
        while ((inner = tokenRe.exec(xml)) !== null) {
          if (inner[0][0] === '<' && tagName(inner[0]) === 'w:t' && inner[0].startsWith('</')) {
            textEnd = inner.index
            break
          }
        }
      }
      if (!currentParagraph) openParagraph()
      const decoded = decodeXmlEntities(xml.slice(textStart, textEnd))
      const isField = insideRun && !!runHighlightSpan
      if (isField && lastWasField) {
        const f = fields[fields.length - 1]
        f.defaultText += decoded
        f.spans.push({ start: textStart, end: textEnd })
        f.highlightSpans.push(runHighlightSpan)
      } else if (isField) {
        fields.push({
          index: fields.length,
          defaultText: decoded,
          spans: [{ start: textStart, end: textEnd }],
          highlightSpans: [runHighlightSpan],
        })
        currentParagraph.segments.push({ type: 'field', fieldIndex: fields.length - 1 })
      } else {
        currentParagraph.segments.push({ type: 'text', text: decoded })
      }
      lastWasField = isField
    }
  }

  return { xml, blocks: rootBlocks, paragraphs, fields }
}

export async function parseDocxTemplate(url) {
  const buf = await fetchDocxArrayBuffer(url)
  const zip = await JSZip.loadAsync(buf)
  const file = zip.file('word/document.xml')
  if (!file) throw new Error(`Invalid docx template: ${url}`)
  const xml = await file.async('string')
  return buildFieldModel(xml)
}

export function applyAnswers(xml, fields, answers) {
  const ops = []
  fields.forEach((field, i) => {
    const raw = answers && answers[i] != null ? String(answers[i]) : field.defaultText
    const cleaned = escapeXmlText(raw.replace(/\r\n|\r|\n/g, ' '))
    field.spans.forEach((span, si) => {
      ops.push({ start: span.start, end: span.end, replacement: si === 0 ? cleaned : '' })
    })
    field.highlightSpans.forEach(hs => ops.push({ start: hs.start, end: hs.end, replacement: '' }))
  })
  ops.sort((a, b) => b.start - a.start)
  let result = xml
  for (const op of ops) result = result.slice(0, op.start) + op.replacement + result.slice(op.end)
  return result
}

export async function buildFilledDocxBlob(url, answers) {
  const buf = await fetchDocxArrayBuffer(url)
  const zip = await JSZip.loadAsync(buf)
  const xml = await zip.file('word/document.xml').async('string')
  const { fields } = buildFieldModel(xml)
  const filledXml = applyAnswers(xml, fields, answers)
  zip.file('word/document.xml', filledXml)
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  })
}
