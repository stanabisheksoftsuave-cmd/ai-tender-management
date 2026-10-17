import { useState, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Loader2, Lock, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useTenders } from '../../context/TenderContext'
import { useDismissable } from '../../context/NavigationContext'
import { useAiLock } from '../../context/aiLockStore'
import { useAccess, staticRouteAllows } from '../../utils/permissions'
import { MODULES } from '../../utils/permissionMatrix'
import TenderPickerPopup from '../shell/TenderPickerPopup'
import ConfirmDialog from '../shell/ConfirmDialog'
import { includedTemplateIds, isTemplateComplete } from '../../utils/strategyTemplates'
import {
  STRATEGY_TEMPLATE_ITEMS,
  cifStageOf,
  isPickableStrategyTender,
  strategyTenderIdFromPath,
} from '../shell/chFlow'

/*
 * Contract Strategy sub-navigation — main app's navigation.config.ts children
 * of "Contract Strategy": Contract Initiating Form, Strategy Templates (whose
 * own children are the *selected* templates, shown only while inside the
 * Strategy Templates area) and PSF Strategy.
 */
const CIF_ITEM = { key: 'sow', label: 'Contract Initiating Form' }
const STRATEGY_TEMPLATES_ITEM = { key: 'strategy-templates', label: 'Strategy Templates' }
const PSF_STRATEGY_ITEM = { key: 'psf-strategy', label: 'PSF Strategy' }

// The Strategy Templates area: its own screen plus every template register
// (?form=…) and the Pre-Qualification Document page it links to.
const isWithinStrategyTemplates = (pathname) =>
  pathname.startsWith('/strategy-templates/') || pathname.startsWith('/pre-qualification/')
const isWithinInitiatingForm = (pathname) =>
  pathname === '/contract-strategy' || pathname.startsWith('/contract-strategy/')

// Same copy as the main app (AUTO_GENERATE_CONFIRM_TITLE / _DESCRIPTION).
const AUTO_GENERATE_CONFIRM_TITLE = 'Open the AI-powered form?'
const AUTO_GENERATE_CONFIRM_DESCRIPTION =
  'The AI will pre-fill this template for your review. The whole application will be disabled until it finishes.'

const PSF_EMPTY_STATE_MESSAGE =
  'No tenders have reached PSF Strategy yet. Complete at least one Strategy Template first — its tender will then appear here.'

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
    { to: '/commercial-eval-profile', icon: '/icons/bulb.svg',   labelKey: 'nav.commEvalProfile' },
    { to: '/commercial-eval',    icon: '/icons/comm-eval.svg',   labelKey: 'nav.ittCommercial' },
    { to: '/contract',           icon: '/icons/contract.svg',    labelKey: 'nav.contract'    },
    { to: '/contract-management',icon: '/icons/mgmt-review.svg', labelKey: 'nav.contractManagement' },
    { to: '/tenders',            icon: '/icons/tenders.svg',     labelKey: 'nav.tenderTrack' },
  ],
  // Main app order: Dashboard · Contract Strategy (→ the strategy hub, with its
  // sub-navigation) · Create ITT · ITT Technical Evaluation · Tender Tracking.
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

