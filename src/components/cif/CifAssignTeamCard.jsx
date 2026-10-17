import { AlertCircle, UserCheck } from 'lucide-react'
import Card from '../ui/Card'
import SearchableSelect from '../ui/SearchableSelect'
import { isTeamComplete } from './cifUtils'

const ROLES = [
  {
    key: 'contractEngineerId',
    rosterKey: 'contractEngineers',
    label: 'Contract Engineers',
    searchLabel: 'Contract Engineers',
    placeholder: 'Select Contract Engineers...',
    emptyText: 'No active Contract Engineers',
    note: 'Picks this up for the PQQ financial assessment, PSF and ITT creation.',
  },
  {
    key: 'hseId',
    rosterKey: 'hseOfficers',
    label: 'HSE',
    searchLabel: 'HSE Officers',
    placeholder: 'Select HSE Officers...',
    emptyText: 'No active HSE Officers',
    note: 'Owns Section C - QHSSE Requirements on the ITT.',
  },
  {
    key: 'icvId',
    rosterKey: 'icvOfficers',
    label: 'LC',
    searchLabel: 'LC Leads',
    placeholder: 'Select LC Leads...',
    emptyText: 'No active LC Officers',
    note: 'Owns Section H - LC Requirements on the ITT.',
  },
]

/**
 * The tender's team, assigned here and nowhere else (MAIN CifAssignTeamCard):
 * one Contract Engineer, one HSE and one LC, each a single select over the
 * active users holding that role. All three are required.
 */
export default function CifAssignTeamCard({ assignments, onChange, rosters, showError }) {
  const incomplete = !isTeamComplete(assignments, rosters)

  return (
    <Card className="p-4 sm:p-6 mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm olng-slide-up" style={{ animationDelay: '90ms' }}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <UserCheck size={16} style={{ color: '#0089cf' }} aria-hidden="true" />
        <h3 className="text-base font-bold" style={{ color: '#1e293b' }}>Assign Team</h3>
        <span className="text-xs font-medium text-slate-400">- all three required</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ROLES.map(role => (
          <div key={role.key} className="min-w-0">
            <label className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#1e293b' }}>
              {role.label} <span className="font-secondary text-red-500">*</span>
            </label>
            <SearchableSelect
              ariaLabel={role.label}
              value={assignments[role.key]}
              onChange={id => onChange({ [role.key]: id ?? null })}
              options={rosters[role.rosterKey]}
              getValue={u => u.id}
              getLabel={u => u.name}
              getSubLabel={u => u.username}
              placeholder={role.placeholder}
              searchPlaceholder={`Search ${role.searchLabel.toLowerCase()}…`}
              emptyText={role.emptyText}
              buttonClassName="px-3.5 py-2.5"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">{role.note}</p>
          </div>
        ))}
      </div>

      {showError && incomplete && (
        <p className="mt-3 flex items-center gap-1 text-[11px] text-red-500">
          <AlertCircle size={11} aria-hidden="true" />
          Select a Contract Engineer, HSE Representative and LC Representative
        </p>
      )}
    </Card>
  )
}
