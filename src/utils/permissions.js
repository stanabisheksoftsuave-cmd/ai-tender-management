import { useAuth } from '../context/AuthContext'

/*
 * Route authorisation — one source of truth for both the router and the sidebar.
 *
 * Every protected page is listed in ROUTE_ROLES with the roles allowed to open
 * it. The router gates on it (so a typed-in URL is blocked exactly like a click)
 * and the sidebar filters its menu with the same call, so a menu item can never
 * drift out of step with what the route actually permits.
 */

export const ROLE = {
  IT_ADMIN:          'it_admin',
  BIZ_ADMIN:         'biz_admin',
  CONTRACT_ENGINEER: 'pof',
  CONTRACT_HOLDER:   'contract_holder',
  SCM:               'scm',
  LEGAL_REVIEW:      'legal_review',
  HSE:               'hse',
  ICV:               'icv',
}

export const ADMIN_ROLES = [ROLE.IT_ADMIN, ROLE.BIZ_ADMIN]

export const ITT_PATH = '/create-itt'

// The Dashboard is restricted to the Contract Holder and the two admin roles.
export const DASHBOARD_ROLES = [...ADMIN_ROLES, ROLE.CONTRACT_HOLDER]

// Roles allowed on each route. Keys are the first path segment, so
// '/contract/:tenderId' is governed by the same entry as '/contract'.
// `null` means every signed-in role.
export const ROUTE_ROLES = {
  '/dashboard':           DASHBOARD_ROLES,
  '/tenders':             null,
  '/contract-strategy':   [ROLE.CONTRACT_HOLDER],
  '/strategy-templates':  [ROLE.CONTRACT_HOLDER],
  '/psf-strategy':        [ROLE.CONTRACT_HOLDER],
  // Pre-qualification is the Contract Holder's, except the financial assessment
  // stage, which the Contract Engineer owns. The page itself gates per stage.
  '/pre-qualification':   [ROLE.CONTRACT_HOLDER, ROLE.CONTRACT_ENGINEER],
  // HSE and ICV each own their own ITT sections; the page scopes to them.
  '/create-itt':          [ROLE.CONTRACT_ENGINEER, ROLE.CONTRACT_HOLDER, ROLE.HSE, ROLE.ICV],
  '/upload':              [ROLE.CONTRACT_ENGINEER],
  '/technical-eval':      [ROLE.CONTRACT_HOLDER],
  '/commercial-eval':     [ROLE.CONTRACT_ENGINEER],
  // The Supply Chain Manager's three approval gates.
  '/scm-tech-review':     [ROLE.SCM],
  '/scm-review':          [ROLE.SCM],
  '/scm-contract-review': [ROLE.SCM],
  '/contract':            [ROLE.CONTRACT_ENGINEER],
  '/legal-review':        [ROLE.LEGAL_REVIEW],
  '/contract-execution':  [ROLE.CONTRACT_ENGINEER],
  '/contract-management': [ROLE.CONTRACT_ENGINEER],
  '/contract-closure':    [ROLE.CONTRACT_ENGINEER],
  '/audit-log':           ADMIN_ROLES,
  '/users':               ADMIN_ROLES,
}

// '/contract/T-1042' -> '/contract'
export const routeKey = (path) => '/' + String(path || '').split('/')[1]

export const isKnownRoute = (path) => routeKey(path) in ROUTE_ROLES

export function canAccess(roleId, path) {
  if (!roleId) return false
  const allowed = ROUTE_ROLES[routeKey(path)]
  if (allowed === undefined) return false // not a protected app route
  if (allowed === null) return true       // open to every signed-in role
  return allowed.includes(roleId)
}

/*
 * Where a role lands when it is turned away from a route — also the post-login
 * destination and the target of the catch-all route.
 *
 * The first entry the role may actually open wins, so this can never point at a
 * page that would bounce the user straight back. Roles without the Dashboard
 * land on the ITT page; the review roles have no ITT access either, so they fall
 * through to their own workspace. The SCM lands on the award gate, the busiest
 * of its three.
 */
const LANDING_ORDER = ['/dashboard', ITT_PATH, '/scm-review', '/legal-review', '/tenders']

export function landingPath(roleId) {
  return LANDING_ORDER.find(path => canAccess(roleId, path)) || '/login'
}

/** The signed-in user's landing page — for "back to home" style navigation. */
export function useHomePath() {
  const { user } = useAuth()
  return landingPath(user?.role?.id)
}
