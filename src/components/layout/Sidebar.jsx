import { useState, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useTenders } from '../../context/TenderContext'
import { useDismissable } from '../../context/NavigationContext'
import { useAccess, staticRouteAllows } from '../../utils/permissions'
import { MODULES } from '../../utils/permissionMatrix'
import Badge from '../ui/Badge'
import { tenderRef } from '../../utils/tenderRef'

// ── Custom SVG icons from assets/icons ────────────────────────────────────────
const Icon = ({ src, size = 16, color }) => (
  <img
    src={src}
    alt=""
    width={size}
    height={size}
    style={{
      filter: color === 'active'
        ? 'brightness(0) invert(1)'
        : 'brightness(0) invert(0.65)',
      transition: 'filter 0.15s',
    }}
    className="shrink-0"
  />
)

// Fixed strategy sub-items always shown
const STRATEGY_BASE_ITEMS = [
  { key: 'sow',                label: 'Contract Initiating Form' },
  { key: 'strategy-templates', label: 'Strategy Templates' },
  { key: 'psf-strategy',       label: 'PSF Strategy' },
]

// Template/workflow sub-items — shown only when included in the tender's selected templates.
// Keys must match the template ids used on the Strategy Templates page (?form=<key>).
const STRATEGY_TEMPLATE_ITEMS = [
  { key: 'company-estimate',    label: 'Company Estimate' },
  { key: 'contract-risk',       label: 'Contract Risk' },
  { key: 'icv',                 label: 'ICV' },
  { key: 'technical-eval-matrix', label: 'Technical Evaluation Matrix' },
  { key: 'hse-risk',            label: 'HSE Risk Assessment' },
  { key: 'negotiation-strategy',label: 'Negotiation Strategy' },
  { key: 'pre-qual',            label: 'Pre-Qualification' },
]

// A tender "created by the Contract Initiating Form" is one still inside the
// Contract Holder's strategy flow: the CIF saves new tenders as prequal_stage1
// and they walk the prequal_* stages from there. A `draft` tender only belongs
// here once selectedTemplates exists, which the Strategy Templates
// acknowledgement gate writes — that keeps ITT/CE-created drafts out of the picker.
const CIF_STATUSES = [
  'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4',
  'prequal_final_review', 'prequal_rejected',
]
const isCifTender = (t) =>
  CIF_STATUSES.includes(t.status) ||
  (t.status === 'draft' && Array.isArray(t.selectedTemplates))

