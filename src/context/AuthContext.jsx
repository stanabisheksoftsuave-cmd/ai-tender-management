import { createContext, useContext, useState, useEffect } from 'react'
import {
  emptyModuleLevels, loadStoredMatrix, persistMatrix,
  MATRIX_STORAGE_KEY, MATRIX_VERSION_KEY,
} from '../utils/permissionMatrix'

const AuthContext = createContext()

// Technical evaluation is owned by the Contract Holder and commercial by the
// Contract Engineer, so there are no standalone evaluator roles.
export const roles = [
  { id: 'it_admin',    label: 'IT Admin',            color: '#7C3AED' },
  { id: 'biz_admin',   label: 'Business Admin',       color: '#0F766E' },
  { id: 'pof',         label: 'Contract Engineer',    color: '#1B4F8A' },
  { id: 'contract_holder', label: 'Contract Holder',  color: '#0891B2' },
  { id: 'scm',         label: 'Supply Chain',         color: '#0F766E' },
  { id: 'legal_review',label: 'Legal Reviewer',       color: '#B45309' },
  { id: 'hse',         label: 'Contract HSE',         color: '#0EA5E9' },
  { id: 'icv',         label: 'ICV',                  color: '#DB2777' },
]

// Single source of truth — credentials + profile + status
export const INITIAL_USERS = [
  { id: 1, username: 'admin@corp.com',       password: 'Admin@123',  name: 'Admin User',    roleId: 'it_admin',    status: 'active', avatar: 'AU', lastLogin: '2025-04-06 15:00', superAdmin: true },
  { id: 6, username: 'bizadmin@corp.com',    password: 'Biz@123',    name: 'Sara Mitchell', roleId: 'biz_admin',   status: 'active', avatar: 'SM', lastLogin: '2025-04-06 12:00' },
  { id: 2, username: 'john.smith@corp.com',  password: 'John@123',   name: 'John Smith',    roleId: 'pof',         status: 'active', avatar: 'JS', lastLogin: '2025-04-06 09:14' },
  { id: 5, username: 'robert.lee@corp.com',  password: 'Robert@123', name: 'Robert Lee',    roleId: 'scm',         status: 'active', avatar: 'RL', lastLogin: '2025-04-06 14:30' },
  { id: 7, username: 'amina.saleh@corp.com', password: 'Amina@123',  name: 'Amina Saleh',   roleId: 'legal_review',status: 'active', avatar: 'AS', lastLogin: '2025-04-06 13:10' },
  { id: 8, username: 'fatima.ali@corp.com',  password: 'Fatima@123', name: 'Fatima Al-Ali', roleId: 'contract_holder', status: 'active', avatar: 'FA', lastLogin: '2025-04-06 08:45' },
  { id: 9, username: 'hse.officer@corp.com', password: 'Hse@123',    name: 'Layla Nasser',  roleId: 'hse',         status: 'active', avatar: 'LN', lastLogin: '2025-04-06 09:14' },
  { id: 10, username: 'icv.lead@corp.com',   password: 'Icv@123',    name: 'Omar Habib',    roleId: 'icv',         status: 'active', avatar: 'OH', lastLogin: '2025-04-06 09:14' },
]

// Keep for backward compat with Login demo panel
export const DEMO_USERS = INITIAL_USERS

const STORAGE_KEY = 'atm_user'
const USERS_STORAGE_KEY = 'atm_users'
const USERS_VERSION_KEY = 'atm_users_v'
const CURRENT_VERSION = '8' // bump whenever INITIAL_USERS structure changes

// Role ids that were renamed. Stored users (and sessions) created before the
// rename still carry the old id; without this they resolve to no role at all and
// the session is discarded on mount, which reads as "login does nothing".
const LEGACY_ROLE_IDS = { mgmt_review: 'scm' }
const migrateRoleId = (id) => LEGACY_ROLE_IDS[id] ?? id
const migrateUsers = (list) => list.map(u =>
  LEGACY_ROLE_IDS[u.roleId] ? { ...u, roleId: LEGACY_ROLE_IDS[u.roleId] } : u)

