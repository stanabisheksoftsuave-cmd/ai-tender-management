import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ExcelRenderer, OutTable } from 'react-excel-renderer'
import * as XLSX from 'xlsx'
import { ArrowLeft, FileSpreadsheet, Download, AlertTriangle, Loader2 } from 'lucide-react'

/**
 * Standalone, public full-screen viewer that renders spreadsheet data as an HTML
 * table using react-excel-renderer's OutTable. Opened in a new tab in two modes:
 *   • Filled data:  /excel-viewer?data=<localStorage key>&name=<display name>
 *   • Raw file:     /excel-viewer?file=<encoded /templates/…​.xlsx>&name=<display name>
 */

// Spreadsheet-style column header letters (A, B, … Z, AA, …).
function colLetter(n) {
  let s = ''
  n += 1
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function colsFor(rows) {
  const count = Math.max(1, ...rows.map(r => r.length))
  return Array.from({ length: count }, (_, i) => ({ name: colLetter(i), key: i }))
}

export default function ExcelViewer() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dataKey = params.get('data')
  const fileUrl = params.get('file')
  const name = params.get('name') || 'Spreadsheet'

  const [state, setState] = useState({ loading: true, error: null, rows: [], cols: [] })
  const [aoa, setAoa] = useState(null) // array-of-arrays when we have filled data (for download)

  useEffect(() => {
    document.title = `${name} — Excel Viewer`
  }, [name])

  useEffect(() => {
    let cancelled = false

    // Mode 1 — filled data handed over via localStorage
    if (dataKey) {
      try {
        const payload = JSON.parse(localStorage.getItem(dataKey) || 'null')
        if (!payload) throw new Error('No data found for this document.')
        const sheet = [
          [payload.title],
          [payload.tenderRef ? `Reference: ${payload.tenderRef}${payload.tenderTitle ? ` — ${payload.tenderTitle}` : ''}` : ''],
          [],
          payload.headers,
          ...payload.rows,
        ]
        setAoa(sheet)
        setState({ loading: false, error: null, rows: sheet, cols: colsFor(sheet) })
      } catch (e) {
        setState({ loading: false, error: e.message || 'Failed to load the document data.', rows: [], cols: [] })
      }
      return
    }

    // Mode 2 — parse a raw .xlsx file
    if (!fileUrl) {
      setState({ loading: false, error: 'No file specified.', rows: [], cols: [] })
      return
    }
    ;(async () => {
      try {
        const res = await fetch(fileUrl)
        if (!res.ok) throw new Error(`Could not load file (${res.status})`)
        const blob = await res.blob()
        ExcelRenderer(blob, (err, resp) => {
          if (cancelled) return
          if (err) {
            setState({ loading: false, error: 'Failed to parse the spreadsheet.', rows: [], cols: [] })
          } else {
            setState({ loading: false, error: null, rows: resp.rows, cols: resp.cols })
          }
        })
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message || 'Failed to load the spreadsheet.', rows: [], cols: [] })
      }
    })()
    return () => { cancelled = true }
  }, [dataKey, fileUrl])

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
    // Filled data → export a real .xlsx built from the values.
    if (aoa) {
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return
    }
    // Raw file → download the original.
    if (fileUrl) {
      const a = document.createElement('a')
      a.href = fileUrl
      a.download = ''
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <style>{`
        .excel-view-table { border-collapse: collapse; width: 100%; font-size: 13px; background: #fff; }
        .excel-view-table td, .excel-view-table th {
          border: 1px solid #e2e8f0; padding: 6px 10px; color: #334155; white-space: nowrap;
          max-width: 360px; overflow: hidden; text-overflow: ellipsis; text-align: left;
        }
        .excel-view-table thead th, .excel-view-table .heading td {
          background: #1b4c6f; color: #fff; font-weight: 600; position: sticky; top: 0; z-index: 1;
        }
        .excel-view-table tbody tr:nth-child(even) { background: #f8fafc; }
        .excel-view-table tbody tr:hover { background: #ecf4fc; }
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
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.12)', flexShrink: 0 }}>
            <FileSpreadsheet size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1b4c6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Excel Spreadsheet Preview</div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10,
            background: '#0089cf', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Download size={15} /> Download
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {state.loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0', color: '#64748b' }}>
            <Loader2 size={28} style={{ color: '#0089cf' }} className="animate-spin" />
            <span style={{ fontSize: 14 }}>Loading spreadsheet…</span>
          </div>
        )}

        {!state.loading && state.error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0', color: '#dc2626' }}>
            <AlertTriangle size={28} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{state.error}</span>
          </div>
        )}

        {!state.loading && !state.error && (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', background: '#fff' }}>
            <OutTable
              data={state.rows}
              columns={state.cols}
              tableClassName="excel-view-table"
              tableHeaderRowClass="heading"
            />
          </div>
        )}
      </div>
    </div>
  )
}