// Menu per role. Every entry is still run through canAccess() below, so an item
// can never appear for a role the route itself would turn away — the Dashboard,
// for instance, belongs to the Contract Holder and the two admin roles only.
const navByRole = {
  it_admin: [
    { to: '/dashboard', icon: '/icons/dashboard.svg', labelKey: 'nav.dashboard' },
    { to: '/users',     icon: '/icons/users.svg',     labelKey: 'nav.users'     },
    { to: '/audit-log', icon: '/icons/audit-log.svg', labelKey: 'nav.auditLog'  },
  ],
  biz_admin: [
    { to: '/dashboard', icon: '/icons/dashboard.svg', labelKey: 'nav.dashboard'   },
    { to: '/tenders',   icon: '/icons/tenders.svg',   labelKey: 'nav.tenderTrack' },
  ],
  pof: [
    { to: '/pre-qualification',  icon: '/icons/bulb.svg',        labelKey: 'nav.pqqFinancial' },
    { to: '/create-itt',         icon: '/icons/create-itt.svg',  labelKey: 'nav.ittDraft'    },
    { to: '/upload',             icon: '/icons/ingestion.svg',   labelKey: 'nav.ingestion'   },
    { to: '/commercial-eval',    icon: '/icons/comm-eval.svg',   labelKey: 'nav.ittCommercial' },
    { to: '/contract',           icon: '/icons/contract.svg',    labelKey: 'nav.contract'    },
    { to: '/contract-management',icon: '/icons/mgmt-review.svg', labelKey: 'nav.contractManagement' },
    { to: '/tenders',            icon: '/icons/tenders.svg',     labelKey: 'nav.tenderTrack' },
  ],
  contract_holder: [
    { to: '/dashboard',          icon: '/icons/dashboard.svg',   labelKey: 'nav.dashboard'   },
    { to: '/contract-strategy',  icon: '/icons/bulb.svg',        labelKey: 'nav.contractStrategy',
      hasChildren: true },
    { to: '/create-itt',         icon: '/icons/create-itt.svg',  labelKey: 'nav.createItt'   },
    { to: '/technical-eval',     icon: '/icons/tech-eval.svg',   labelKey: 'nav.ittTechEval' },
    { to: '/tenders',            icon: '/icons/tenders.svg',     labelKey: 'nav.tenderTrack' },
  ],
  scm: [
    { to: '/scm-tech-review',     icon: '/icons/tech-eval.svg',   labelKey: 'nav.scmTechReview' },
    { to: '/scm-review',          icon: '/icons/mgmt-review.svg', labelKey: 'nav.scmAwardReview' },
    { to: '/scm-contract-review', icon: '/icons/contract.svg',    labelKey: 'nav.scmContractReview' },
    { to: '/tenders',             icon: '/icons/tenders.svg',     labelKey: 'nav.tenders'   },
  ],
  legal_review: [
    { to: '/legal-review', icon: '/icons/audit-log.svg',  labelKey: 'nav.legalReview' },
  ],
  // HSE and ICV each own their ITT sections; they reach them from the same
  // "ITT Draft" entry the Contract Engineer uses (the page scopes to each role's
  // own sections). Tender Tracking is included so they can find generated ITTs.
  hse: [
    { to: '/create-itt', icon: '/icons/create-itt.svg',  labelKey: 'nav.ittDraft' },
    { to: '/tenders',    icon: '/icons/tenders.svg',     labelKey: 'nav.tenderTrack' },
  ],
  icv: [
    { to: '/create-itt', icon: '/icons/create-itt.svg',  labelKey: 'nav.ittDraft' },
    { to: '/tenders',    icon: '/icons/tenders.svg',     labelKey: 'nav.tenderTrack' },
  ],
}

// Menu entries for the Access Control modules that own a route. navByRole above
// stays the curated menu each built-in role ships with; this table is the
// fallback used when the IT Admin grants a module that a role's hardcoded menu
// never listed, so the grant becomes a visible item rather than a URL you have to
// know. Custom roles have no navByRole entry at all and are built entirely from
// here. Modules with no route (task_assignment, tender_export) are absent by
// design — there is nothing to navigate to.
const MODULE_NAV = {
  user_management:   [{ to: '/users',           icon: '/icons/users.svg',       labelKey: 'nav.users'      }],
  audit_log:         [{ to: '/audit-log',       icon: '/icons/audit-log.svg',   labelKey: 'nav.auditLog'   }],
  itt_creation:      [{ to: '/create-itt',      icon: '/icons/create-itt.svg',  labelKey: 'nav.ittDraft'   }],
  ingestion:         [{ to: '/upload',          icon: '/icons/ingestion.svg',   labelKey: 'nav.ingestion'  }],
  tech_eval:         [{ to: '/technical-eval',  icon: '/icons/tech-eval.svg',   labelKey: 'nav.techEval'   }],
  comm_eval:         [{ to: '/commercial-eval', icon: '/icons/comm-eval.svg',   labelKey: 'nav.commEval'   }],
  // One grant covers all three SCM gates, so all three get an entry.
  scm_review: [
    { to: '/scm-tech-review',     icon: '/icons/tech-eval.svg',   labelKey: 'nav.scmTechReview'     },
    { to: '/scm-review',          icon: '/icons/mgmt-review.svg', labelKey: 'nav.scmAwardReview'    },
    { to: '/scm-contract-review', icon: '/icons/contract.svg',    labelKey: 'nav.scmContractReview' },
  ],
  contract_creation: [{ to: '/contract',        icon: '/icons/contract.svg',    labelKey: 'nav.contract'   }],
}