// Roles the IT Admin created at runtime in Access Control, persisted alongside
// the built-ins. They have to be resolvable here too, otherwise a user assigned
// to a custom role signs in to a session with no role and is bounced back out.
const readCustomRoles = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('atm_roles') || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(r => r?.id && !roles.some(b => b.id === r.id))
  } catch { return [] }
}
const resolveRole = (id) =>
  roles.find(r => r.id === id) || readCustomRoles().find(r => r.id === id) || null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      const parsed = JSON.parse(stored)
      // A renamed role is migrated in place; only genuinely removed roles
      // (e.g. the old 'admin') invalidate the session.
      const migratedId = migrateRoleId(parsed?.role?.id)
      const roleInfo = resolveRole(migratedId)
      if (!roleInfo) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      if (roleInfo.id !== parsed?.role?.id) {
        const upgraded = { ...parsed, role: roleInfo }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded))
        return upgraded
      }
      return parsed
    } catch {
      return null
    }
  })
  const [users, setUsers] = useState(() => {
    try {
      const storedVersion = localStorage.getItem(USERS_VERSION_KEY)
      if (storedVersion !== CURRENT_VERSION) {
        // Version mismatch — reset to latest INITIAL_USERS, keep any custom users (id > 100)
        const existing = localStorage.getItem(USERS_STORAGE_KEY)
        const parsed = existing ? migrateUsers(JSON.parse(existing)) : []
        // Keep custom users, but drop any whose role no longer exists (e.g. the
        // removed tech_eval / comm_eval evaluators).
        const validRoleIds = new Set([...roles, ...readCustomRoles()].map(r => r.id))
        const customUsers = parsed.filter(u => !INITIAL_USERS.find(i => i.id === u.id) && validRoleIds.has(u.roleId))
        const merged = [...INITIAL_USERS, ...customUsers]
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged))
        localStorage.setItem(USERS_VERSION_KEY, CURRENT_VERSION)
        // Also clear stale session so user re-logs in with valid role
        const session = localStorage.getItem(STORAGE_KEY)
        if (session) {
          const s = JSON.parse(session)
          if (!resolveRole(s?.role?.id)) localStorage.removeItem(STORAGE_KEY)
        }
        return merged
      }
      const stored = localStorage.getItem(USERS_STORAGE_KEY)
      if (!stored) return INITIAL_USERS
      const parsed = migrateUsers(JSON.parse(stored))
      // Merge in any newly added INITIAL_USERS not already in list
      const storedIds = new Set(parsed.map(u => u.id))
      const missing = INITIAL_USERS.filter(u => !storedIds.has(u.id))
      if (missing.length === 0) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed))
        return parsed
      }
      const merged = [...parsed, ...missing]
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged))
      return merged
    } catch {
      return INITIAL_USERS
    }
  })
  const [itAdminLogs, setItAdminLogs] = useState([])

  /*
   * Access Control matrix (role -> module -> permission level).
   *
   * It lives here rather than inside the User Management page because it is the
   * gate the router and the sidebar consult through utils/permissions. Holding it
   * in shared state is what makes an admin's grant reach the target role's
   * session — while it was page-local state it could only ever be decorative.
   */
  const [permissionMatrix, setMatrixState] = useState(loadStoredMatrix)

  const setPermissionMatrix = (updater) =>
    setMatrixState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      persistMatrix(next)
      return next
    })

  /** Grant/revoke a single module for a single role. */
  const setModuleLevel = (roleId, moduleKey, level) =>
    setPermissionMatrix(prev => ({
      ...prev,
      [roleId]: { ...(prev[roleId] || emptyModuleLevels()), [moduleKey]: level },
    }))

  const removeRolePermissions = (roleId) =>
    setPermissionMatrix(prev => {
      const next = { ...prev }
      delete next[roleId]
      return next
    })

  const addAuditLog = (entry) => {
    setItAdminLogs(prev => [{
      id: Date.now() + prev.length,
      tender: '—',
      ip: '10.0.1.50',
      status: 'success',
      timestamp: new Date().toLocaleString('en-GB'),
      ...entry,
    }, ...prev])
  }

  // Returns 'success' | 'inactive' | 'invalid' | 'must_set_password'
  const login = (username, password) => {
    const byEmail = users.find(u => u.username === username)
    if (!byEmail) return 'invalid'
    if (byEmail.status === 'inactive') return 'inactive'
    if (byEmail.mustSetPassword) return 'must_set_password'
    const match = byEmail.password === password ? byEmail : null
    if (!match) return 'invalid'
    const roleInfo = resolveRole(migrateRoleId(match.roleId))
    // Without a resolvable role the session is discarded on the next mount, so
    // fail here rather than appearing to sign in and bouncing straight back.
    if (!roleInfo) return 'invalid'
    const userData = { id: match.id, name: match.name, email: match.username, role: roleInfo }
    setUser(userData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    return 'success'
  }

  const logout = () => {
    setUser(null)
    const usersData    = localStorage.getItem(USERS_STORAGE_KEY)
    const rolesData    = localStorage.getItem('atm_roles')
    const matrixData   = localStorage.getItem(MATRIX_STORAGE_KEY)
    const matrixVer    = localStorage.getItem(MATRIX_VERSION_KEY)
    // Tenders + their version and the dropdown config must survive a logout, so
    // work done under one role (e.g. an ITT the Contract Holder generated) is
    // still there when the next role logs in.
    const tendersData  = localStorage.getItem('atm_tenders')
    const tendersVer   = localStorage.getItem('atm_tenders_v')
    const dropdownData = localStorage.getItem('atm_dropdown_config')
    localStorage.clear()

    if (usersData)    localStorage.setItem(USERS_STORAGE_KEY, usersData)
    if (rolesData)    localStorage.setItem('atm_roles',  rolesData)
    // The matrix has to outlive a logout together with its version stamp —
    // without the stamp the next load would treat it as a pre-v2 blob and reset
    // every built-in role, discarding the admin's grants.
    if (matrixData)   localStorage.setItem(MATRIX_STORAGE_KEY, matrixData)
    if (matrixVer)    localStorage.setItem(MATRIX_VERSION_KEY, matrixVer)
    if (tendersData)  localStorage.setItem('atm_tenders', tendersData)
    if (tendersVer)   localStorage.setItem('atm_tenders_v', tendersVer)
    if (dropdownData) localStorage.setItem('atm_dropdown_config', dropdownData)
  }

  const updateUser = (id, changes) =>
    setUsers(prev => {
      const next = prev.map(u => u.id === id ? { ...u, ...changes } : u)
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next))
      return next
    })

  const addUser = (newUser) =>
    setUsers(prev => {
      const next = [...prev, { id: Date.now(), lastLogin: '—', password: '', mustSetPassword: true, ...newUser }]
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next))
      return next
    })

  // Returns 'success' | 'not_found' | 'already_set' | 'inactive'
  const setFirstPassword = (email, newPassword) => {
    const match = users.find(u => u.username === email)
    if (!match) return 'not_found'
    if (match.status === 'inactive') return 'inactive'
    if (!match.mustSetPassword) return 'already_set'
    setUsers(prev => {
      const next = prev.map(u =>
        u.username === email ? { ...u, password: newPassword, mustSetPassword: false } : u
      )
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
    const roleInfo = resolveRole(migrateRoleId(match.roleId))
    const userData = { id: match.id, name: match.name, email: match.username, role: roleInfo }
    setUser(userData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    return 'success'
  }

  const removeUser = (id) =>
    setUsers(prev => {
      const next = prev.filter(u => u.id !== id)
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next))
      return next
    })

  // On every mount: guarantee all INITIAL_USERS exist and session role is valid
  useEffect(() => {
    setUsers(prev => {
      const ids = new Set(prev.map(u => u.id))
      const missing = INITIAL_USERS.filter(u => !ids.has(u.id))
      if (missing.length === 0) return prev
      const merged = [...prev, ...missing]
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged))
      return merged
    })
    setUser(prev => {
      if (!prev) return prev
      const roleInfo = resolveRole(migrateRoleId(prev?.role?.id))
      if (!roleInfo) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      if (roleInfo.id === prev.role?.id) return prev
      const upgraded = { ...prev, role: roleInfo }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded))
      return upgraded
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user, users, login, logout, roles, itAdminLogs, addAuditLog,
      updateUser, addUser, removeUser, setFirstPassword,
      permissionMatrix, setPermissionMatrix, setModuleLevel, removeRolePermissions,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
