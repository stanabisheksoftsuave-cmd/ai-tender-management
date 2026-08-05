import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { renderAsync } from 'docx-preview'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, WidthType, AlignmentType, BorderStyle,
} from 'docx'
import { ArrowLeft, FileText, Download, AlertTriangle, Loader2 } from 'lucide-react'

/**
 * Standalone, public full-screen viewer that generates a Word document from
 * submitted template data and renders it with docx-preview. Opened in a new tab:
 *   /docx-viewer?data=<localStorage key>&name=<display name>
 */

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
const CELL_BORDERS = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER }

// Build a docx Document from the resolved payload: a title, a reference line,
// then one labelled section (field/value table) per submitted row.
function buildDocx(payload) {
  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: payload.title, color: '1B4C6F', bold: true })],
    }),
  ]

  if (payload.tenderRef) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({
        text: `Reference: ${payload.tenderRef}${payload.tenderTitle ? ` — ${payload.tenderTitle}` : ''}`,
        color: '64748B', size: 20,
      })],
    }))
  }

  payload.rows.forEach((row, i) => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: `${payload.rowLabel} #${i + 1}`, color: '8B5CF6', bold: true })],
    }))

    const tableRows = payload.headers.map((header, ci) => new TableRow({
      children: [
        new TableCell({
          width: { size: 32, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS,
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, color: '1B4C6F', size: 20 })] })],
        }),
        new TableCell({
          width: { size: 68, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS,
          children: [new Paragraph({ children: [new TextRun({ text: row[ci] || '—', size: 20, color: '334155' })] })],
        }),
      ],
    }))

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }))
  })

  return new Document({
    sections: [{ properties: {}, children }],
  })
}

export default function DocxViewer() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dataKey = params.get('data')
  const name = params.get('name') || 'Document'

  const [status, setStatus] = useState({ loading: true, error: null })
  const containerRef = useRef(null)
  const blobRef = useRef(null)

  useEffect(() => {
    document.title = `${name} — Document Viewer`
  }, [name])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!dataKey) throw new Error('No document specified.')
        const payload = JSON.parse(localStorage.getItem(dataKey) || 'null')
        if (!payload) throw new Error('No data found for this document.')

        const doc = buildDocx(payload)
        const blob = await Packer.toBlob(doc)
        if (cancelled) return
        blobRef.current = blob

        if (!containerRef.current) return
        await renderAsync(blob, containerRef.current, undefined, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
        })
        if (!cancelled) setStatus({ loading: false, error: null })
      } catch (e) {
        if (!cancelled) setStatus({ loading: false, error: e.message || 'Failed to render the document.' })
      }
    })()
    return () => { cancelled = true }
  }, [dataKey])

  // This viewer is usually opened in a new tab, where there is nothing to go back
  // to — window.close() only works for script-opened tabs, hence the fallback.
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    // '/' resolves to whichever landing page the signed-in role may open.
    window.close()
    setTimeout(() => { if (!window.closed) navigate('/') }, 150)
  }

  const handleDownload = () => {
    if (!blobRef.current) return
    const url = URL.createObjectURL(blobRef.current)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.docx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#e9eef4' }}>
      <style>{`
        .docx-wrapper { background: transparent !important; padding: 24px 0 !important; }
        .docx-wrapper > section.docx {
          box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 24px; background: #fff;
        }
      `}</style>

      {/* Header bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, padding: '14px 24px',
        background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            onClick={handleBack}
            aria-label="Back"
            title="Back"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
              background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 600,
              border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.12)', flexShrink: 0 }}>
            <FileText size={18} style={{ color: '#2563eb' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Word Document Preview</div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={status.loading || !!status.error}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10,
            background: '#0089cf', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none',
            cursor: status.loading || status.error ? 'not-allowed' : 'pointer', opacity: status.loading || status.error ? 0.5 : 1, flexShrink: 0,
          }}
        >
          <Download size={15} /> Download
        </button>
      </div>

      {/* Overlays */}
      {status.loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0', color: '#64748b' }}>
          <Loader2 size={28} style={{ color: '#0089cf' }} className="animate-spin" />
          <span style={{ fontSize: 14 }}>Generating document…</span>
        </div>
      )}
      {!status.loading && status.error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0', color: '#dc2626' }}>
          <AlertTriangle size={28} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{status.error}</span>
        </div>
      )}

      {/* docx-preview renders here (always mounted so the ref exists) */}
      <div ref={containerRef} style={{ display: status.loading || status.error ? 'none' : 'block' }} />
    </div>
  )
}
