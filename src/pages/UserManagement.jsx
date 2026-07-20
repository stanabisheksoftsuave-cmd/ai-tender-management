import { useState, useEffect } from 'react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useTheme } from '../context/ThemeContext'

// ── SVG primitive ────────────────────────────────────────────────────────────
const Svg = ({ size = 16, sw = 1.6, style, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)

// ── Action icons (inline SVG) ────────────────────────────────────────────────
const IcoPlus      = p => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
const IcoSearch    = p => <Svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>
const IcoShield    = p => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>
const IcoEdit      = p => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
const IcoTrash     = p => <Svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>
const IcoMore      = p => <Svg {...p}><circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/></Svg>
const IcoCheckCircle = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const IcoMail      = p => <Svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Svg>
const IcoKey       = p => <Svg {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></Svg>
const IcoEye       = p => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>
const IcoEyeOff    = p => <Svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const IcoX         = p => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>
const IcoLock      = p => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>
const IcoUnlock    = p => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></Svg>
const IcoUserCheck = p => <Svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></Svg>
const IcoSave      = p => <Svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Svg>
const IcoArrows    = p => <Svg {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></Svg>
const IcoUsers     = p => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>

// ── Module icon SVGs (paths from src/assets/icons/) ──────────────────────────
const ModSvg = {
  user_management: p => <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>,
  task_assignment: p => <Svg {...p}>
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </Svg>,
  itt_creation: p => <Svg {...p}>
    <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.7 2.8-1.7 3.7A6 6 0 0 1 18 16H6a6 6 0 0 1 3.7-6.3A4 4 0 0 1 8 6a4 4 0 0 1 4-4z"/>
    <line x1="12" y1="16" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/>
  </Svg>,
  tender_export: p => <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>
  </Svg>,
  ingestion: p => <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </Svg>,
  tech_eval: p => <Svg {...p}>
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
    <circle cx="15" cy="15" r="2"/><path d="M16.5 16.5l2 2"/>
  </Svg>,
  comm_eval: p => <Svg {...p}>
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </Svg>,
  mgmt_review: p => <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>,
  contract_creation: p => <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="12" y2="16"/>
    <path d="M14 15l2 2 4-4"/>
  </Svg>,
  audit_log: p => <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>
  </Svg>,
}

// ── Data ─────────────────────────────────────────────────────────────────────
const ROLE_COLORS = ['#0089cf','#1b4c6f','#059669','#D97706','#7C3AED','#DC2626','#0891B2','#92400E','#BE185D','#1D4ED8']

const DEFAULT_ROLES = [
  { id: 'it_admin',    label: 'IT Admin',            color: '#7C3AED' },
  { id: 'biz_admin',   label: 'Business Admin',       color: '#0F766E' },
  { id: 'pof',         label: 'Contract Engineer',    color: '#0089cf' },
  { id: 'tech_eval',   label: 'Technical Evaluator',  color: '#059669' },
  { id: 'comm_eval',   label: 'Commercial Evaluator', color: '#D97706' },
  { id: 'mgmt_review', label: 'Management Reviewer',  color: '#0F766E' },
]

const MODULES = [
  { key: 'user_management',   label: 'User Management'       },
  { key: 'task_assignment',   label: 'Task Assignment'        },
  { key: 'audit_log',         label: 'Audit Log'             },
  { key: 'itt_creation',      label: 'ITT Creation'          },
  { key: 'tender_export',     label: 'Tender Export'         },
  { key: 'ingestion',         label: 'Bid Ingestion'         },
  { key: 'tech_eval',         label: 'Technical Evaluation'  },
  { key: 'comm_eval',         label: 'Commercial Evaluation' },
  { key: 'mgmt_review',       label: 'Management Review'     },
  { key: 'contract_creation', label: 'Contract Creation'     },
]

const DEFAULT_MATRIX = {
  it_admin:    { user_management:'CRUD', task_assignment:'CRUD', audit_log:'CRUD', itt_creation:'NONE', tender_export:'NONE', ingestion:'NONE', tech_eval:'NONE', comm_eval:'NONE', mgmt_review:'NONE', contract_creation:'NONE' },
  biz_admin:   { user_management:'NONE', task_assignment:'CRUD', audit_log:'READ', itt_creation:'READ', tender_export:'READ', ingestion:'READ', tech_eval:'READ', comm_eval:'READ', mgmt_review:'READ', contract_creation:'READ' },
  pof:         { user_management:'NONE', task_assignment:'CRUD', audit_log:'NONE', itt_creation:'CRUD', tender_export:'CRUD', ingestion:'CRUD', tech_eval:'READ', comm_eval:'READ', mgmt_review:'READ', contract_creation:'CRUD' },
  tech_eval:   { user_management:'NONE', task_assignment:'NONE', audit_log:'NONE', itt_creation:'NONE', tender_export:'NONE', ingestion:'NONE', tech_eval:'CRUD', comm_eval:'NONE', mgmt_review:'NONE', contract_creation:'NONE' },
  comm_eval:   { user_management:'NONE', task_assignment:'NONE', audit_log:'NONE', itt_creation:'NONE', tender_export:'NONE', ingestion:'NONE', tech_eval:'NONE', comm_eval:'CRUD', mgmt_review:'NONE', contract_creation:'NONE' },
  mgmt_review: { user_management:'NONE', task_assignment:'NONE', audit_log:'NONE', itt_creation:'NONE', tender_export:'NONE', ingestion:'NONE', tech_eval:'READ', comm_eval:'READ', mgmt_review:'ACTION', contract_creation:'NONE' },
}

const emptyModule   = () => Object.fromEntries(MODULES.map(m => [m.key, 'NONE']))
const emptyUser     = { name: '', email: '', role: 'pof', status: 'active', password: '' }
const emptyRoleForm = { label: '', color: '#0089cf', description: '' }

// ── Small sub-components ─────────────────────────────────────────────────────
function RolePill({ role }) {
  if (!role) return null
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: role.color + '18', color: role.color, border: `1px solid ${role.color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: role.color }} />
      {role.label}
    </span>
  )
}

function Toggle({ on, onChange, locked }) {
  return (
    <button type="button" onClick={locked ? undefined : onChange} style={{
      width: 40, height: 22, borderRadius: 11, position: 'relative', border: 'none', padding: 0, flexShrink: 0,
      background: locked ? 'var(--color-primary-dark,#1b4c6f)' : on ? 'var(--color-primary)' : '#CBD5E1',
      cursor: locked ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on || locked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { user: currentUser, users, updateUser, addUser, removeUser } = useAuth()
  const isItAdmin = currentUser?.role?.id === 'it_admin'
  const { tenders, updateTender, dropdownConfig, updateDropdownConfig } = useTenders()
  const { isDark } = useTheme()

  const [tab,           setTab]           = useState(isItAdmin ? 'users' : 'dropdowns')
  const [search,        setSearch]        = useState('')
  const [filterRole,    setFilterRole]    = useState('all')
  const [menuOpen,      setMenuOpen]      = useState(null)

  const [showUserModal, setShowUserModal] = useState(false)
  const [editUser,      setEditUser]      = useState(null)
  const [userForm,      setUserForm]      = useState(emptyUser)
  const [formErrors,    setFormErrors]    = useState({})
  const [showPwd,       setShowPwd]       = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [roles,  setRoles]  = useState(() => {
    try {
      const s = localStorage.getItem('atm_roles')
      if (!s) return DEFAULT_ROLES
      const parsed = JSON.parse(s)
      // Merge: ensure all DEFAULT_ROLES exist (remove superAdmin flag if stale)
      const ids = new Set(parsed.map(r => r.id))
      const missing = DEFAULT_ROLES.filter(r => !ids.has(r.id))
      const merged = [...parsed.map(r => ({ ...r, superAdmin: undefined })), ...missing]
      return merged
    } catch { return DEFAULT_ROLES }
  })
  const [matrix, setMatrix] = useState(() => {
    try {
      const s = localStorage.getItem('atm_matrix')
      if (!s) return DEFAULT_MATRIX
      const parsed = JSON.parse(s)
      // Ensure all DEFAULT_MATRIX roles have the new module keys
      const newKeys = Object.keys(DEFAULT_MATRIX.it_admin)
      const needsReset = !newKeys.every(k => k in (parsed.it_admin || {}))
      if (needsReset) { localStorage.removeItem('atm_matrix'); return DEFAULT_MATRIX }
      return parsed
    } catch { return DEFAULT_MATRIX }
  })
  const [savedRole, setSavedRole] = useState(null)
  const [lastLevel, setLastLevel] = useState({})

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleForm,      setRoleForm]      = useState(emptyRoleForm)

  const [showReassign,   setShowReassign]   = useState(false)
  const [reassignSource, setReassignSource] = useState(null)
  const [reassignTarget, setReassignTarget] = useState('')

  // ── Dropdown Config state ──
  const [newDropdownItem, setNewDropdownItem] = useState({})
  const [dropdownSaved, setDropdownSaved] = useState(null)

  // ── Theme palette ──────────────────────────────────────────────────────────
  const surface = isDark ? '#111827' : 'var(--color-surface)'
  const surfBg  = isDark ? 'rgba(255,255,255,0.04)' : 'var(--color-surface-2)'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'var(--color-border)'
  const text    = isDark ? '#F1F5F9' : 'var(--color-primary-dark,#0F172A)'
  const sub     = isDark ? '#94A3B8' : '#64748B'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff'
  const shadow  = isDark
    ? '0 1px 4px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)'
    : 'var(--color-shadow,0 1px 4px rgba(27,76,111,0.07),0 4px 16px rgba(27,76,111,0.10))'

  useEffect(() => { localStorage.setItem('atm_roles',  JSON.stringify(roles))  }, [roles])
  useEffect(() => { localStorage.setItem('atm_matrix', JSON.stringify(matrix)) }, [matrix])

  const inp = (err) => ({
    width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 10, outline: 'none',
    background: inputBg, color: text,
    border: `1.5px solid ${err ? '#F87171' : border}`,
    transition: 'border-color 0.15s',
  })

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const em = (u.email || u.username || '').toLowerCase()
    return (u.name.toLowerCase().includes(search.toLowerCase()) || em.includes(search.toLowerCase()))
      && (filterRole === 'all' || u.roleId === filterRole)
  })

  const getRoleObj = id => roles.find(r => r.id === id)

  const getAssigned = user => {
    if (!user) return []
    if (user.roleId === 'tech_eval')   return tenders.filter(t => t.status === 'tech_eval'   && t.assignedTechEval?.id === user.id)
    if (user.roleId === 'comm_eval')   return tenders.filter(t => t.status === 'comm_eval'   && t.assignedCommEval?.id === user.id)
    if (user.roleId === 'pof')         return tenders.filter(t => ['draft','upload','award'].includes(t.status))
    if (user.roleId === 'mgmt_review') return tenders.filter(t => t.status === 'mgmt_review')
    return []
  }

  const sameRoleUsers = reassignSource
    ? users.filter(u => u.roleId === reassignSource.roleId && u.id !== reassignSource.id && u.status === 'active')
    : []

  // ── User CRUD ──────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditUser(null); setUserForm(emptyUser); setFormErrors({}); setShowPwd(false); setShowUserModal(true) }
  const openEdit = u  => {
    setEditUser(u)
    setUserForm({ name: u.name, email: u.email || u.username || '', role: u.roleId, status: u.status, password: '' })
    setFormErrors({})
    setShowUserModal(true)
    setMenuOpen(null)
  }

  const validate = () => {
    const e = {}
    if (!userForm.name.trim())  e.name  = 'Name is required'
    if (!userForm.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) e.email = 'Enter a valid email'
    return e
  }

  const saveUser = () => {
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    if (editUser) {
      updateUser(editUser.id, { name: userForm.name, email: userForm.email, roleId: userForm.role, status: userForm.status })
    } else {
      const initials = userForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      addUser({ name: userForm.name, email: userForm.email, username: userForm.email, roleId: userForm.role, status: userForm.status, avatar: initials })
    }
    setShowUserModal(false)
  }

  const toggleStatus = id => {
    const u = users.find(u => u.id === id)
    if (u) updateUser(id, { status: u.status === 'active' ? 'inactive' : 'active' })
    setMenuOpen(null)
  }
  const deleteUser = id => { removeUser(id); setDeleteConfirm(null) }

  // ── Permissions ────────────────────────────────────────────────────────────
  const toggleModule = (roleId, key) => {
    const cur = matrix[roleId]?.[key] || 'NONE'
    if (cur === 'NONE') {
      setMatrix(p => ({ ...p, [roleId]: { ...p[roleId], [key]: lastLevel[`${roleId}_${key}`] || 'READ' } }))
    } else {
      setLastLevel(p => ({ ...p, [`${roleId}_${key}`]: cur }))
      setMatrix(p => ({ ...p, [roleId]: { ...p[roleId], [key]: 'NONE' } }))
    }
  }
  const setLevel   = (roleId, key, lv) => setMatrix(p => ({ ...p, [roleId]: { ...p[roleId], [key]: lv } }))
  const saveMatrix = roleId => { setSavedRole(roleId); setTimeout(() => setSavedRole(null), 2000) }

  // ── Create role ────────────────────────────────────────────────────────────
  const createRole = () => {
    if (!roleForm.label.trim()) return
    const id = roleForm.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    setRoles(p => [...p, { id, label: roleForm.label.trim(), color: roleForm.color, custom: true }])
    setMatrix(p => ({ ...p, [id]: emptyModule() }))
    setRoleForm(emptyRoleForm)
    setShowRoleModal(false)
  }

  const deleteRole = id => {
    setRoles(p => p.filter(r => r.id !== id))
    setMatrix(p => { const n = { ...p }; delete n[id]; return n })
  }

  // ── Reassign ───────────────────────────────────────────────────────────────
  const openReassign = u => { setReassignSource(u); setReassignTarget(''); setShowReassign(true); setMenuOpen(null) }
  const doReassign   = () => {
    if (!reassignSource || !reassignTarget) return
    const target = users.find(u => String(u.id) === String(reassignTarget))
    if (!target) return
    getAssigned(reassignSource).forEach(t => {
      if (reassignSource.roleId === 'tech_eval')
        updateTender(t.id, { assignedTechEval: { id: target.id, name: target.name } })
      else if (reassignSource.roleId === 'comm_eval')
        updateTender(t.id, { assignedCommEval: { id: target.id, name: target.name } })
      else if (reassignSource.roleId === 'pof')
        updateTender(t.id, { assignedPof: { id: target.id, name: target.name } })
      else if (reassignSource.roleId === 'mgmt_review')
        updateTender(t.id, { assignedMgmt: { id: target.id, name: target.name } })
    })
    setShowReassign(false)
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Users',    value: users.length,                                    sub: `${users.filter(u => u.status==='active').length} active`,  Icon: IcoUsers },
    { label: 'Roles Defined',  value: roles.length,                                    sub: `${new Set(users.map(u=>u.roleId)).size} in use`,            Icon: IcoShield },
    { label: 'Active Now',     value: users.filter(u => u.status === 'active').length,  sub: 'Logged in today',                                           Icon: IcoCheckCircle },
    { label: 'Pending Invite', value: 0,                                                sub: 'Awaiting signup',                                           Icon: IcoMail },
  ]

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: text }}>User Management</h1>
          <p className="text-xs mt-0.5" style={{ color: sub }}>Manage system users, roles and access permissions</p>
        </div>
        <div>
          {tab === 'users'  && <Button onClick={openAdd}                      size="sm"><IcoPlus size={13} /> Onboard User</Button>}
          {tab === 'access' && <Button onClick={() => setShowRoleModal(true)} size="sm"><IcoPlus size={13} /> Create Role</Button>}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl p-5 flex items-start gap-3"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: shadow }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary)' + '15' }}>
              <s.Icon size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: sub }}>{s.label}</p>
              <p className="text-2xl font-extrabold leading-none mb-0.5" style={{ color: text }}>{s.value}</p>
              <p className="text-[11px]" style={{ color: sub }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'var(--color-border)' }}>
         {[{ id: 'users', label: 'Users' }, { id: 'access', label: 'Access Control' }, { id: 'dropdowns', label: 'Dropdowns' }]
          .filter(t => isItAdmin || t.id === 'dropdowns')
          .map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t.id
              ? { background: 'var(--color-primary)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
              : { background: 'transparent', color: sub }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════ USERS TAB ══════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <IcoSearch size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: sub, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email..."
                style={{ ...inp(), paddingLeft: 32, width: 240 }} />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              style={{ ...inp(), width: 'auto' }}>
              <option value="all">All Roles</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: shadow, overflow: 'visible' }}>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '34%' }} /><col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} /><col style={{ width: '19%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}`, background: surfBg }}>
                  {['User', 'Role', 'Status', 'Last Login', 'Actions'].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const role    = getRoleObj(u.roleId)
                  const assigned = getAssigned(u)
                  const dropUp  = idx >= filtered.length - 2
                  return (
                    <tr key={u.id} className="group transition-colors"
                      style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${border}` : 'none' }}
                      onMouseOver={e => e.currentTarget.style.background = surfBg}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>

                      {/* User */}
                      <td className="px-5 py-3.5 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${role?.color || '#64748B'}, ${role?.color || '#64748B'}bb)` }}>
                            {u.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: text }}>{u.name}</p>
                            <p className="text-[11px] truncate flex items-center gap-1" style={{ color: sub }}>
                              <IcoMail size={10} />{u.email || u.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5"><RolePill role={role} /></td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={u.status === 'active'
                            ? { background: '#05966918', color: '#059669', border: '1px solid #05966930' }
                            : { background: '#94A3B818', color: '#94A3B8', border: '1px solid #94A3B830' }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: u.status === 'active' ? '#059669' : '#94A3B8',
                              boxShadow: u.status === 'active' ? '0 0 6px rgba(5,150,105,0.5)' : 'none' }} />
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Last login */}
                      <td className="px-5 py-3.5 text-xs font-mono" style={{ color: sub }}>{u.lastLogin || '—'}</td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 relative">
                        <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          style={{ background: surfBg, color: sub }}>
                          <IcoMore size={14} />
                        </button>

                        {menuOpen === u.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div className={`absolute right-0 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'} w-52 rounded-xl py-1.5 z-50`}
                              style={{ background: surface, border: `1px solid ${border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>

                              <MenuItem Icon={IcoEdit} label="Edit User" onClick={() => openEdit(u)} hoverBg={surfBg} color={text} />
                              {!isItAdmin && assigned.length > 0 && (
                                <MenuItem Icon={IcoArrows} label="Reassign Tasks" onClick={() => openReassign(u)} hoverBg={surfBg} color={text} badge={assigned.length} />
                              )}
                              {!u.superAdmin && (
                                <MenuItem
                                  Icon={u.status === 'active' ? IcoLock : IcoUnlock}
                                  label={u.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => toggleStatus(u.id)}
                                  hoverBg={surfBg} color={text} />
                              )}
                              {!u.superAdmin && (
                                <>
                                  <div className="h-px my-1 mx-2" style={{ background: border }} />
                                  <MenuItem Icon={IcoTrash} label="Remove User"
                                    onClick={() => { setDeleteConfirm(u); setMenuOpen(null) }}
                                    hoverBg="#FEF2F2" color="#EF4444" iconColor="#EF4444" />
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-14 text-center text-sm" style={{ color: sub }}>
                    No users found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════ ACCESS CONTROL ══════════════════════════ */}
      {tab === 'access' && (
        <div className="space-y-4">

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-xl"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <span className="text-xs font-semibold" style={{ color: sub }}>Permission levels:</span>
            {[
              { label: 'Read Only',     bg: 'rgba(100,116,139,0.1)', color: '#64748B' },
              { label: 'Read + Action', bg: 'var(--color-primary)12', color: 'var(--color-primary)' },
              { label: 'Full Access',   bg: 'rgba(5,150,105,0.1)',   color: '#059669' },
            ].map(l => (
              <span key={l.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: l.bg, color: l.color, border: `1px solid ${l.color}30` }}>
                {l.label}
              </span>
            ))}
          </div>

          {roles.map(role => {
            const enabledCount = MODULES.filter(m => (matrix[role.id]?.[m.key] || 'NONE') !== 'NONE').length
            const roleUsers    = users.filter(u => u.roleId === role.id)
            return (
              <div key={role.id} className="rounded-2xl overflow-hidden"
                style={{ background: surface, border: `1px solid ${border}`, boxShadow: shadow }}>

                {/* Role header */}
                <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-2"
                  style={{ borderBottom: `1px solid ${border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: role.color }}>
                      {role.label[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold" style={{ color: text }}>{role.label}</h3>
                        {role.custom && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--color-primary)15', color: 'var(--color-primary)' }}>Custom</span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: sub }}>
                        {enabledCount}/{MODULES.length} modules · {roleUsers.length} user(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteRole(role.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: '#EF4444' }}
                      onMouseOver={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <IcoTrash size={14} />
                    </button>
                    <button onClick={() => saveMatrix(role.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white"
                      style={{ background: savedRole === role.id ? '#059669' : 'var(--color-primary)', transition: 'background 0.2s' }}>
                      {savedRole === role.id
                        ? <><IcoCheckCircle size={12} /> Saved!</>
                        : <><IcoSave size={12} /> Save</>}
                    </button>
                  </div>
                </div>

                {/* Module rows */}
                {MODULES.map((mod, mi) => {
                  const level   = matrix[role.id]?.[mod.key] || 'NONE'
                  const enabled = level !== 'NONE'
                  const ModIcon = ModSvg[mod.key]
                  return (
                    <div key={mod.key} className="flex items-center gap-4 px-5 py-3 transition-colors flex-wrap"
                      style={{
                        borderBottom: mi < MODULES.length - 1 ? `1px solid ${border}` : 'none',
                        opacity: !enabled ? 0.45 : 1,
                      }}>

                      {/* Module name */}
                      <div className="flex items-center gap-2.5 shrink-0" style={{ width: 210 }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'var(--color-primary)12' }}>
                          {ModIcon && <ModIcon size={14} style={{ color: 'var(--color-primary)' }} />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: text }}>{mod.label}</span>
                      </div>

                      {/* Toggle */}
                      <Toggle on={enabled} onChange={() => toggleModule(role.id, mod.key)} />

                      {/* Level selector */}
                      {enabled && (
                        <div className="flex items-center gap-1.5">
                          {[
                            { val: 'READ',   label: 'Read Only',     activeColor: '#64748B' },
                            { val: 'ACTION', label: 'Read + Action', activeColor: 'var(--color-primary)' },
                            { val: 'CRUD',   label: 'Full Access',   activeColor: '#059669' },
                          ].map(opt => (
                            <button key={opt.val} onClick={() => setLevel(role.id, mod.key, opt.val)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                              style={level === opt.val
                                ? { background: opt.activeColor + '15', color: opt.activeColor, border: `1.5px solid ${opt.activeColor}40` }
                                : { background: 'transparent', color: sub, border: `1.5px solid ${border}` }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {!enabled && (
                        <span className="text-[11px]" style={{ color: sub }}>No access</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════ DROPDOWNS TAB ═════════════════════════ */}
      {tab === 'dropdowns' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="rounded-2xl p-5"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: shadow }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary)15' }}>
                <IcoEdit size={16} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: text }}>Dropdown Configuration</h3>
                <p className="text-[11px]" style={{ color: sub }}>Configure the dropdown options used across Contract Strategy and other pages</p>
              </div>
            </div>
          </div>

          {/* Dropdown Sections */}
          {[
            { key: 'contractModes', label: 'Contract Mode', icon: IcoShield, description: 'Options for the Contract Mode dropdown in Contract Strategy' },
            { key: 'tenderTypes', label: 'Tender Type', icon: IcoKey, description: 'Options for the Tender Type dropdown in Contract Strategy' },
            { key: 'contractRisks', label: 'Contract Risk', icon: IcoEdit, description: 'Risk level options for Overall Contract Risk' },
          ].map(section => {
            const items = dropdownConfig[section.key] || []
            const SIcon = section.icon
            return (
              <div key={section.key} className="rounded-2xl overflow-hidden"
                style={{ background: surface, border: `1px solid ${border}`, boxShadow: shadow }}>
                {/* Section Header */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: `1px solid ${border}`, background: surfBg }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--color-primary)12' }}>
                      <SIcon size={14} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: text }}>{section.label}</p>
                      <p className="text-[10px]" style={{ color: sub }}>{section.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--color-primary)12', color: 'var(--color-primary)' }}>
                    {items.length} options
                  </span>
                </div>

                {/* Items List */}
                <div className="px-5 py-3 space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl group transition-colors"
                      style={{ border: `1px solid ${border}` }}
                      onMouseOver={e => e.currentTarget.style.background = surfBg}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                          style={{ background: 'var(--color-primary)10', color: 'var(--color-primary)' }}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium" style={{ color: text }}>{item}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = items.filter((_, i) => i !== idx)
                          updateDropdownConfig(section.key, updated)
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: '#EF4444' }}
                        onMouseOver={e => e.currentTarget.style.background = '#FEF2F2'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <IcoTrash size={13} />
                      </button>
                    </div>
                  ))}

                  {/* Add New Item */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      value={newDropdownItem[section.key] || ''}
                      onChange={e => setNewDropdownItem(prev => ({ ...prev, [section.key]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (newDropdownItem[section.key] || '').trim()) {
                          const val = newDropdownItem[section.key].trim()
                          if (!items.includes(val)) {
                            updateDropdownConfig(section.key, [...items, val])
                            setNewDropdownItem(prev => ({ ...prev, [section.key]: '' }))
                            setDropdownSaved(section.key)
                            setTimeout(() => setDropdownSaved(null), 1500)
                          }
                        }
                      }}
                      placeholder={`Add new ${section.label.toLowerCase()} option...`}
                      style={{ ...inp(), flex: 1 }}
                    />
                    <button
                      onClick={() => {
                        const val = (newDropdownItem[section.key] || '').trim()
                        if (val && !items.includes(val)) {
                          updateDropdownConfig(section.key, [...items, val])
                          setNewDropdownItem(prev => ({ ...prev, [section.key]: '' }))
                          setDropdownSaved(section.key)
                          setTimeout(() => setDropdownSaved(null), 1500)
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors"
                      style={{ background: dropdownSaved === section.key ? '#059669' : 'var(--color-primary)', border: 'none', cursor: 'pointer' }}>
                      {dropdownSaved === section.key
                        ? <><IcoCheckCircle size={12} /> Added!</>
                        : <><IcoPlus size={12} /> Add</>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Currencies Section */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: shadow }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${border}`, background: surfBg }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-primary)12' }}>
                  <IcoKey size={14} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: text }}>Currencies</p>
                  <p className="text-[10px]" style={{ color: sub }}>Currency options for budget and financial fields</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-primary)12', color: 'var(--color-primary)' }}>
                {(dropdownConfig.currencies || []).length} currencies
              </span>
            </div>

            <div className="px-5 py-3 space-y-2">
              {(dropdownConfig.currencies || []).map((cur, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl group transition-colors"
                  style={{ border: `1px solid ${border}` }}
                  onMouseOver={e => e.currentTarget.style.background = surfBg}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: 'var(--color-primary)10', color: 'var(--color-primary)' }}>
                      {cur.symbol}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: text }}>{cur.code}</p>
                      <p className="text-[10px]" style={{ color: sub }}>{cur.label}</p>
                    </div>
                  </div>
                  {(dropdownConfig.currencies || []).length > 1 && (
                    <button
                      onClick={() => {
                        const updated = (dropdownConfig.currencies || []).filter((_, i) => i !== idx)
                        updateDropdownConfig('currencies', updated)
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: '#EF4444' }}
                      onMouseOver={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <IcoTrash size={13} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Currency */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  value={newDropdownItem.currCode || ''}
                  onChange={e => setNewDropdownItem(prev => ({ ...prev, currCode: e.target.value.toUpperCase() }))}
                  placeholder="Code (e.g. INR)"
                  maxLength={3}
                  style={{ ...inp(), width: 90 }}
                />
                <input
                  value={newDropdownItem.currSymbol || ''}
                  onChange={e => setNewDropdownItem(prev => ({ ...prev, currSymbol: e.target.value }))}
                  placeholder="Symbol (e.g. ₹)"
                  maxLength={3}
                  style={{ ...inp(), width: 90 }}
                />
                <input
                  value={newDropdownItem.currLabel || ''}
                  onChange={e => setNewDropdownItem(prev => ({ ...prev, currLabel: e.target.value }))}
                  placeholder="Label (e.g. INR — Indian Rupee)"
                  style={{ ...inp(), flex: 1 }}
                />
                <button
                  onClick={() => {
                    const code = (newDropdownItem.currCode || '').trim()
                    const symbol = (newDropdownItem.currSymbol || '').trim()
                    const label = (newDropdownItem.currLabel || '').trim()
                    if (code && symbol && label) {
                      const existing = (dropdownConfig.currencies || []).map(c => c.code)
                      if (!existing.includes(code)) {
                        updateDropdownConfig('currencies', [
                          ...(dropdownConfig.currencies || []),
                          { code, symbol, label }
                        ])
                        setNewDropdownItem(prev => ({ ...prev, currCode: '', currSymbol: '', currLabel: '' }))
                        setDropdownSaved('currencies')
                        setTimeout(() => setDropdownSaved(null), 1500)
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors"
                  style={{ background: dropdownSaved === 'currencies' ? '#059669' : 'var(--color-primary)', border: 'none', cursor: 'pointer' }}>
                  {dropdownSaved === 'currencies'
                    ? <><IcoCheckCircle size={12} /> Added!</>
                    : <><IcoPlus size={12} /> Add</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ MODALS ══════════════════════════════════ */}

      {/* Reassign */}
      {showReassign && reassignSource && (
        <Modal onClose={() => setShowReassign(false)} surface={surface} border={border}>
          <MHead icon={<IcoArrows size={15} style={{ color: 'var(--color-primary)' }} />}
            title="Reassign Tasks" sub={`From: ${reassignSource.name}`}
            onClose={() => setShowReassign(false)} border={border} text={text} muted={sub} />
          <div className="p-5 space-y-4">
            <div>
              <MLabel text={`Assigned Tenders (${getAssigned(reassignSource).length})`} color={sub} />
              <div className="space-y-1.5 mt-1.5 max-h-44 overflow-y-auto">
                {getAssigned(reassignSource).map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={{ background: surfBg, border: `1px solid ${border}` }}>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--color-primary)15', color: 'var(--color-primary)' }}>{t.id}</span>
                    <span className="text-xs truncate" style={{ color: text }}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <MLabel text={`Transfer to (${getRoleObj(reassignSource.roleId)?.label})`} color={sub} required />
              {sameRoleUsers.length === 0
                ? <div className="mt-1.5 px-3 py-3 rounded-xl text-xs text-center"
                    style={{ background: '#FEF2F2', color: '#DC2626' }}>No other active users with same role.</div>
                : <select value={reassignTarget} onChange={e => setReassignTarget(e.target.value)}
                    style={{ ...inp(), marginTop: 6 }}>
                    <option value="">Select user...</option>
                    {sameRoleUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>}
            </div>
          </div>
          <MFoot onCancel={() => setShowReassign(false)} onConfirm={doReassign}
            label="Confirm Reassign" disabled={!reassignTarget} border={border} muted={sub} />
        </Modal>
      )}

      {/* Create Role */}
      {showRoleModal && (
        <Modal onClose={() => setShowRoleModal(false)} surface={surface} border={border} maxW={420}>
          <MHead icon={<IcoShield size={15} style={{ color: 'var(--color-primary)' }} />}
            title="Create New Role" onClose={() => setShowRoleModal(false)} border={border} text={text} muted={sub} />
          <div className="p-5 space-y-4">
            <div>
              <MLabel text="Role Name" color={sub} required />
              <input value={roleForm.label} onChange={e => setRoleForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Legal Reviewer" style={{ ...inp(), marginTop: 6 }} />
            </div>
            <div>
              <MLabel text="Role Colour" color={sub} />
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                {ROLE_COLORS.map(col => (
                  <button key={col} type="button" onClick={() => setRoleForm(f => ({ ...f, color: col }))}
                    className="w-7 h-7 rounded-lg shrink-0 transition-transform hover:scale-110"
                    style={{ background: col, outline: roleForm.color === col ? `3px solid ${col}` : 'none', outlineOffset: 2 }} />
                ))}
                <input type="color" value={roleForm.color}
                  onChange={e => setRoleForm(f => ({ ...f, color: e.target.value }))}
                  className="w-8 h-7 rounded cursor-pointer border-0 p-0 ml-1" title="Custom colour" />
              </div>
            </div>
            <div>
              <MLabel text="Description (optional)" color={sub} />
              <input value={roleForm.description} onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of responsibilities..." style={{ ...inp(), marginTop: 6 }} />
            </div>
            <p className="text-xs px-3 py-2.5 rounded-xl" style={{ background: 'var(--color-primary)10', color: 'var(--color-primary)' }}>
              Role starts with no module access — configure permissions after creation.
            </p>
          </div>
          <MFoot onCancel={() => setShowRoleModal(false)} onConfirm={createRole}
            label="Create Role" disabled={!roleForm.label.trim()} border={border} muted={sub} />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} surface={surface} border={border} maxW={380}>
          <div className="px-6 pt-6 pb-2 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#FEF2F2' }}>
              <IcoTrash size={20} style={{ color: '#EF4444' }} />
            </div>
            <p className="font-bold text-base mb-1" style={{ color: text }}>Remove User</p>
            <p className="text-sm" style={{ color: sub }}>
              Remove <strong style={{ color: text }}>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
          </div>
          <MFoot onCancel={() => setDeleteConfirm(null)} onConfirm={() => deleteUser(deleteConfirm.id)}
            label="Yes, Remove" danger border={border} muted={sub} />
        </Modal>
      )}

      {/* Add / Edit user */}
      {showUserModal && (
        <Modal onClose={() => setShowUserModal(false)} surface={surface} border={border}>
          <MHead icon={<IcoUserCheck size={15} style={{ color: 'var(--color-primary)' }} />}
            title={editUser ? 'Edit User' : 'Onboard New User'}
            onClose={() => setShowUserModal(false)} border={border} text={text} muted={sub} />
          <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '62vh' }}>

            <div>
              <MLabel text="Full Name" color={sub} required />
              <input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe" style={{ ...inp(formErrors.name), marginTop: 6 }} />
              {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <MLabel text="Email Address" color={sub} required />
              <div className="relative" style={{ marginTop: 6 }}>
                <IcoMail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: sub, pointerEvents: 'none' }} />
                <input value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@company.com" style={{ ...inp(formErrors.email), paddingLeft: 34 }} />
              </div>
              {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
            </div>

            {!editUser && (
              <div>
                <MLabel text="Password (optional)" color={sub} />
                <div className="relative" style={{ marginTop: 6 }}>
                  <IcoKey size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: sub, pointerEvents: 'none' }} />
                  <input type={showPwd ? 'text' : 'password'} value={userForm.password}
                    onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank — user sets it on first login"
                    style={{ ...inp(), paddingLeft: 34, paddingRight: 36 }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: sub, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}>
                    {showPwd ? <IcoEyeOff size={14} /> : <IcoEye size={14} />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <MLabel text="Assign Role" color={sub} required />
              <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                style={{ ...inp(), marginTop: 6 }}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              {userForm.role && matrix[userForm.role] && (
                <div className="mt-2 rounded-xl px-3 py-2.5" style={{ background: surfBg, border: `1px solid ${border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sub }}>Modules for this role</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MODULES.filter(m => matrix[userForm.role]?.[m.key] !== 'NONE').map(m => {
                      const ModIcon = ModSvg[m.key]
                      return (
                        <span key={m.key} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-primary)10', color: 'var(--color-primary)', border: '1px solid var(--color-primary)20' }}>
                          {ModIcon && <ModIcon size={10} />} {m.label}
                        </span>
                      )
                    })}
                    {MODULES.filter(m => matrix[userForm.role]?.[m.key] !== 'NONE').length === 0 && (
                      <span className="text-[11px]" style={{ color: sub }}>No modules enabled yet.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <MLabel text="Account Status" color={sub} />
              <div className="flex gap-2 mt-1.5">
                {['active', 'inactive'].map(s => (
                  <button key={s} type="button" onClick={() => setUserForm(f => ({ ...f, status: s }))}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={userForm.status === s
                      ? { background: 'var(--color-primary)', color: '#fff', border: '1.5px solid var(--color-primary)' }
                      : { background: 'transparent', color: sub, border: `1.5px solid ${border}` }}>
                    {s === 'active' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <MFoot onCancel={() => setShowUserModal(false)} onConfirm={saveUser}
            label={editUser ? 'Save Changes' : 'Onboard User'} border={border} muted={sub} />
        </Modal>
      )}
    </div>
  )
}

// ── Modal helpers ────────────────────────────────────────────────────────────
function Modal({ children, onClose, surface, border, maxW = 440 }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxWidth: maxW, background: surface, border: `1px solid ${border}` }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function MHead({ icon, title, sub, onClose, border, text, muted }) {
  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-primary)15' }}>{icon}</div>
        <div>
          <p className="text-sm font-bold" style={{ color: text }}>{title}</p>
          {sub && <p className="text-[11px]" style={{ color: muted }}>{sub}</p>}
        </div>
      </div>
      <button onClick={onClose}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer' }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
        <IcoX size={14} />
      </button>
    </div>
  )
}

function MFoot({ onCancel, onConfirm, label, disabled, danger, border, muted }) {
  return (
    <div className="flex gap-2 px-5 py-4" style={{ borderTop: `1px solid ${border}` }}>
      <button onClick={onCancel}
        className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
        style={{ border: `1.5px solid ${border}`, color: muted, background: 'transparent', cursor: 'pointer' }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
        Cancel
      </button>
      <button onClick={onConfirm} disabled={disabled}
        className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-40"
        style={{ background: danger ? '#EF4444' : 'var(--color-primary)', border: 'none', cursor: disabled ? 'default' : 'pointer' }}>
        {label}
      </button>
    </div>
  )
}

function MLabel({ text, required, color }) {
  return (
    <p className="text-xs font-semibold" style={{ color }}>
      {text}{required && <span style={{ color: '#EF4444' }}> *</span>}
    </p>
  )
}

function MenuItem({ Icon, label, onClick, hoverBg, color, iconColor, badge }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium"
      style={{ color, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
      onMouseOver={e => e.currentTarget.style.background = hoverBg}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
      <Icon size={13} style={{ color: iconColor || color, opacity: 0.7 }} />
      {label}
      {badge != null && (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ background: 'var(--color-primary)' }}>{badge}</span>
      )}
    </button>
  )
}
