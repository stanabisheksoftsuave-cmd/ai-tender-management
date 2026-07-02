import { Bell, Palette, Search, ChevronDown } from 'lucide-react'
import { useTheme, themes } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const roleColors = {
  it_admin:    '#7C3AED',
  biz_admin:   '#0F766E',
  pof:         '#1B4F8A',
  tech_eval:   '#059669',
  comm_eval:   '#D97706',
  mgmt_review: '#0F766E',
}

export default function Header({ title, subtitle }) {
  const { theme, setTheme, isDark } = useTheme()
  const { lang, t } = useLanguage()
  const { user } = useAuth()
  const [showTheme, setShowTheme] = useState(false)
  const isRtl = lang === 'ar'

  const isOlng = theme === 'olng'

  const bg     = isDark ? 'rgba(10,15,30,0.92)' : '#ffffff'
  const border = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E8EDF5'
  const title_ = isDark ? '#F1F5F9' : '#0F172A'
  const sub_   = isDark ? '#64748B'  : '#64748B'
  const search = {
    bg:     isDark ? 'rgba(255,255,255,0.05)' : '#F4F6FA',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
    color:  isDark ? '#F1F5F9' : '#0F172A',
    ph:     isDark ? '#4B5563' : '#94A3B8',
  }
  const iconBg      = isDark ? 'rgba(255,255,255,0.05)' : '#F4F6FA'
  const iconBorder  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
  const iconColor   = isDark ? '#94A3B8' : '#64748B'
  const dropBg      = isDark ? '#111827' : '#ffffff'
  const dropBorder  = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'
  const dropShadow  = isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.10)'
  const dropLabel   = isDark ? '#475569' : '#94A3B8'
  const itemActive  = isDark ? { background: 'rgba(37,99,235,0.15)', color: '#F1F5F9' } : { background: '#EEF2FF', color: '#1D4ED8' }
  const itemInact   = isDark ? { background: 'transparent', color: '#94A3B8' } : { background: 'transparent', color: '#64748B' }
  const itemHover   = isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'

  const avatarBg = roleColors[user?.role?.id] || '#2563EB'
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50"
      style={{
        background: bg,
        backdropFilter: 'blur(16px)',
        borderBottom: border,
        boxShadow: isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
      }}>

      {/* Page title */}
      <div>
        <h1 className="font-bold text-[15px] leading-tight tracking-tight" style={{ color: title_ }}>{title}</h1>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: sub_ }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={13} className={`absolute ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`}
            style={{ color: sub_ }} />
          <input
            type="text"
            placeholder={t('common.searchTenders')}
            className={`${isRtl ? 'pr-8 pl-4' : 'pl-8 pr-4'} py-2 text-xs rounded-xl w-52 outline-none transition-all focus:w-64`}
            style={{ background: search.bg, border: search.border, color: search.color }}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: iconBg, border: iconBorder }}
          onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FF'}
          onMouseOut={e => e.currentTarget.style.background = iconBg}
        >
          <Bell size={15} style={{ color: iconColor }} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500"
            style={{ boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
        </button>

        {/* Theme switcher */}
        <div className="relative">
          <button
            onClick={() => setShowTheme(!showTheme)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-colors"
            style={{ background: iconBg, border: iconBorder, color: iconColor }}
            onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FF'}
            onMouseOut={e => e.currentTarget.style.background = iconBg}
          >
            <Palette size={13} style={{ color: iconColor }} />
            <span className="hidden sm:inline">{t('common.theme')}</span>
            <ChevronDown size={11} style={{ color: iconColor, transform: showTheme ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showTheme && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTheme(false)} />
              <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-11 w-56 rounded-2xl p-2 z-50 fade-in`}
                style={{ background: dropBg, border: dropBorder, boxShadow: dropShadow }}>
                <p className="text-[9px] uppercase tracking-[0.1em] font-bold px-2 py-1.5" style={{ color: dropLabel }}>
                  {t('audit.colourTheme')}
                </p>
                {themes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => { setTheme(th.id); setShowTheme(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors"
                    style={{ ...(theme === th.id ? itemActive : itemInact), fontWeight: theme === th.id ? 600 : 400 }}
                    onMouseOver={e => { if (theme !== th.id) e.currentTarget.style.background = itemHover }}
                    onMouseOut={e => { if (theme !== th.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="flex gap-1 shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: th.primary }} />
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: th.accent  }} />
                    </div>
                    <span className="flex-1">{th.label}</span>
                    {theme === th.id && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-primary)' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}cc)`,
            boxShadow: `0 2px 8px ${avatarBg}40`,
          }}
          title={user?.name}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
