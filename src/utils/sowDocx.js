// "Download SOW" for the Contract Initiating Form's generated Statement of
// Work — a real Word document built client-side with `docx` (MAIN downloads
// the backend's `GET /sow/{id}/export` .docx, fallback name
// "Scope of Work.docx"). Section bodies are plain text: blank-line separated
// paragraphs and `- ` / `• ` bullet lines.

import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

const BULLET_PREFIX = /^\s*[-•]\s+/
const FALLBACK_FILENAME = 'Scope of Work.docx'

function bodyParagraphs(text) {
  return String(text ?? '')
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => (BULLET_PREFIX.test(line)
      ? new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: line.replace(BULLET_PREFIX, ''), size: 21, color: '334155' })],
      })
      : new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: line, size: 21, color: '334155' })],
      })))
}

function safeFilename(name) {
  const cleaned = String(name ?? '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned ? `${cleaned}.docx` : FALLBACK_FILENAME
}

/**
 * Builds and downloads the SOW as .docx.
 * @param {{ sections: {heading: string, content: string}[] }} sow
 * @param {{ title: string, reference: string, budget: string, generatedOn: string }} meta
 */
export async function downloadSowDocx(sow, meta) {
  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Statement of Work - ${meta.title || ''}`.trim(), bold: true, color: '0089CF', size: 36 })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `Cost Code: ${meta.reference} • ${meta.budget}`, color: '64748B', size: 20 })],
    }),
  ]
  if (meta.generatedOn) {
    children.push(new Paragraph({
      spacing: { after: 300 },
      children: [new TextRun({ text: `Generated ${meta.generatedOn}`, color: '94A3B8', size: 18, italics: true })],
    }))
  }
  sow.sections.forEach(section => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: section.heading, bold: true, color: '1E293B', size: 26 })],
    }))
    children.push(...bodyParagraphs(section.content))
  })
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: 'AI Generated — review before issue', color: '94A3B8', size: 16, italics: true })],
  }))

  const doc = new Document({
    creator: 'AI Tender Management',
    title: `Statement of Work - ${meta.title || ''}`,
    sections: [{ children }],
  })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeFilename(meta.reference && meta.reference !== 'New Draft' ? `Scope of Work - ${meta.reference}` : 'Scope of Work')
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
