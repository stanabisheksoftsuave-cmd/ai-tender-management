import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const roles = [
  { id: 'admin',          label: 'Administrator',        color: '#92400E' },
  { id: 'pof',            label: 'Procurement Officer',  color: '#1B4F8A' },
  { id: 'tech_eval',      label: 'Technical Evaluator',  color: '#059669' },
  { id: 'comm_eval',      label: 'Commercial Evaluator', color: '#D97706' },
  { id: 'legal_review',   label: 'Legal Reviewer',       color: '#7C3AED' },
  { id: 'mgmt_review',    label: 'Management Reviewer',  color: '#0F766E' },
  { id: 'contractor_eng', label: 'Contractor Engineer',  color: '#B45309' },
  { id: 'it_admin',       label: 'IT Admin',             color: '#DC2626' },
  { id: 'bidder',         label: 'Bidder',               color: '#0EA5E9' },
]

// Single source of truth — credentials + profile + status
export const INITIAL_USERS = [
  { id: 1,  username: 'admin@corp.com',            password: 'Admin@123',  name: 'Admin User',          roleId: 'admin',          status: 'active',   avatar: 'AU', lastLogin: '2025-04-06 15:00', superAdmin: true },
  { id: 2,  username: 'john.smith@corp.com',       password: 'John@123',   name: 'John Smith',          roleId: 'pof',            status: 'active',   avatar: 'JS', lastLogin: '2025-04-06 09:14' },
  { id: 3,  username: 'sarah.chen@corp.com',       password: 'Sarah@123',  name: 'Sarah Chen',          roleId: 'tech_eval',      status: 'active',   avatar: 'SC', lastLogin: '2025-04-05 16:30' },
  { id: 4,  username: 'mark.davis@corp.com',       password: 'Mark@123',   name: 'Mark Davis',          roleId: 'comm_eval',      status: 'active',   avatar: 'MD', lastLogin: '2025-04-04 11:22' },
  { id: 5,  username: 'emma.wilson@corp.com',      password: 'Emma@123',   name: 'Emma Wilson',         roleId: 'legal_review',   status: 'active',   avatar: 'EW', lastLogin: '2025-04-05 09:55' },
  { id: 6,  username: 'robert.lee@corp.com',       password: 'Robert@123', name: 'Robert Lee',          roleId: 'mgmt_review',    status: 'active',   avatar: 'RL', lastLogin: '2025-04-06 14:30' },
  { id: 7,  username: 'alex.turner@corp.com',      password: 'Alex@123',   name: 'Alex Turner',         roleId: 'contractor_eng', status: 'inactive', avatar: 'AT', lastLogin: '2025-03-28 10:05' },
  { id: 8,  username: 'priya.nair@corp.com',       password: 'Priya@123',  name: 'Priya Nair',          roleId: 'it_admin',       status: 'active',   avatar: 'PN', lastLogin: '2025-04-06 08:00' },
  // { id: 9,  username: 'contact@techsolutions.com', password: 'Tech@123',   name: 'TechSolutions Ltd',   roleId: 'bidder',         status: 'active',   avatar: 'TS', lastLogin: '2025-04-05 10:30', company: 'TechSolutions Ltd' },
  // { id: 10, username: 'contact@infracore.com',     password: 'Infra@123',  name: 'InfraCore Systems',   roleId: 'bidder',         status: 'active',   avatar: 'IS', lastLogin: '2025-04-04 14:15', company: 'InfraCore Systems' },
  // { id: 11, username: 'contact@cloudnexus.com',    password: 'Cloud@123',  name: 'CloudNexus Corp',     roleId: 'bidder',         status: 'active',   avatar: 'CN', lastLogin: '2025-04-03 09:00', company: 'CloudNexus Corp' },
  // { id: 12, username: 'contact@datavault.com',     password: 'Data@123',   name: 'DataVault Solutions', roleId: 'bidder',         status: 'active',   avatar: 'DV', lastLogin: '2025-04-02 11:45', company: 'DataVault Solutions' },
]

// Keep for backward compat with Login demo panel
export const DEMO_USERS = INITIAL_USERS

const STORAGE_KEY = 'atm_user'
const USERS_STORAGE_KEY = 'atm_users'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [users, setUsers] = useState(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : INITIAL_USERS
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
    if (match.roleId === 'it_admin') {
      setItAdminLogs(prev => [{
        id: Date.now(),
        user: match.name,
        role: 'IT Admin',
        action: 'User Login — IT Admin portal session started',
        tender: '—',
        ip: '10.0.1.50',
        status: 'success',
        timestamp: new Date().toLocaleString('en-GB'),
      }, ...prev])
    }
    return 'success'
  }

  const logout = () => {
    setUser(null)
    const usersData = localStorage.getItem(USERS_STORAGE_KEY)
    localStorage.clear()
    if (usersData) localStorage.setItem(USERS_STORAGE_KEY, usersData)
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

  return (
    <AuthContext.Provider value={{ user, users, login, logout, roles, itAdminLogs, addAuditLog, updateUser, addUser, removeUser, setFirstPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
