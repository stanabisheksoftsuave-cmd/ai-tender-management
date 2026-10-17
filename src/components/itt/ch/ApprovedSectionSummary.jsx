import { CheckCircle2, Pencil } from 'lucide-react'
import Card from '../../ui/Card'
import Button from '../../ui/Button'

/*
 * An owner's already-approved section opens on this summary instead of the
 * live editor (MAIN's approved-section card); "Edit this section" reopens the
 * editor, and approving again re-records the approval.
 */
export default function ApprovedSectionSummary({ title, onEdit }) {
  return (
    <Card branded className="p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>
          <CheckCircle2 size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold break-words" style={{ color: '#1e293b' }}>{title}</h3>
          <p className="text-xs font-medium" style={{ color: '#059669' }}>Approved</p>
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        You&apos;ve already reviewed and approved this section. Need to fix a mistake or update it? Edit it below - your
        changes are saved once you re-approve.
      </p>
      <Button variant="secondary" onClick={onEdit} className="border border-slate-300 bg-white">
        <Pencil size={14} aria-hidden="true" /> Edit this section
      </Button>
    </Card>
  )
}
