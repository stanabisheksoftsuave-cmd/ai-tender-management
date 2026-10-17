import { AlertCircle, UserCheck } from 'lucide-react'
import Card from '../../ui/Card'
import SearchableSelect from '../../ui/SearchableSelect'
import { ASSIGN_TEAM_COPY } from './createIttForm'

/*
 * The Create ITT team cards (MAIN's SectionAssignmentsCard and
 * AssignedTeamSelectCard): one Contract Engineer, one HSE and one LC per ITT.
 */

const FIELDS = [
  { key: 'ce',  formKey: 'contractEngineerId', aria: 'Contract Engineers' },
  { key: 'hse', formKey: 'hseId',              aria: 'HSE Representative' },
  { key: 'icv', formKey: 'icvId',              aria: 'LC Representative' },
]

function Label({ children }) {
  return (
    <label className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#1e293b' }}>
      {children}<span className="font-secondary text-red-500" aria-hidden="true">*</span>
    </label>
  )
}

/* "Assign Team — all three required": editable single selects. */
export function SectionAssignmentsCard({ form, errors, setField, optionsByGroup, readOnly = false }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <UserCheck size={16} style={{ color: '#0089cf' }} aria-hidden="true" />
        <h2 className="text-base font-bold" style={{ color: '#1e293b' }}>Assign Team</h2>
        <span className="text-xs font-medium text-slate-400">- all three required</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FIELDS.map(f => {
          const copy = ASSIGN_TEAM_COPY[f.key]
          const error = errors[f.formKey]
          return (
            <div key={f.key}>
              <Label>{copy.label}</Label>
              <SearchableSelect
                value={form[f.formKey]}
                onChange={v => setField(f.formKey, v == null ? '' : String(v))}
                options={optionsByGroup[f.key] || []}
                getValue={u => String(u.id)}
                getLabel={u => u.name}
                getSubLabel={u => u.username}
                placeholder={copy.placeholder}
                emptyText="No active users"
                ariaLabel={f.aria}
                error={!!error}
                disabled={readOnly}
              />
              {error
                ? <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />{error}</p>
                : <p className="text-[11px] text-slate-400 mt-1.5">{copy.hint}</p>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* "Assigned Team — set at the Contract Initiating Form": read-only. */
export function AssignedTeamSelectCard({ namesByGroup, sourceNote = '- set at the Contract Initiating Form' }) {
  return (
    <Card className="p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <UserCheck size={16} style={{ color: '#0089cf' }} aria-hidden="true" />
        <h3 className="text-base font-bold" style={{ color: '#1e293b' }}>Assigned Team</h3>
        <span className="text-xs font-medium text-slate-400">{sourceNote}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FIELDS.map(f => {
          const copy = ASSIGN_TEAM_COPY[f.key]
          const name = namesByGroup[f.key]
          return (
            <div key={f.key}>
              <Label>{copy.label}</Label>
              <div
                aria-disabled="true"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg truncate cursor-not-allowed"
                style={{ background: 'rgba(100,116,139,0.06)', border: '1px solid #e2e8f0', color: name ? '#1e293b' : '#94a3b8' }}
              >
                {name || 'Not assigned'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">{copy.hint}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
