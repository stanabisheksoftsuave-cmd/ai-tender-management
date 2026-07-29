/*
 * Access Control matrix — the data behind the IT Admin's role x module grid.
 *
 * This file is deliberately data-only (no React, no imports) because two modules
 * that already reference each other both need it: AuthContext owns the live
 * matrix state, while utils/permissions turns that state into route decisions
 * and imports AuthContext for its hooks. Parking the shared data here keeps that
 * pair from forming an import cycle.
 *
 * A level is one of 'NONE' | 'READ' | 'ACTION' | 'CRUD'. For *routing* the only
 * distinction that matters is NONE vs. everything else; the finer levels are kept
 * so a page can still ask "may this role act, or only look?".
 */

export const LEVELS = ['NONE', 'READ', 'ACTION', 'CRUD']

export const MODULES = [
  { key: 'user_management',   label: 'User Management'       },
  { key: 'task_assignment',   label: 'Task Assignment'        },
  { key: 'audit_log',         label: 'Audit Log'             },
  { key: 'itt_creation',      label: 'ITT Creation'          },
  { key: 'tender_export',     label: 'Tender Export'         },
  { key: 'ingestion',         label: 'Bid Ingestion'         },
  { key: 'tech_eval',         label: 'Technical Evaluation'  },
  { key: 'comm_eval',         label: 'Commercial Evaluation' },
  { key: 'scm_review',        label: 'SCM Approval Gates'    },
  { key: 'contract_creation', label: 'Contract Creation'     },
]

export const MODULE_KEYS = MODULES.map(m => m.key)

/*
 * Module -> the routes it unlocks, keyed by first path segment so '/contract' also
 * governs '/contract/:tenderId'.
 *
 * Two modules map to no route at all and are listed with an empty array rather
 * than omitted, so a future module can never be dropped silently:
 *   · task_assignment — the "Reassign Tasks" action inside User Management.
 *   · tender_export   — the export/download buttons on the ITT and tender screens.
 * Toggling either changes nothing about routing; they exist as capability flags.
 *
 * Routes that appear in ROUTE_ROLES but in no module here (the Dashboard, tender
 * list, Contract Strategy / Strategy Templates / PSF / Pre-Qualification, the
 * legacy legal-review and contract execution/closure screens) stay governed by
 * their static ROUTE_ROLES entry — the matrix has no switch for them.
 */
export const MODULE_ROUTES = {
  user_management:   ['/users'],
  task_assignment:   [],
  audit_log:         ['/audit-log'],
  itt_creation:      ['/create-itt'],
  tender_export:     [],
  ingestion:         ['/upload'],
  tech_eval:         ['/technical-eval'],
  comm_eval:         ['/commercial-eval'],
  // The SCM's three approval gates are one grant — a role that reviews one gate
  // reviews all three.
  scm_review:        ['/scm-tech-review', '/scm-review', '/scm-contract-review'],
  contract_creation: ['/contract'],
}

// Reverse index: '/upload' -> 'ingestion'. A route missing from this map is not
// matrix-governed and keeps whatever ROUTE_ROLES says about it.
export const ROUTE_MODULE = Object.fromEntries(
  Object.entries(MODULE_ROUTES).flatMap(([moduleKey, routes]) =>
    routes.map(route => [route, moduleKey])
  )
)

/*
 * Shipping defaults.
 *
 * For every module that owns a route these values mirror the static ROUTE_ROLES
 * table exactly, so turning the matrix into the real gate changes nobody's access
 * on a fresh install. task_assignment and tender_export own no route, so their
 * levels are free-form documentation of who is expected to use those actions.
 */
