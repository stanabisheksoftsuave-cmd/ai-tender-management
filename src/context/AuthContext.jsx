import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const roles = [
  { id: 'it_admin',    label: 'IT Admin',            color: '#7C3AED' },
  { id: 'biz_admin',   label: 'Business Admin',       color: '#0F766E' },
  { id: 'pof',         label: 'Contract Engineer',    color: '#1B4F8A' },
  { id: 'contract_holder', label: 'Contract Holder',  color: '#0891B2' },
  { id: 'tech_eval',   label: 'Technical Evaluator',  color: '#059669' },
  { id: 'comm_eval',   label: 'Commercial Evaluator', color: '#D97706' },
  { id: 'mgmt_review', label: 'Management Reviewer',  color: '#0F766E' },
  { id: 'legal_review',label: 'Legal Reviewer',       color: '#B45309' },
]

// Single source of truth — credentials + profile + status
export const INITIAL_USERS = [
  { id: 1, username: 'admin@corp.com',       password: 'Admin@123',  name: 'Admin User',    roleId: 'it_admin',    status: 'active', avatar: 'AU', lastLogin: '2025-04-06 15:00', superAdmin: true },
  { id: 6, username: 'bizadmin@corp.com',    password: 'Biz@123',    name: 'Sara Mitchell', roleId: 'biz_admin',   status: 'active', avatar: 'SM', lastLogin: '2025-04-06 12:00' },
  { id: 2, username: 'john.smith@corp.com',  password: 'John@123',   name: 'John Smith',    roleId: 'pof',         status: 'active', avatar: 'JS', lastLogin: '2025-04-06 09:14' },
  { id: 3, username: 'sarah.chen@corp.com',  password: 'Sarah@123',  name: 'Sarah Chen',    roleId: 'tech_eval',   status: 'active', avatar: 'SC', lastLogin: '2025-04-05 16:30' },
  { id: 4, username: 'mark.davis@corp.com',  password: 'Mark@123',   name: 'Mark Davis',    roleId: 'comm_eval',   status: 'active', avatar: 'MD', lastLogin: '2025-04-04 11:22' },
  { id: 5, username: 'robert.lee@corp.com',  password: 'Robert@123', name: 'Robert Lee',    roleId: 'mgmt_review', status: 'active', avatar: 'RL', lastLogin: '2025-04-06 14:30' },
  { id: 7, username: 'amina.saleh@corp.com', password: 'Amina@123',  name: 'Amina Saleh',   roleId: 'legal_review',status: 'active', avatar: 'AS', lastLogin: '2025-04-06 13:10' },
  { id: 8, username: 'fatima.ali@corp.com',  password: 'Fatima@123', name: 'Fatima Al-Ali', roleId: 'contract_holder', status: 'active', avatar: 'FA', lastLogin: '2025-04-06 08:45' },
]

// Keep for backward compat with Login demo panel
export const DEMO_USERS = INITIAL_USERS

const STORAGE_KEY = 'atm_user'
const USERS_STORAGE_KEY = 'atm_users'
const USERS_VERSION_KEY = 'atm_users_v'
const CURRENT_VERSION = '5' // bump whenever INITIAL_USERS structure changes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      const parsed = JSON.parse(stored)
      // Invalidate sessions with obsolete role IDs (e.g. old 'admin' role)
      const validIds = roles.map(r => r.id)
      if (!validIds.includes(parsed?.role?.id)) {
        localStorage.removeItem(STORAGE_KEY)
        return null
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
        const parsed = existing ? JSON.parse(existing) : []
        const customUsers = parsed.filter(u => !INITIAL_USERS.find(i => i.id === u.id))
        const merged = [...INITIAL_USERS, ...customUsers]
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged))
        localStorage.setItem(USERS_VERSION_KEY, CURRENT_VERSION)
        // Also clear stale session so user re-logs in with valid role
        const session = localStorage.getItem(STORAGE_KEY)
        if (session) {
          const s = JSON.parse(session)
          if (!roles.find(r => r.id === s?.role?.id)) localStorage.removeItem(STORAGE_KEY)
        }
        return merged
      }
      const stored = localStorage.getItem(USERS_STORAGE_KEY)
      if (!stored) return INITIAL_USERS
      const parsed = JSON.parse(stored)
      // Merge in any newly added INITIAL_USERS not already in list
      const storedIds = new Set(parsed.map(u => u.id))
      const missing = INITIAL_USERS.filter(u => !storedIds.has(u.id))
      if (missing.length === 0) return parsed
      const merged = [...parsed, ...missing]
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged))
      return merged
    } catch {
      return INITIAL_USERS
    }
  })
  const [itAdminLogs, setItAdminLogs] = useState([])

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
    const roleInfo = roles.find(r => r.id === match.roleId)
    const userData = { id: match.id, name: match.name, email: match.username, role: roleInfo }
    setUser(userData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    return 'success'
  }

  const logout = () => {
    setUser(null)
    const usersData  = localStorage.getItem(USERS_STORAGE_KEY)
    const rolesData  = localStorage.getItem('atm_roles')
    const matrixData = localStorage.getItem('atm_matrix')
    localStorage.clear()

    if (usersData)  localStorage.setItem(USERS_STORAGE_KEY, usersData)
    if (rolesData)  localStorage.setItem('atm_roles',  rolesData)
    if (matrixData) localStorage.setItem('atm_matrix', matrixData)
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
    const roleInfo = roles.find(r => r.id === match.roleId)
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
      const validIds = roles.map(r => r.id)
      if (!validIds.includes(prev?.role?.id)) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return prev
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, users, login, logout, roles, itAdminLogs, addAuditLog, updateUser, addUser, removeUser, setFirstPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