// Routes that belong to the Contract Strategy umbrella (parent row active).
const STRATEGY_PATHS = ['/strategy-hub', '/contract-strategy', '/strategy-templates', '/pre-qualification', '/psf-strategy']

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { lang, t } = useLanguage()
  const { theme } = useTheme()
  const { tenders } = useTenders()
  const { isGenerating } = useAiLock()
  const location = useLocation()
  const navigate = useNavigate()
  const roleId = user?.role?.id
  const { can } = useAccess()
  const isRtl = lang === 'ar'
  const { pathname } = location

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

  // The tender the current *strategy* route is about (never another page's id).
  const tenderIdFromUrl = strategyTenderIdFromPath(pathname)
  const activeTender = tenderIdFromUrl ? tenders.find(t => t.id === tenderIdFromUrl) : null

  const viewingTemplates = isWithinStrategyTemplates(pathname)
  const viewingInitiatingForm = isWithinInitiatingForm(pathname)

  // The selected templates nest under "Strategy Templates" — only while browsing
  // that area, and only once the selection has been saved.
  // includedTemplateIds always carries the mandatory Technical Evaluation Matrix.
  const hasSelection = Array.isArray(activeTender?.selectedTemplates)
  const includedIds = hasSelection ? includedTemplateIds(activeTender) : []
  const visibleTemplateItems = viewingTemplates
    ? STRATEGY_TEMPLATE_ITEMS.filter(it => includedIds.includes(it.key))
    : []

  /*
   * PSF Strategy row lock (main app's canMoveForwardToPsf):
   *  - in the Strategy Templates area: every included template completed;
   *  - on the Initiating Form: the draft has already moved forward to PSF;
   *  - anywhere else the gate does not apply (no tender → the picker).
   */
  const canMoveForwardToPsf = viewingTemplates
    ? hasSelection && includedIds.every(id => isTemplateComplete(activeTender, id))
    : viewingInitiatingForm
      ? cifStageOf(activeTender) === 'psf'
      : true
  const psfLockReason = viewingInitiatingForm
    ? 'Locked. This draft has not reached PSF Strategy yet.'
    : 'Locked. Complete every included template before moving forward to PSF Strategy.'

  // Strategy drafts offered by the tender picker.
  const pickerTenders = useMemo(() => tenders.filter(isPickableStrategyTender), [tenders])

  const pathFor = (key, id) => {
    const enc = id ? encodeURIComponent(id) : ''
    if (key === 'sow') return id ? `/contract-strategy/${enc}` : '/contract-strategy'
    if (key === 'strategy-templates') return `/strategy-templates/${enc}`
    if (key === 'pre-qual') return `/pre-qualification/${enc}`
    if (key === 'psf-strategy') return `/psf-strategy/${enc}`
    return `/strategy-templates/${enc}?form=${key}`
  }

  // Sub-item awaiting a tender choice (null when the picker is closed).
  const [pickerItem, setPickerItem] = useState(null)
  useDismissable(!!pickerItem, () => setPickerItem(null))

  const chooseTender = (id) => {
    const key = pickerItem?.key
    setPickerItem(null)
    if (key) navigate(pathFor(key, id))
  }

  // "Open the AI-powered form?" — asked before opening a template that has not
  // been submitted yet (Pre-Qualification aside), same rule as the cards.
  const [pendingTemplateOpen, setPendingTemplateOpen] = useState(null)

  // Sign Out asks for confirmation first, same as the reference app.
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  useDismissable(showSignOutConfirm, () => setShowSignOutConfirm(false))

  const isOlng = theme === 'olng'

  // Is the current path under the Contract Strategy umbrella? Entering it opens
  // the section (adjust-state-on-change, so a hand-collapsed section stays shut
  // while you stay inside it).
  const isStrategySection = STRATEGY_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))
  const [strategyOpen, setStrategyOpen] = useState(isStrategySection)
  const [wasStrategySection, setWasStrategySection] = useState(isStrategySection)
  if (wasStrategySection !== isStrategySection) {
    setWasStrategySection(isStrategySection)
    if (isStrategySection) setStrategyOpen(true)
  }
  const [templatesOpen, setTemplatesOpen] = useState(true)
  const [wasViewingTemplates, setWasViewingTemplates] = useState(viewingTemplates)
  if (wasViewingTemplates !== viewingTemplates) {
    setWasViewingTemplates(viewingTemplates)
    if (viewingTemplates) setTemplatesOpen(true)
  }

  // Which sub-item the current route is.
  const activeSubKey = (() => {
    if (pathname.startsWith('/pre-qualification')) return 'pre-qual'
    if (pathname.startsWith('/psf-strategy')) return 'psf-strategy'
    if (pathname.startsWith('/strategy-templates')) {
      return new URLSearchParams(location.search).get('form') || 'strategy-templates'
    }
    if (isWithinInitiatingForm(pathname)) return 'sow'
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

  /*
   * One Contract Strategy row. Without a tender in the URL it opens the tender
   * picker (the Initiating Form excepted — it has its own drafts picker); PSF
   * Strategy renders inert with a lock icon while its gate is closed; a
   * not-yet-submitted template asks before opening the AI-powered form.
   */
  const renderStrategySubRow = (sub, { depth = 0, trailing = null } = {}) => {
    const needsTender = !tenderIdFromUrl && sub.key !== 'sow'
    const locked = sub.key === 'psf-strategy' && !needsTender && !canMoveForwardToPsf
    const isSubActive = !locked && activeSubKey === sub.key
    const targetPath = pathFor(sub.key, tenderIdFromUrl)

    const rowStyle = {
      background: isSubActive ? 'rgba(0,137,207,0.12)' : 'transparent',
      color: locked ? 'rgba(255,255,255,0.25)' : (isSubActive ? '#ffffff' : 'rgba(255,255,255,0.40)'),
      borderLeft: isSubActive ? `2px solid ${accent}` : '2px solid transparent',
      cursor: locked ? 'not-allowed' : undefined,
    }
    const rowInner = (
      <>
        {locked ? (
          <Lock size={9} className="shrink-0 mt-[3px]" aria-hidden="true" />
        ) : (
          <span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{
            background: isSubActive ? accent : 'rgba(255,255,255,0.25)',
            boxShadow: isSubActive ? `0 0 4px ${accent}` : 'none',
          }} />
        )}
        <span className="min-w-0 flex-1 leading-snug">{sub.label}</span>
      </>
    )
    const rowClass = 'flex flex-1 items-start gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-start transition-all'
    const hover = {
      onMouseOver: e => { if (!isSubActive && !locked) e.currentTarget.style.background = hoverBg },
      onMouseOut:  e => { if (!isSubActive && !locked) e.currentTarget.style.background = 'transparent' },
    }

    let row
    if (locked) {
      row = (
        <span className={rowClass} style={rowStyle} aria-disabled="true"
          title="Complete every selected Strategy Template first">
          {rowInner}
          <span className="sr-only">{psfLockReason}</span>
        </span>
      )
    } else if (needsTender) {
      row = (
        <button type="button" className={`${rowClass} w-full cursor-pointer`} style={rowStyle} {...hover}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            setPickerItem({ key: sub.key, label: sub.label, top: rect.top })
          }}>
          {rowInner}
        </button>
      )
    } else {
      const isTemplate = STRATEGY_TEMPLATE_ITEMS.some(it => it.key === sub.key)
      row = (
        <NavLink to={targetPath} className={rowClass} style={rowStyle} {...hover}
          onClick={event => {
            if (event.ctrlKey || event.metaKey) return
            // Not-yet-submitted AI template (PQQ aside) → confirm first.
            if (isTemplate && sub.key !== 'pre-qual' && activeSubKey !== sub.key
              && !isTemplateComplete(activeTender, sub.key)) {
              event.preventDefault()
              setPendingTemplateOpen({ href: targetPath })
            }
          }}>
          {rowInner}
        </NavLink>
      )
    }

    return (
      <div key={sub.key} className="flex items-center gap-0.5" style={{ marginLeft: depth ? '10px' : 0 }}>
        {row}
        {trailing}
      </div>
    )
  }

  const templatesToggle = visibleTemplateItems.length > 0 ? (
    <button type="button" aria-expanded={templatesOpen}
      aria-label={templatesOpen ? 'Collapse Strategy Templates' : 'Expand Strategy Templates'}
      onClick={() => setTemplatesOpen(o => !o)}
      className="shrink-0 cursor-pointer rounded p-1 transition-colors hover:text-white"
      style={{ color: 'rgba(255,255,255,0.40)' }}>
      {templatesOpen
        ? <ChevronDown size={12} strokeWidth={2.5} aria-hidden="true" />
        : <ChevronRight size={12} strokeWidth={2.5} aria-hidden="true" />}
    </button>
  ) : null

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
      {/* ── AI lock: while a long AI generation runs, nothing in the rail is
          reachable — the page owning the call must not be navigated away from. ── */}
      {isGenerating && (
        <div className="absolute inset-0 z-30 flex items-center justify-center cursor-wait px-4"
          style={{ background: 'rgba(15,40,60,0.60)' }}
          title="AI is running — please wait for it to finish">
          <span role="status" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-white"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            AI is running — please wait…
          </span>
        </div>
      )}

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
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5" aria-label="Main" inert={isGenerating}>
        {navItems.map((item) => {
          // ── Contract Strategy with collapsible children ──
          if (item.hasChildren) {
            const isParentActive = isStrategySection
            return (
              <div key={item.to}>
                {/* Parent: Contract Strategy → the strategy hub; the chevron
                    alone toggles the sub-navigation. */}
                <button
                  type="button"
                  aria-expanded={strategyOpen}
                  aria-label={strategyOpen ? `Collapse ${t(item.labelKey)}` : `Expand ${t(item.labelKey)}`}
                  onClick={() => setStrategyOpen(prev => !prev)}
                  className="w-full flex items-center justify-between rounded-xl text-xs font-medium cursor-pointer transition-all px-3 py-2.5 text-left"
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
                  <span className="shrink-0 opacity-50 flex items-center" style={{ transform: strategyOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <ChevronRight size={12} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                </button>

                {/* Children: CIF, Strategy Templates (+ its selected templates
                    while inside that area), then PSF Strategy. */}
                {strategyOpen && (
                  <div className="mt-0.5 space-y-px" style={{ paddingLeft: isRtl ? 0 : '18px', paddingRight: isRtl ? '18px' : 0 }}>
                    {renderStrategySubRow(CIF_ITEM)}
                    {renderStrategySubRow(STRATEGY_TEMPLATES_ITEM, { trailing: templatesToggle })}
                    {templatesOpen && visibleTemplateItems.map(sub => renderStrategySubRow(sub, { depth: 1 }))}
                    {renderStrategySubRow(PSF_STRATEGY_ITEM)}
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
      <div className="px-3 pb-4" inert={isGenerating}>
        <div className="h-px mb-3" style={{ background: divider }} />

        {/* Sign Out */}
        <button
          onClick={() => setShowSignOutConfirm(true)}
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

    {/* ── Sign Out confirmation — rendered outside <aside> so its z-index isn't
        scoped inside the sidebar's own stacking context (it would otherwise
        paint behind the top Header bar, which sits at a higher z-index as a
        sibling stacking context). ── */}
    {showSignOutConfirm && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => setShowSignOutConfirm(false)}>
        <div onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col items-center text-center gap-4">
          <span className="flex w-14 h-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'var(--color-primary)15', color: 'var(--color-primary)' }}>
            <LogOut size={24} />
          </span>
          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-800">Sign out</p>
            <p className="text-sm text-slate-500">Are you sure you want to sign out?</p>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="px-6 py-2 rounded-full text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={logout}
              className="px-6 py-2 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── "Open the AI-powered form?" before a not-yet-submitted template ── */}
    <ConfirmDialog
      isOpen={pendingTemplateOpen !== null}
      icon={Sparkles}
      title={AUTO_GENERATE_CONFIRM_TITLE}
      description={AUTO_GENERATE_CONFIRM_DESCRIPTION}
      confirmLabel="Open form"
      onConfirm={() => {
        const target = pendingTemplateOpen
        setPendingTemplateOpen(null)
        // autogen=1 — answered here, so the register does not ask again.
        if (target) navigate(`${target.href}&autogen=1`)
      }}
      onClose={() => setPendingTemplateOpen(null)}
    />

    {/* ── Tender picker: which strategy draft the sub-item opens ── */}
    {pickerItem && (
      <TenderPickerPopup
        itemLabel={pickerItem.label}
        top={pickerItem.top}
        tenders={pickerTenders}
        isRtl={isRtl}
        stageFilter={pickerItem.key === 'psf-strategy' ? 'psf' : undefined}
        emptyStateMessage={pickerItem.key === 'psf-strategy' ? PSF_EMPTY_STATE_MESSAGE : undefined}
        onChoose={chooseTender}
        onOpenInitiatingForm={() => { setPickerItem(null); navigate('/contract-strategy') }}
        onClose={() => setPickerItem(null)}
      />
    )}
    </>
  )
}
