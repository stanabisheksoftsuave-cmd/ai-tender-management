import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Upload, ClipboardCheck, BarChart3,
  Settings, LogOut, Bot,
  ScrollText, Activity, Scale, UserCog, Briefcase, Users
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'

const navByRole = {
  admin: [
    { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/tenders',     icon: FileText,         labelKey: 'nav.tenders' },
    { to: '/users',       icon: Users,            labelKey: 'nav.users' },
    { to: '/audit-log',   icon: ScrollText,       labelKey: 'nav.auditLog' },
    { to: '/system',      icon: Settings,         labelKey: 'nav.system' },
  ],
  pof: [
    { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/tenders',     icon: FileText,         labelKey: 'nav.tenderTrack' },
    { to: '/create-itt',  icon: Bot,              labelKey: 'nav.createItt' },
    { to: '/upload',      icon: Upload,           labelKey: 'nav.ingestion' },
  ],
  tech_eval: [
    { to: '/dashboard',      icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/technical-eval', icon: ClipboardCheck,  labelKey: 'nav.techEval' },
  ],
  comm_eval: [
    { to: '/dashboard',       icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/commercial-eval', icon: BarChart3,       labelKey: 'nav.commEval' },
  ],
  legal_review: [
    { to: '/dashboard',    icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/legal-review', icon: Scale,            labelKey: 'nav.legalReview' },
  ],
  mgmt_review: [
    { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/tenders',     icon: FileText,         labelKey: 'nav.tenders' },
    { to: '/mgmt-review', icon: UserCog,          labelKey: 'nav.mgmtReview' },
  ],
  contractor_eng: [
    { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/tenders',     icon: FileText,         labelKey: 'nav.tenderTrack' },
    { to: '/contract',    icon: Briefcase,        labelKey: 'nav.contract' },
  ],
  it_admin: [
    { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/system',      icon: Activity,         labelKey: 'nav.system' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const { theme } = useTheme()
  const navItems = navByRole[user?.role?.id] || []
  const isRtl = lang === 'ar'

  // Only the bright theme has a white sidebar; all others keep the dark sidebar
  const light = theme === 'bright'

  const sd = light ? {
    border:           `1px solid #E2E8F0`,
    divider:          '#E2E8F0',
    appName:          '#0F172A',
    appSub:           '#94A3B8',
    chipBg:           '#F8FAFC',
    chipBorder:       '1px solid #E2E8F0',
    userName:         '#0F172A',
    userRole:         '#94A3B8',
    navLabel:         '#CBD5E1',
    activeNavBg:      '#EEF2FF',
    activeNavColor:   '#1D4ED8',
    inactiveColor:    '#64748B',
    hoverBg:          '#F1F5F9',
    hoverColor:       '#0F172A',
    activeAccent:     '#2563EB',
    activeGlow:       'rgba(37,99,235,0.35)',
    iconActive:       '#2563EB',
    iconInactive:     '#94A3B8',
    langBg:           '#F1F5F9',
    langActive:       { background: '#2563EB', color: '#fff' },
    langInactive:     { color: '#64748B' },
    langArabicActive: { fontFamily: "'Cairo', sans-serif", background: '#2563EB', color: '#fff' },
    langArabicInact:  { fontFamily: "'Cairo', sans-serif", color: '#64748B' },
    logoutColor:      '#94A3B8',
    logoutHoverBg:    '#FEF2F2',
    logoutHoverColor: '#EF4444',
    shadow:           '2px 0 12px rgba(0,0,0,0.06)',
  } : {
    border:           `rgba(255,255,255,0.05)`,
    divider:          'rgba(255,255,255,0.05)',
    appName:          '#fff',
    appSub:           'rgba(255,255,255,0.25)',
    chipBg:           'rgba(255,255,255,0.05)',
    chipBorder:       '1px solid rgba(255,255,255,0.06)',
    userName:         'rgba(255,255,255,0.9)',
    userRole:         'rgba(255,255,255,0.3)',
    navLabel:         'rgba(255,255,255,0.18)',
    activeNavBg:      'rgba(37,99,235,0.18)',
    activeNavColor:   '#fff',
    inactiveColor:    'rgba(255,255,255,0.4)',
    hoverBg:          'rgba(255,255,255,0.05)',
    hoverColor:       'rgba(255,255,255,0.75)',
    activeAccent:     '#3B82F6',
    activeGlow:       'rgba(59,130,246,0.8)',
    iconActive:       '#60A5FA',
    iconInactive:     'rgba(255,255,255,0.3)',
    langBg:           'rgba(255,255,255,0.04)',
    langActive:       { background: 'rgba(37,99,235,0.4)', color: '#fff' },
    langInactive:     { color: 'rgba(255,255,255,0.3)' },
    langArabicActive: { fontFamily: "'Cairo', sans-serif", background: 'rgba(37,99,235,0.4)', color: '#fff' },
    langArabicInact:  { fontFamily: "'Cairo', sans-serif", color: 'rgba(255,255,255,0.3)' },
    logoutColor:      'rgba(255,255,255,0.3)',
    logoutHoverBg:    'rgba(239,68,68,0.1)',
    logoutHoverColor: '#F87171',
    shadow:           'none',
  }

  return (
    <aside
      className={`fixed ${isRtl ? 'right-0' : 'left-0'} top-0 h-screen w-[232px] flex flex-col z-40 select-none`}
      style={{
        background: 'var(--color-sidebar)',
        borderRight: isRtl ? 'none' : `1px solid ${sd.border}`,
        borderLeft:  isRtl ? `1px solid ${sd.border}` : 'none',
        boxShadow: sd.shadow,
      }}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight tracking-tight" style={{ color: sd.appName }}>AI Tender</div>
            <div className="text-[10px] tracking-wide" style={{ color: sd.appSub }}>Management System</div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 h-px mb-3" style={{ background: sd.divider }} />

      {/* ── User chip ── */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: sd.chipBg, border: sd.chipBorder }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight" style={{ color: sd.userName }}>{user?.name}</div>
            <div className="text-[10px] truncate mt-0.5" style={{ color: sd.userRole }}>{user?.role?.label}</div>
          </div>
        </div>
      </div>

      {/* ── Nav label ── */}
      <div className="px-6 mb-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: sd.navLabel }}>
          {t('nav.label')}
        </p>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} className="sidebar-item block">
              {({ isActive }) => (
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium group relative"
                  style={{
                    background: isActive ? sd.activeNavBg : 'transparent',
                    color: isActive ? sd.activeNavColor : sd.inactiveColor,
                  }}
                  onMouseOver={e => {
                    if (!isActive) { e.currentTarget.style.background = sd.hoverBg; e.currentTarget.style.color = sd.hoverColor }
                  }}
                  onMouseOut={e => {
                    if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = sd.inactiveColor }
                  }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: sd.activeAccent, boxShadow: `0 0 8px ${sd.activeGlow}` }} />
                  )}
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} style={{ color: isActive ? sd.iconActive : sd.iconInactive }} />
                    {t(item.labelKey)}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: sd.activeAccent, boxShadow: `0 0 6px ${sd.activeGlow}` }} />
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-4">
        <div className="h-px mb-3" style={{ background: sd.divider }} />

        {/* Language toggle */}
        <div className="flex items-center justify-center gap-1 mb-2 p-0.5 rounded-lg"
          style={{ background: sd.langBg }}>
          {['en', 'ar'].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="flex-1 text-[10px] py-1 rounded-md transition-all font-medium"
              style={l === 'ar'
                ? (lang === 'ar' ? sd.langArabicActive : sd.langArabicInact)
                : (lang === l   ? sd.langActive        : sd.langInactive)}
            >
              {l === 'en' ? 'EN' : 'عربي'}
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="sidebar-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
          style={{ color: sd.logoutColor }}
          onMouseOver={e => { e.currentTarget.style.background = sd.logoutHoverBg; e.currentTarget.style.color = sd.logoutHoverColor }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = sd.logoutColor }}
        >
          <LogOut size={15} />
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  )
}
