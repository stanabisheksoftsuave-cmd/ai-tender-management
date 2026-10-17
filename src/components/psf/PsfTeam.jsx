/*
 * PSF "Team & Submit" step — the tender's team, either assigned here (Next.js
 * CifAssignTeamCard: three single-selects, all required) when the Contract
 * Initiating Form did not set it, or shown read-only (Next.js AssignedTeamRow).
 */

import { UserCheck } from 'lucide-react'
import Card from '../ui/Card'
import SearchableSelect from '../ui/SearchableSelect'
import { PSF_TEAM_ROLES } from '../../data/psfTemplate'

/**
 * @param {object} props
 * @param {Record<string,{id,name,username}[]>} props.rosters  active users per role (keyed by role)
 * @param {Record<string,string|number|null>} props.selected  picked user id per role
 * @param {(role:string, id:string|number|null) => void} props.onChange
 */
export function PsfAssignTeamCard({ rosters, selected, onChange }) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <UserCheck size={16} style={{ color: '#0089cf' }} />
        <h3 className="text-base font-bold text-slate-800">Assign Team</h3>
        <span className="text-xs font-medium text-slate-400">- all three required</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PSF_TEAM_ROLES.map(r => (
          <div key={r.role} className="min-w-0">
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              {r.field} <span className="text-red-400">*</span>
            </label>
            <SearchableSelect
              value={selected[r.role] ?? null}
              onChange={id => onChange(r.role, id)}
              options={rosters[r.role] || []}
              getValue={u => u.id}
              getLabel={u => u.name}
              getSubLabel={u => u.username || u.email}
              placeholder={r.placeholder}
              searchPlaceholder={`Search ${r.searchLabel.toLowerCase()}...`}
              emptyText={r.emptyText}
              ariaLabel={r.field}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">{r.note}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * The team, displayed. `members` is one entry per role:
 * `{ role, label, names: string[] }`.
 */
export function PsfAssignedTeamRow({ members, description }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}>
          <UserCheck size={15} />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Team</span>
          {description && <span className="block text-[11px] text-slate-400">{description}</span>}
        </span>
        <ul className="ml-auto flex flex-wrap items-center gap-2">
          {members.map(m => (
            <li key={m.role}>
              {m.names.length ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: '#0089cf' }}>
                    {m.names[0].trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-800">
                    <span className="font-medium text-slate-500">{`${m.label}: `}</span>
                    <span className="font-semibold">{m.names.join(', ')}</span>
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {`${m.label}: Not assigned`}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
