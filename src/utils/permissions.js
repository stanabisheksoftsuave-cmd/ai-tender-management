import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_MATRIX, ROUTE_MODULE, hasModule, levelOf } from './permissionMatrix'

/*
 * Route authorisation — one source of truth for both the router and the sidebar.
 *
 * Two layers decide whether a role may open a path:
 *
 *   1. The Access Control matrix (utils/permissionMatrix + AuthContext). If the
 *      route belongs to a module — '/upload' to `ingestion`, '/users' to
 *      `user_management`, and so on — the matrix is authoritative in both
 *      directions: granting the module opens the route, revoking it closes the
 *      route again. This is what makes an IT Admin's edit reach the target role.
 *   2. ROUTE_ROLES below, for every protected route the matrix has no switch for
 *      (the Dashboard, tender list, the Contract Holder's strategy screens, the
 *      legacy legal-review / execution / closure pages).
 *
 * The router gates on canAccess (so a typed-in URL is blocked exactly like a
 * click) and the sidebar filters its menu with the same call, so a menu item can
 * never drift out of step with what the route actually permits. Live matrix edits
 * reach both through useAccess(), which closes over the matrix held in
 * AuthContext; the bare canAccess() is kept for callers with no React context,
 * and falls back to the shipping defaults.
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
//
// Entries that a module also covers (marked below) are the *defaults only* —
// DEFAULT_MATRIX mirrors them exactly, and once an admin edits the matrix the
// matrix wins. They are kept here so isKnownRoute() still recognises the path and
// so the sidebar can tell a curated default apart from an admin-added grant.
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
  '/create-itt':          [ROLE.CONTRACT_ENGINEER, ROLE.CONTRACT_HOLDER, ROLE.HSE, ROLE.ICV], // module: itt_creation
  '/upload':              [ROLE.CONTRACT_ENGINEER],  // module: ingestion
  '/technical-eval':      [ROLE.CONTRACT_HOLDER],    // module: tech_eval
  '/commercial-eval':     [ROLE.CONTRACT_ENGINEER],  // module: comm_eval
  // Supply Chain's three approval gates.                 module: scm_review
  '/scm-tech-review':     [ROLE.SCM],
  '/scm-review':          [ROLE.SCM],
  '/scm-contract-review': [ROLE.SCM],
  '/contract':            [ROLE.CONTRACT_ENGINEER],  // module: contract_creation
  '/legal-review':        [ROLE.LEGAL_REVIEW],
  '/contract-execution':  [ROLE.CONTRACT_ENGINEER],
  '/contract-management': [ROLE.CONTRACT_ENGINEER],
  '/contract-closure':    [ROLE.CONTRACT_ENGINEER],
  '/audit-log':           ADMIN_ROLES,               // module: audit_log
  '/users':               ADMIN_ROLES,               // module: user_management
}

// '/contract/T-1042' -> '/contract'
export const routeKey = (path) => '/' + String(path || '').split('/')[1]

export const isKnownRoute = (path) => routeKey(path) in ROUTE_ROLES

/**
 * Does the hardcoded ROUTE_ROLES table allow this role here, ignoring the matrix?
 * The sidebar uses it to tell "this role always had the page" from "an admin just
 * granted it", so only the latter needs a menu entry synthesised.
 */
export function staticRouteAllows(roleId, path) {
  if (!roleId) return false
  const allowed = ROUTE_ROLES[routeKey(path)]
  if (allowed === undefined) return false
  if (allowed === null) return true
  return allowed.includes(roleId)
}

/**
 * `matrix` defaults to DEFAULT_MATRIX so non-React callers still get the shipping
 * behaviour; components should go through useAccess() to pick up live edits.
 */
export function canAccess(roleId, path, matrix = DEFAULT_MATRIX) {
  if (!roleId) return false
  const key = routeKey(path)
  if (!(key in ROUTE_ROLES)) return false // not a protected app route
  const moduleKey = ROUTE_MODULE[key]
  // Matrix-governed route: the Access Control grid is the whole answer, so a
  // revoked module closes the page just as surely as a granted one opens it.
  if (moduleKey) return hasModule(matrix, roleId, moduleKey)
  const allowed = ROUTE_ROLES[key]
  if (allowed === null) return true       // open to every signed-in role
  return allowed.includes(roleId)
}

/*
 * Where a role lands when it is turned away from a route — also the post-login
 * destination and the target of the catch-all route.
 *
 * The first entry the role may actually open wins, so this can never point at a
 * page that would bounce the user straight back — including right after an admin
 * revoked whatever the role used to land on. Roles without the Dashboard land on
 * the ITT page; the review roles have no ITT access either, so they fall through
 * to their own workspace. The SCM lands on the award gate, the busiest of its
 * three. '/tenders' is last and is open to every signed-in role, so any role with
 * a session — a brand-new custom role included — has somewhere to go.
 */
const LANDING_ORDER = ['/dashboard', ITT_PATH, '/scm-review', '/legal-review', '/tenders']

export function landingPath(roleId, matrix = DEFAULT_MATRIX) {
  return LANDING_ORDER.find(path => canAccess(roleId, path, matrix)) || '/login'
}

/**
 * Access helpers bound to the signed-in user and the live Access Control matrix.
 * Everything that gates on permissions inside the tree — the router, the sidebar,
 * Back navigation — reads through this, so an admin's edit propagates on the next
 * render instead of waiting for a reload.
 */
export function useAccess() {
  const { user, permissionMatrix } = useAuth()
  const roleId = user?.role?.id
  const matrix = permissionMatrix || DEFAULT_MATRIX
  return useMemo(() => ({
    roleId,
    matrix,
    /** May the signed-in role (or an explicit one) open this path? */
    can: (path, id = roleId) => canAccess(id, path, matrix),
    /** Permission level the signed-in role holds on a module. */
    level: (moduleKey, id = roleId) => levelOf(matrix, id, moduleKey),
    /** The role's landing page under the current matrix. */
    home: landingPath(roleId, matrix),
  }), [roleId, matrix])
}

/** The signed-in user's landing page — for "back to home" style navigation. */
export function useHomePath() {
  return useAccess().home
}
