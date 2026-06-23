import { useState } from 'react'
import {
  Users, Plus, Search, Shield, Edit2, Trash2, MoreVertical,
  CheckCircle, XCircle, Mail, Key, Eye, EyeOff, X, ChevronDown,
  Lock, Unlock, UserCheck, AlertTriangle, Save
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

// ── Permission levels ──────────────────────────────────────────
const ACCESS = {
  CRUD:   { label: 'Full (CRUD)',     color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
  ACTION: { label: 'Read + Action',   color: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' },
  READ:   { label: 'Read Only',       color: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  NONE:   { label: 'No Access',       color: 'bg-red-50 text-red-400 ring-1 ring-red-100' },
}

const MODULES = [
  { key: 'itt_creation',    label: 'ITT Creation',         icon: '📄' },
  { key: 'itt_approval',    label: 'ITT Approval',         icon: '✅' },
  { key: 'tender_export',   label: 'Tender Export',        icon: '📤' },
  { key: 'ingestion',       label: 'Ingestion',            icon: '📥' },
  { key: 'tech_eval',       label: 'Technical Evaluation', icon: '🔬' },
  { key: 'comm_eval',       label: 'Commercial Evaluation',icon: '💰' },
  { key: 'legal_review',    label: 'Legal Review',         icon: '⚖️' },
  { key: 'mgmt_review',     label: 'Management Review',    icon: '👔' },
  { key: 'contract_draft',  label: 'Contract Draft',       icon: '📝' },
  { key: 'audit_log',       label: 'Audit Log',            icon: '🔍' },
  { key: 'system_health',   label: 'System Health',        icon: '🖥️' },
]

const ROLES = [
  { id: 'admin',          label: 'Administrator',        color: '#92400E', superAdmin: true },
  { id: 'pof',            label: 'Procurement Officer',  color: '#2563EB' },
  { id: 'tech_eval',      label: 'Technical Evaluator',  color: '#059669' },
  { id: 'comm_eval',      label: 'Commercial Evaluator', color: '#D97706' },
  { id: 'legal_review',   label: 'Legal Reviewer',       color: '#7C3AED' },
  { id: 'mgmt_review',    label: 'Management Reviewer',  color: '#0F766E' },
  { id: 'contractor_eng', label: 'Contractor Engineer',  color: '#B45309' },
  { id: 'it_admin',       label: 'IT Admin',             color: '#DC2626' },
  { id: 'bidder',         label: 'Bidder',               color: '#0EA5E9' },
]

// Default permission matrix per role
const defaultMatrix = {
  admin:          { itt_creation: 'CRUD', itt_approval: 'CRUD', tender_export: 'CRUD', ingestion: 'CRUD', tech_eval: 'CRUD', comm_eval: 'CRUD', legal_review: 'CRUD', mgmt_review: 'CRUD', contract_draft: 'CRUD', audit_log: 'CRUD', system_health: 'CRUD' },
  pof:            { itt_creation: 'CRUD', itt_approval: 'READ',   tender_export: 'CRUD', ingestion: 'CRUD', tech_eval: 'READ', comm_eval: 'READ', legal_review: 'READ', mgmt_review: 'READ', contract_draft: 'NONE', audit_log: 'NONE', system_health: 'NONE' },
  tech_eval:      { itt_creation: 'NONE', itt_approval: 'NONE',   tender_export: 'NONE', ingestion: 'NONE', tech_eval: 'CRUD', comm_eval: 'NONE', legal_review: 'NONE', mgmt_review: 'NONE', contract_draft: 'NONE', audit_log: 'NONE', system_health: 'NONE' },
  comm_eval:      { itt_creation: 'NONE', itt_approval: 'NONE',   tender_export: 'NONE', ingestion: 'NONE', tech_eval: 'NONE', comm_eval: 'CRUD', legal_review: 'NONE', mgmt_review: 'NONE', contract_draft: 'NONE', audit_log: 'NONE', system_health: 'NONE' },
  legal_review:   { itt_creation: 'NONE', itt_approval: 'NONE',   tender_export: 'NONE', ingestion: 'NONE', tech_eval: 'READ', comm_eval: 'READ', legal_review: 'ACTION', mgmt_review: 'NONE', contract_draft: 'NONE', audit_log: 'NONE', system_health: 'NONE' },
  mgmt_review:    { itt_creation: 'NONE', itt_approval: 'NONE',   tender_export: 'NONE', ingestion: 'NONE', tech_eval: 'READ', comm_eval: 'READ', legal_review: 'READ',   mgmt_review: 'ACTION', contract_draft: 'NONE', audit_log: 'NONE', system_health: 'NONE' },
  contractor_eng: { itt_creation: 'NONE', itt_approval: 'NONE',   tender_export: 'NONE', ingestion: 'NONE', tech_eval: 'READ', comm_eval: 'READ', legal_review: 'READ',   mgmt_review: 'READ',   contract_draft: 'CRUD', audit_log: 'NONE', system_health: 'NONE' },
  it_admin:       { itt_creation: 'NONE', itt_approval: 'NONE',   tender_export: 'NONE', ingestion: 'NONE', tech_eval: 'NONE', comm_eval: 'NONE', legal_review: 'NONE',   mgmt_review: 'NONE',   contract_draft: 'NONE', audit_log: 'NONE', system_health: 'CRUD' },
  bidder:         { itt_creation: 'NONE', itt_approval: 'NONE',   tender_export: 'NONE', ingestion: 'NONE', tech_eval: 'NONE', comm_eval: 'NONE', legal_review: 'NONE',   mgmt_review: 'NONE',   contract_draft: 'NONE', audit_log: 'NONE', system_health: 'NONE' },
}

const emptyForm = { name: '', email: '', role: 'pof', status: 'active', company: '', password: '' }

function AccessPill({ level, size = 'sm' }) {
  const a = ACCESS[level]
  if (!a) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.color} ${size === 'xs' ? 'text-[9px] px-1.5' : ''}`}>
      {a.label}
    </span>
  )
}

function RoleBadge({ roleId }) {
  const r = ROLES.find(r => r.id === roleId)
  if (!r) return null
  if (r.superAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 bg-amber-50 text-amber-800 ring-amber-300">
        <Shield size={9} className="text-amber-600" />
        Administrator
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1"
      style={{ background: r.color + '15', color: r.color, ringColor: r.color + '40' }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.color }} />
      {r.label}
    </span>
  )
}

export default function UserManagement() {
  const { users, updateUser, addUser, removeUser } = useAuth()
  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [menuOpen, setMenuOpen] = useState(null)
  const [matrix, setMatrix] = useState(defaultMatrix)
  const [savedRole, setSavedRole] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const filtered = users.filter(u => {
    const email = (u.email || u.username || '').toLowerCase()
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || email.includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.roleId === filterRole
    return matchSearch && matchRole
  })

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setFormErrors({}); setShowPassword(false); setShowModal(true) }
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email || u.username || '', role: u.roleId, status: u.status, company: u.company || '', password: '' }); setFormErrors({}); setShowModal(true); setMenuOpen(null) }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    return errs
  }

  const handleSave = () => {
    const errs = validateForm()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    if (editUser) {
      updateUser(editUser.id, { name: form.name, email: form.email, roleId: form.role, status: form.status, company: form.company })
    } else {
      const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      const hasPassword = form.password.trim().length > 0
      addUser({
        name: form.name, email: form.email, username: form.email,
        roleId: form.role, status: form.status, company: form.company, avatar: initials,
        ...(hasPassword ? { password: form.password, mustSetPassword: false } : {}),
      })
    }
    setShowModal(false)
  }

  const toggleStatus = (id) => {
    const u = users.find(u => u.id === id)
    if (u) updateUser(id, { status: u.status === 'active' ? 'inactive' : 'active' })
    setMenuOpen(null)
  }

  const deleteUser = (id) => { removeUser(id); setDeleteConfirm(null); setMenuOpen(null) }

  // Remembers last non-NONE level so toggling back on restores it
  const [lastLevel, setLastLevel] = useState({})

  const toggleModule = (roleId, moduleKey) => {
    const current = matrix[roleId]?.[moduleKey] || 'NONE'
    if (current === 'NONE') {
      const restored = lastLevel[`${roleId}_${moduleKey}`] || 'READ'
      setMatrix(prev => ({ ...prev, [roleId]: { ...prev[roleId], [moduleKey]: restored } }))
    } else {
      setLastLevel(prev => ({ ...prev, [`${roleId}_${moduleKey}`]: current }))
      setMatrix(prev => ({ ...prev, [roleId]: { ...prev[roleId], [moduleKey]: 'NONE' } }))
    }
  }

  const setLevel = (roleId, moduleKey, level) => {
    setMatrix(prev => ({ ...prev, [roleId]: { ...prev[roleId], [moduleKey]: level } }))
  }

  const saveMatrix = (roleId) => { setSavedRole(roleId); setTimeout(() => setSavedRole(null), 2000) }

  const stats = [
    { label: 'Total Users', value: users.length, sub: `${users.filter(u => u.status === 'active').length} active` },
    { label: 'Roles Assigned', value: new Set(users.map(u => u.roleId)).size, sub: `of ${ROLES.length} roles` },
    { label: 'Active Today', value: 5, sub: 'Logged in today' },
    { label: 'Pending Invite', value: 0, sub: 'Awaiting signup' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[{ id: 'users', label: 'Users' }, { id: 'access', label: 'Access Control' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'users' && (
          <Button onClick={openAdd} size="sm">
            <Plus size={13} /> Onboard User
          </Button>
        )}
      </div>

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            >
              <option value="all">All Roles</option>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {/* User table */}
          <Card>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors group ${u.superAdmin ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 relative"
                          style={{ background: `${ROLES.find(r => r.id === u.roleId)?.color || '#64748b'}` }}>
                          {u.avatar}
                          {u.superAdmin && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                              <Shield size={7} className="text-white" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            {u.name}
                            {u.superAdmin && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">You</span>}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} />{u.email || u.username}</p>
                          {u.company && <p className="text-[10px] text-sky-600 font-medium">{u.company}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><RoleBadge roleId={u.roleId} /></td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full
                        ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-mono hidden lg:table-cell">{u.lastLogin}</td>
                    <td className="px-4 py-3.5 relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {menuOpen === u.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 fade-in">
                            <button onClick={() => openEdit(u)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                              <Edit2 size={12} /> Edit User
                            </button>
                            {!u.superAdmin && (
                              <>
                                <button onClick={() => toggleStatus(u.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                  {u.status === 'active' ? <><Lock size={12} /> Deactivate</> : <><Unlock size={12} /> Activate</>}
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button onClick={() => { setDeleteConfirm(u); setMenuOpen(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50">
                                  <Trash2 size={12} /> Remove User
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ── Access Control Tab ── */}
      {tab === 'access' && (
        <div className="space-y-4">

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-xs text-slate-500 font-semibold">Access levels:</span>
            {[
              { label: 'Read Only',     cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
              { label: 'Read + Action', cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
              { label: 'Full Access',   cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
            ].map(l => (
              <span key={l.label} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ring-1 ${l.cls}`}>{l.label}</span>
            ))}
            <span className="text-[11px] text-slate-400">— Toggle a module on/off, then choose the access level when enabled.</span>
          </div>

          {ROLES.map(role => {
            const enabledCount = MODULES.filter(m => (matrix[role.id]?.[m.key] || 'NONE') !== 'NONE').length
            return (
              <Card key={role.id} className={`overflow-hidden ${role.superAdmin ? 'ring-1 ring-amber-200' : ''}`}>
                {/* Role header */}
                <div className={`flex items-center justify-between px-5 py-3.5 border-b border-slate-100 ${role.superAdmin ? 'bg-amber-50/60' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    {role.superAdmin
                      ? <Shield size={14} className="text-amber-600" />
                      : <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: role.color }} />}
                    <h3 className="text-sm font-semibold text-slate-800">{role.label}</h3>
                    {role.superAdmin
                      ? <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">System — Full Access</span>
                      : <span className="text-[10px] text-slate-400">{enabledCount}/{MODULES.length} modules enabled · {users.filter(u => u.roleId === role.id).length} user(s)</span>}
                  </div>
                  {role.superAdmin
                    ? <span className="text-[11px] text-amber-600 flex items-center gap-1"><Lock size={11} /> Cannot be modified</span>
                    : <Button size="sm" variant={savedRole === role.id ? 'secondary' : 'primary'} onClick={() => saveMatrix(role.id)}>
                        {savedRole === role.id ? <><CheckCircle size={12} /> Saved!</> : <><Save size={12} /> Save Changes</>}
                      </Button>}
                </div>

                {/* Module rows */}
                <div className="divide-y divide-slate-50">
                  {MODULES.map(mod => {
                    const level   = matrix[role.id]?.[mod.key] || 'NONE'
                    const enabled = level !== 'NONE'

                    return (
                      <div key={mod.key} className={`flex items-center gap-4 px-5 py-3 transition-colors ${enabled ? 'hover:bg-slate-50/40' : 'bg-slate-50/30 opacity-60 hover:opacity-80'}`}>

                        {/* Module name */}
                        <div className="flex items-center gap-2.5 w-52 shrink-0">
                          <span className="text-base leading-none">{mod.icon}</span>
                          <span className={`text-sm font-medium ${enabled ? 'text-slate-700' : 'text-slate-400'}`}>{mod.label}</span>
                        </div>

                        {/* Toggle switch */}
                        {role.superAdmin ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="relative inline-flex w-11 h-6 rounded-full bg-amber-400 shrink-0">
                              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm translate-x-5" />
                            </div>
                            <span className="text-[11px] text-amber-600 font-medium">Always On</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleModule(role.id, mod.key)}
                            className="relative inline-flex w-11 h-6 rounded-full shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
                            style={{ background: enabled ? 'var(--color-primary)' : '#cbd5e1' }}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        )}

                        {/* Level selector — only when enabled and not superAdmin */}
                        {!role.superAdmin && enabled && (
                          <div className="flex items-center gap-1">
                            {[
                              { val: 'READ',   label: 'Read Only',     cls: 'border-slate-300 text-slate-600 bg-slate-100' },
                              { val: 'ACTION', label: 'Read + Action', cls: 'border-blue-300 text-blue-700 bg-blue-100' },
                              { val: 'CRUD',   label: 'Full Access',   cls: 'border-emerald-300 text-emerald-700 bg-emerald-100' },
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setLevel(role.id, mod.key, opt.val)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all
                                  ${level === opt.val
                                    ? `${opt.cls} ring-2 ring-offset-1 ring-current`
                                    : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300 hover:text-slate-500'}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Disabled label */}
                        {!role.superAdmin && !enabled && (
                          <span className="text-[10px] text-slate-400 font-medium">No Access</span>
                        )}

                        {/* Super admin full access label */}
                        {role.superAdmin && (
                          <AccessPill level="CRUD" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in"
          onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="text-center font-bold text-slate-800 text-base mb-1">Remove User</h3>
              <p className="text-center text-sm text-slate-500">
                Are you sure you want to remove <span className="font-semibold text-slate-700">{deleteConfirm.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(deleteConfirm.id)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in"
          onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <UserCheck size={15} className="text-[var(--color-primary)]" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">{editUser ? 'Edit User' : 'Onboard New User'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Full Name <span className="text-red-500">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jane Doe"
                  className={`w-full px-3 py-2 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-colors
                    ${formErrors.name ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-slate-200 focus:ring-[var(--color-primary)]/20'}`}
                />
                {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@company.com"
                    className={`w-full pl-8 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-colors
                      ${formErrors.email ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-slate-200 focus:ring-[var(--color-primary)]/20'}`}
                  />
                </div>
                {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              {/* Password — new users only, optional */}
              {!editUser && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    Password <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Leave blank — user sets it on first login"
                      className="w-full pl-8 pr-9 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {form.password ? 'User can log in immediately with this password.' : 'User will create their own password on first login.'}
                  </p>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Assign Role <span className="text-red-500">*</span></label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                >
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {form.role && (
                  <div className="mt-2 bg-slate-50 rounded-xl px-3 py-2.5 space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Default permissions for this role</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MODULES.filter(m => defaultMatrix[form.role]?.[m.key] !== 'NONE').map(m => (
                        <span key={m.key} className="text-[10px] flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          {m.icon} {m.label}
                          <span className={`ml-0.5 font-bold ${defaultMatrix[form.role]?.[m.key] === 'CRUD' ? 'text-emerald-600' : defaultMatrix[form.role]?.[m.key] === 'ACTION' ? 'text-blue-600' : 'text-slate-400'}`}>
                            · {defaultMatrix[form.role]?.[m.key]}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Company Name — bidder only */}
              {form.role === 'bidder' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Company Name <span className="text-red-500">*</span></label>
                  <input
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="e.g. TechSolutions Ltd"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Account Status</label>
                <div className="flex gap-2">
                  {['active', 'inactive'].map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors
                        ${form.status === s ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {s === 'active' ? '✓ Active' : '✗ Inactive'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2 border-t border-slate-100 pt-4 shrink-0">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 justify-center" onClick={handleSave}>
                {editUser ? <><Save size={13} /> Save Changes</> : <><UserCheck size={13} /> Onboard User</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
