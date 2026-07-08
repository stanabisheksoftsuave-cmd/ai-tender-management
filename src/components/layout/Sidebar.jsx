import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'

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

const navByRole = {
  it_admin: [
    { to: '/dashboard', icon: '/src/assets/icons/dashboard.svg', labelKey: 'nav.dashboard' },
    { to: '/users',     icon: '/src/assets/icons/users.svg',     labelKey: 'nav.users'     },
    { to: '/audit-log', icon: '/src/assets/icons/audit-log.svg', labelKey: 'nav.auditLog'  },
  ],
  biz_admin: [
    { to: '/dashboard', icon: '/src/assets/icons/dashboard.svg', labelKey: 'nav.dashboard'   },
    { to: '/tenders',   icon: '/src/assets/icons/tenders.svg',   labelKey: 'nav.tenderTrack' },
  ],
  pof: [
    { to: '/dashboard',          icon: '/src/assets/icons/dashboard.svg',   labelKey: 'nav.dashboard'   },
    { to: '/tenders',            icon: '/src/assets/icons/tenders.svg',     labelKey: 'nav.tenderTrack' },
    { to: '/create-itt',         icon: '/src/assets/icons/create-itt.svg',  labelKey: 'nav.createItt'   },
    { to: '/upload',             icon: '/src/assets/icons/ingestion.svg',   labelKey: 'nav.ingestion'   },
    { to: '/contract',           icon: '/src/assets/icons/contract.svg',    labelKey: 'nav.contract'    },
    { to: '/contract-management',icon: '/src/assets/icons/mgmt-review.svg', labelKey: 'nav.contractManagement' },
  ],
  contract_holder: [
    { to: '/dashboard',          icon: '/src/assets/icons/dashboard.svg',   labelKey: 'nav.dashboard'   },
    { to: '/tenders',            icon: '/src/assets/icons/tenders.svg',     labelKey: 'nav.tenderTrack' },
    { to: '/contract-strategy',  icon: '/src/assets/icons/bulb.svg',        labelKey: 'nav.contractStrategy' },
    { to: '/pre-qualification',  icon: '/src/assets/icons/users.svg',       labelKey: 'nav.preQualification' },
  ],
  tech_eval: [
    { to: '/dashboard',      icon: '/src/assets/icons/dashboard.svg',  labelKey: 'nav.dashboard' },
    { to: '/technical-eval', icon: '/src/assets/icons/tech-eval.svg',  labelKey: 'nav.techEval'  },
  ],
  comm_eval: [
    { to: '/dashboard',       icon: '/src/assets/icons/dashboard.svg', labelKey: 'nav.dashboard' },
    { to: '/commercial-eval', icon: '/src/assets/icons/comm-eval.svg', labelKey: 'nav.commEval'  },
  ],
  mgmt_review: [
    { to: '/dashboard',   icon: '/src/assets/icons/dashboard.svg',   labelKey: 'nav.dashboard' },
    { to: '/tenders',     icon: '/src/assets/icons/tenders.svg',     labelKey: 'nav.tenders'   },
    { to: '/mgmt-review', icon: '/src/assets/icons/mgmt-review.svg', labelKey: 'nav.mgmtReview'},
  ],
  legal_review: [
    { to: '/dashboard',    icon: '/src/assets/icons/dashboard.svg',  labelKey: 'nav.dashboard' },
    { to: '/legal-review', icon: '/src/assets/icons/audit-log.svg',  labelKey: 'nav.legalReview' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const { theme } = useTheme()
  const navItems = navByRole[user?.role?.id] || []
  const isRtl = lang === 'ar'

  const isOlng   = theme === 'olng'
  const isBright = theme === 'bright'

  // sidebar token colours
  const sidebarBg = isOlng ? '#1b4c6f' : isBright ? '#1e293b' : 'var(--color-sidebar)'
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

  return (
    <aside
      className={`fixed ${isRtl ? 'right-0' : 'left-0'} top-16 h-[calc(100vh-4rem)] w-[220px] flex flex-col z-40 select-none`}
      style={{
        background: sidebarBg,
        borderRight: isRtl ? 'none' : `1px solid ${divider}`,
        borderLeft:  isRtl ? `1px solid ${divider}` : 'none',
      }}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <img src="/olng-logo.png" alt="OLNG" className="h-10 w-10 object-contain shrink-0" />
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
        {navItems.map((item) => (
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
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 pb-4">
        <div className="h-px mb-3" style={{ background: divider }} />

        {/* Language toggle */}
        <div className="flex items-center gap-1 mb-2 p-0.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          {['en', 'ar'].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all"
              style={lang === l
                ? { background: accent, color: '#fff', fontFamily: l === 'ar' ? "'Cairo', sans-serif" : undefined }
                : { color: 'rgba(255,255,255,0.40)', fontFamily: l === 'ar' ? "'Cairo', sans-serif" : undefined }
              }
            >
              {l === 'en' ? 'EN' : 'عربي'}
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
          style={{ color: logoutColor }}
          onMouseOver={e => { e.currentTarget.style.background = logoutHoverBg; e.currentTarget.style.color = logoutHoverColor }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = logoutColor }}
        >
          <img src="/src/assets/icons/logout.svg" alt="" width={14} height={14}
            style={{ filter: 'brightness(0) invert(0.5)' }} />
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  )
}