export const DEFAULT_MATRIX = {
  it_admin:        { user_management:'CRUD', task_assignment:'CRUD', audit_log:'CRUD', itt_creation:'NONE', tender_export:'NONE', ingestion:'NONE', tech_eval:'NONE', comm_eval:'NONE', scm_review:'NONE',   contract_creation:'NONE' },
  // The Business Admin may open User Management but only sees its Dropdowns tab,
  // which is why this is READ rather than CRUD.
  biz_admin:       { user_management:'READ', task_assignment:'CRUD', audit_log:'READ', itt_creation:'NONE', tender_export:'READ', ingestion:'NONE', tech_eval:'NONE', comm_eval:'NONE', scm_review:'NONE',   contract_creation:'NONE' },
  // Contract Engineer owns commercial evaluation; Contract Holder owns technical.
  pof:             { user_management:'NONE', task_assignment:'CRUD', audit_log:'NONE', itt_creation:'CRUD', tender_export:'CRUD', ingestion:'CRUD', tech_eval:'NONE', comm_eval:'CRUD', scm_review:'NONE',   contract_creation:'CRUD' },
  contract_holder: { user_management:'NONE', task_assignment:'CRUD', audit_log:'NONE', itt_creation:'CRUD', tender_export:'READ', ingestion:'NONE', tech_eval:'CRUD', comm_eval:'NONE', scm_review:'NONE',   contract_creation:'NONE' },
  // Supply Chain acts on all three approval gates but authors nothing.
  scm:             { user_management:'NONE', task_assignment:'NONE', audit_log:'NONE', itt_creation:'NONE', tender_export:'NONE', ingestion:'NONE', tech_eval:'NONE', comm_eval:'NONE', scm_review:'ACTION', contract_creation:'NONE' },
  hse:             { user_management:'NONE', task_assignment:'NONE', audit_log:'NONE', itt_creation:'CRUD', tender_export:'READ', ingestion:'NONE', tech_eval:'NONE', comm_eval:'NONE', scm_review:'NONE',   contract_creation:'NONE' },
  icv:             { user_management:'NONE', task_assignment:'NONE', audit_log:'NONE', itt_creation:'CRUD', tender_export:'READ', ingestion:'NONE', tech_eval:'NONE', comm_eval:'NONE', scm_review:'NONE',   contract_creation:'NONE' },
}

export const emptyModuleLevels = () =>
  Object.fromEntries(MODULE_KEYS.map(k => [k, 'NONE']))

export const MATRIX_STORAGE_KEY = 'atm_matrix'
export const MATRIX_VERSION_KEY = 'atm_matrix_v'
// Bump when DEFAULT_MATRIX changes in a way that a stored blob must not override.
// v2 = the matrix became the real route gate.
export const MATRIX_VERSION = '2'

// Keep only module keys we still ship, and only levels we understand.
const sanitiseRow = (row) => Object.fromEntries(
  MODULE_KEYS
    .filter(k => LEVELS.includes(row?.[k]))
    .map(k => [k, row[k]])
)

/*
 * Fold a stored matrix onto the defaults. Stored levels win per cell, but every
 * module key from DEFAULT_MATRIX is always present, so a blob saved before a
 * module existed reads as that module's default instead of silently denying it.
 * Rows for custom roles (ids absent from DEFAULT_MATRIX) are carried through on
 * an all-NONE base.
 */
export function mergeMatrix(stored) {
  const merged = Object.fromEntries(
    Object.entries(DEFAULT_MATRIX).map(([roleId, levels]) => [roleId, { ...levels }])
  )
  if (!stored || typeof stored !== 'object') return merged
  for (const [roleId, row] of Object.entries(stored)) {
    if (!row || typeof row !== 'object') continue
    merged[roleId] = { ...(merged[roleId] || emptyModuleLevels()), ...sanitiseRow(row) }
  }
  return merged
}

/*
 * Read the persisted matrix, migrating anything written before it had teeth.
 *
 * Pre-v2 the matrix was decorative, so it shipped generous READ grants on modules
 * the router never honoured (the Business Admin "read" every evaluation screen,
 * the SCM "read" contract creation, and so on). Replaying those now would hand
 * roles pages they have never actually been able to open, so on a version bump
 * the built-in roles are reset to DEFAULT_MATRIX and only custom roles' rows —
 * which an admin genuinely authored — are carried over.
 */
export function loadStoredMatrix() {
  try {
    const raw = localStorage.getItem(MATRIX_STORAGE_KEY)
    if (!raw) return mergeMatrix(null)
    const parsed = JSON.parse(raw)
    if (localStorage.getItem(MATRIX_VERSION_KEY) !== MATRIX_VERSION) {
      const customOnly = Object.fromEntries(
        Object.entries(parsed || {}).filter(([roleId]) => !(roleId in DEFAULT_MATRIX))
      )
      return mergeMatrix(customOnly)
    }
    return mergeMatrix(parsed)
  } catch {
    return mergeMatrix(null)
  }
}

export function persistMatrix(matrix) {
  try {
    localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(matrix))
    localStorage.setItem(MATRIX_VERSION_KEY, MATRIX_VERSION)
  } catch {
    /* storage unavailable — the in-memory matrix still drives this session */
  }
}

/** Permission level a role holds on a module, e.g. 'READ'. Never undefined. */
export const levelOf = (matrix, roleId, moduleKey) =>
  (matrix || DEFAULT_MATRIX)?.[roleId]?.[moduleKey] || 'NONE'

/** NONE means no access; anything else means access. */
export const hasModule = (matrix, roleId, moduleKey) =>
  levelOf(matrix, roleId, moduleKey) !== 'NONE'