// Open to every signed-in role and the last resort of landingPath(), so a role
// with no curated menu is never left staring at an empty sidebar.
const TENDERS_ITEM = { to: '/tenders', icon: '/icons/tenders.svg', labelKey: 'nav.tenderTrack' }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { lang, t } = useLanguage()
  const { theme } = useTheme()
  const { tenders } = useTenders()
  const location = useLocation()
  const navigate = useNavigate()
  const roleId = user?.role?.id
  const { can } = useAccess()
  const isRtl = lang === 'ar'

  /*
   * The menu is the curated navByRole list minus anything Access Control has
   * revoked, plus an entry for every module granted *beyond* the role's static
   * ROUTE_ROLES defaults. Filtering on staticRouteAllows is what keeps the
   * shipping menus byte-identical: with DEFAULT_MATRIX untouched every granted
   * module is already statically allowed, so nothing is synthesised. `can` is
   * re-created whenever the live matrix changes, which is what makes an admin's
   * grant redraw this menu without a reload.
   */
  const navItems = useMemo(() => {
    const curated = (navByRole[roleId] || []).filter(item => can(item.to))
    const seen = new Set(curated.map(i => i.to))
    const granted = MODULES.flatMap(m => MODULE_NAV[m.key] || [])
      .filter(item => !seen.has(item.to) && !staticRouteAllows(roleId, item.to) && can(item.to))
    granted.forEach(i => seen.add(i.to))
    const fallback = !navByRole[roleId] && !seen.has(TENDERS_ITEM.to) ? [TENDERS_ITEM] : []
    return [...curated, ...granted, ...fallback]
  }, [roleId, can])

  // Tender id from the current URL (/…/:tenderId) drives which strategy sub-items appear.
  const pathParts = location.pathname.split('/')
  const tenderIdFromUrl = pathParts.length > 2 ? pathParts[2] : null
  const activeTender = tenderIdFromUrl ? tenders.find(t => t.id === tenderIdFromUrl) : null

  // Which templates the Contract Holder chose to include (defaults to all until acknowledged).
  const allTemplateKeys = STRATEGY_TEMPLATE_ITEMS.map(it => it.key)
  const selectedTemplateKeys = Array.isArray(activeTender?.selectedTemplates)
    ? activeTender.selectedTemplates
    : allTemplateKeys

  const strategySubItems = [
    ...STRATEGY_BASE_ITEMS,
    ...STRATEGY_TEMPLATE_ITEMS.filter(it => selectedTemplateKeys.includes(it.key)),
  ]

  // Tenders the Contract Holder started from the Contract Initiating Form —
  // offered as a picker when a strategy sub-item is clicked without a tenderId.
  const cifTenders = useMemo(() => tenders.filter(isCifTender), [tenders])

  const pathFor = (key, id) =>
    key === 'pre-qual'
      ? `/pre-qualification/${id || ''}`
      : key === 'psf-strategy'
      ? `/psf-strategy/${id || ''}`
      : key === 'sow'
        ? (id ? `/contract-strategy/${id}` : '/contract-strategy')
        : key === 'strategy-templates'
          ? `/strategy-templates/${id || ''}`
          : `/strategy-templates/${id || ''}?form=${key}`

  // Sub-item awaiting a tender choice (null when the picker is closed).
  const [pickerItem, setPickerItem] = useState(null)
  useDismissable(!!pickerItem, () => setPickerItem(null))

  const chooseTender = (id) => {
    const key = pickerItem?.key
    setPickerItem(null)
    if (key) navigate(pathFor(key, id))
  }

  const isOlng   = theme === 'olng'

  // Is the current path under the Contract Strategy umbrella?
  const strategyPaths = ['/contract-strategy', '/strategy-templates', '/pre-qualification', '/psf-strategy']
  const isStrategySection = strategyPaths.some(p => location.pathname.startsWith(p))
  const [strategyOpen, setStrategyOpen] = useState(isStrategySection)

  // Determine which sub-item is active based on current path
  const activeSubKey = (() => {
    if (location.pathname.startsWith('/pre-qualification')) return 'pre-qual'
    if (location.pathname.startsWith('/psf-strategy')) return 'psf-strategy'
    if (location.pathname.startsWith('/strategy-templates')) {
      const searchParams = new URLSearchParams(location.search)
      const formParam = searchParams.get('form')
      if (formParam) return formParam
      return 'strategy-templates'
    }
    if (location.pathname.startsWith('/contract-strategy')) return 'sow'
    return null
  })()

  // sidebar token colours
  const sidebarBg = isOlng ? '#1b4c6f' : 'var(--color-sidebar)'
  const accent     = isOlng ? '#0089cf' : 'var(--color-primary)'
  const logoText   = '#ffffff'
  const logoSub    = 'rgba(255,255,255,0.50)'
  const divider    = 'rgba(255,255,255,0.10)'
  const chipBg     = 'rgba(255,255,255,0.08)'
  const chipBorder = '1px solid rgba(255,255,255,0.12)'
  const userName   = '#ffffff'
  const userRole   = 'rgba(255,255,255,0.55)'
  const navLabel   = 'rgba(255,255,255,0.30)'
  const activeNavBg      = 'rgba(255,255,255,0.12)'
  const activeNavBorder  = `2px solid ${accent}`
  const inactiveColor    = 'rgba(255,255,255,0.55)'
  const hoverBg          = 'rgba(255,255,255,0.06)'
  const logoutColor      = 'rgba(255,255,255,0.40)'
  const logoutHoverBg    = 'rgba(239,68,68,0.12)'
  const logoutHoverColor = '#F87171'

  const handleStrategyToggle = () => {
    setStrategyOpen(prev => !prev)
  }

  return (
    <>
    <aside
      className={`fixed ${isRtl ? 'right-0' : 'left-0'} top-0 h-screen w-[220px] flex flex-col z-40 select-none`}
      style={{
        background: sidebarBg,
        borderRight: isRtl ? 'none' : `1px solid ${divider}`,
        borderLeft:  isRtl ? `1px solid ${divider}` : 'none',
      }}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <img src="/olng-logo-white.svg" alt="OLNG" className="h-10 w-10 object-contain shrink-0" />
        <div>
          <div className="font-bold text-sm leading-tight tracking-tight" style={{ color: logoText }}>
            Oman LNG
          </div>
          <div className="text-[10px] tracking-wide mt-0.5" style={{ color: logoSub }}>
            Tender Management
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 h-px" style={{ background: divider }} />

      {/* ── User chip ── */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: chipBg, border: chipBorder }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.2))` }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight" style={{ color: userName }}>
              {user?.name}
            </div>
            <div className="text-[10px] truncate mt-0.5" style={{ color: userRole }}>
              {user?.role?.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav label ── */}
      <div className="px-6 mb-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: navLabel }}>
          {t('nav.label')}
        </p>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          // ── Contract Strategy with collapsible children ──
          if (item.hasChildren) {
            const isParentActive = isStrategySection
            return (
              <div key={item.to}>
                {/* Parent: Contract Strategy */}
                <button
                  onClick={handleStrategyToggle}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: isParentActive ? activeNavBg : 'transparent',
                    borderLeft: isParentActive ? activeNavBorder : '2px solid transparent',
                    color: isParentActive ? '#ffffff' : inactiveColor,
                  }}
                  onMouseOver={e => { if (!isParentActive) e.currentTarget.style.background = hoverBg }}
                  onMouseOut={e => { if (!isParentActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="flex items-center gap-2.5">
                    <img
                      src={item.icon}
                      alt=""
                      width={15}
                      height={15}
                      style={{
                        filter: isParentActive
                          ? 'brightness(0) invert(1)'
                          : 'brightness(0) invert(0.55)',
                      }}
                    />
                    {t(item.labelKey)}
                  </span>
                  {/* Chevron indicator */}
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: strategyOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      opacity: 0.5,
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Children: sub-items */}
                {strategyOpen && (
                  <div className="mt-0.5 space-y-px" style={{ paddingLeft: isRtl ? 0 : '18px', paddingRight: isRtl ? '18px' : 0 }}>
                    {strategySubItems.map(sub => {
                      const isSubActive = activeSubKey === sub.key

                      // Without a tenderId in the URL the sub-item cannot resolve a
                      // target, so it asks the user which CIF tender to open instead.
                      const needsTender = !tenderIdFromUrl && sub.key !== 'sow'
                      const targetPath = pathFor(sub.key, tenderIdFromUrl)

                      const row = (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            background: isSubActive ? 'rgba(0,137,207,0.12)' : 'transparent',
                            color: isSubActive ? '#ffffff' : 'rgba(255,255,255,0.40)',
                            borderLeft: isSubActive ? `2px solid ${accent}` : '2px solid transparent',
                          }}
                          onMouseOver={e => { if (!isSubActive) e.currentTarget.style.background = hoverBg }}
                          onMouseOut={e => { if (!isSubActive) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span className="w-1 h-1 rounded-full shrink-0" style={{
                            background: isSubActive ? accent : 'rgba(255,255,255,0.25)',
                            boxShadow: isSubActive ? `0 0 4px ${accent}` : 'none',
                          }} />
                          {sub.label}
                        </div>
                      )

                      if (needsTender) {
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            onClick={() => setPickerItem(sub)}
                            className="block w-full text-start"
                          >
                            {row}
                          </button>
                        )
                      }

                      return (
                        <NavLink key={sub.key} to={targetPath} className="block">
                          {row}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // ── Regular nav item ──
          return (
            <NavLink key={item.to} to={item.to} className="block">
              {({ isActive }) => (
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background:  isActive ? activeNavBg : 'transparent',
                    borderLeft:  isActive ? activeNavBorder : '2px solid transparent',
                    color: isActive ? '#ffffff' : inactiveColor,
                  }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.background = hoverBg }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="flex items-center gap-2.5">
                    <img
                      src={item.icon}
                      alt=""
                      width={15}
                      height={15}
                      style={{
                        filter: isActive
                          ? 'brightness(0) invert(1)'
                          : 'brightness(0) invert(0.55)',
                      }}
                    />
                    {t(item.labelKey)}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 pb-4">
        <div className="h-px mb-3" style={{ background: divider }} />

        {/* Sign Out */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
          style={{ color: logoutColor }}
          onMouseOver={e => { e.currentTarget.style.background = logoutHoverBg; e.currentTarget.style.color = logoutHoverColor }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = logoutColor }}
        >
          <img src="/icons/logout.svg" alt="" width={14} height={14}
            style={{ filter: 'brightness(0) invert(0.5)' }} />
          {t('nav.signOut')}
        </button>
      </div>
    </aside>

    {/* ── Tender picker: choose which CIF tender the strategy sub-item opens ── */}
    {pickerItem && (
      <>
        <div
          className="fixed inset-0 z-30"
          style={{ background: 'rgba(2,10,20,0.45)' }}
          onClick={() => setPickerItem(null)}
        />
        <div
          className={`fixed top-24 ${isRtl ? 'right-[228px]' : 'left-[228px]'} w-[320px] max-h-[70vh] flex flex-col z-50 rounded-2xl overflow-hidden`}
          style={{
            background: sidebarBg,
            border: `1px solid ${divider}`,
            boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          }}
        >
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${divider}` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: navLabel }}>
                  Select Tender
                </p>
                <p className="text-xs font-semibold mt-1 truncate" style={{ color: '#ffffff' }}>
                  {pickerItem.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerItem(null)}
                className="text-sm leading-none px-1.5 py-1 rounded-md shrink-0"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseOver={e => { e.currentTarget.style.background = hoverBg }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cifTenders.length === 0 ? (
              <div className="px-3 py-5 text-center">
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  No tenders yet. Complete a Contract Initiating Form first — its tender
                  will then appear here.
                </p>
                <button
                  type="button"
                  onClick={() => { setPickerItem(null); navigate('/contract-strategy') }}
                  className="mt-3 w-full px-3 py-2 rounded-lg text-[11px] font-semibold"
                  style={{ background: accent, color: '#ffffff' }}
                >
                  Contract Initiating Form
                </button>
              </div>
            ) : (
              cifTenders.map(tender => (
                <button
                  key={tender.id}
                  type="button"
                  onClick={() => chooseTender(tender.id)}
                  className="w-full text-start px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: chipBg, border: chipBorder }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                  onMouseOut={e => { e.currentTarget.style.background = chipBg }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-wide" style={{ color: accent }}>
                      {tenderRef(tender)}
                    </span>
                    <Badge variant={tender.status}>{tender.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-[11px] font-medium mt-1 leading-snug" style={{ color: '#ffffff' }}>
                    {tender.title}
                  </p>
                  {tender.stage && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {tender.stage}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </>
    )}
    </>
  )
}
