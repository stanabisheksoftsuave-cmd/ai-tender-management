import { Bell, Palette, Search, ChevronDown } from 'lucide-react'
import { useTheme, themes } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useState } from 'react'

export default function Header({ title, subtitle }) {
  const { theme, setTheme, isDark } = useTheme()
  const { lang, t } = useLanguage()
  const [showTheme, setShowTheme] = useState(false)
  const isRtl = lang === 'ar'

  // Light header for all non-dark themes (bright, ocean, navy, sage)
  const h = isDark ? {
    bg:             'rgba(10,15,30,0.85)',
    border:         '1px solid rgba(255,255,255,0.07)',
    shadow:         'none',
    titleColor:     '#F1F5F9',
    subtitleColor:  '#475569',
    searchBg:       'rgba(255,255,255,0.05)',
    searchBorder:   '1px solid rgba(255,255,255,0.08)',
    searchColor:    '#F1F5F9',
    searchPlaceholder: '#475569',
    searchFocusBg:  'rgba(255,255,255,0.08)',
    searchFocusBorder: 'rgba(37,99,235,0.5)',
    iconBg:         'rgba(255,255,255,0.04)',
    iconHoverBg:    'rgba(255,255,255,0.08)',
    iconColor:      '#94A3B8',
    btnBg:          'rgba(255,255,255,0.04)',
    btnBorder:      '1px solid rgba(255,255,255,0.08)',
    btnColor:       '#94A3B8',
    btnHoverBg:     'rgba(255,255,255,0.08)',
    paletteColor:   '#64748B',
    dropdownBg:     '#111827',
    dropdownBorder: '1px solid rgba(255,255,255,0.1)',
    dropdownShadow: '0 8px 32px rgba(0,0,0,0.5)',
    dropdownLabel:  '#475569',
    itemActive:     { background: 'rgba(37,99,235,0.15)', color: '#F1F5F9' },
    itemInactive:   { background: 'transparent',           color: '#94A3B8' },
    itemHoverBg:    'rgba(255,255,255,0.05)',
  } : {
    bg:             'rgba(255,255,255,0.92)',
    border:         '1px solid #E2E8F0',
    shadow:         '0 1px 8px rgba(0,0,0,0.06)',
    titleColor:     '#0F172A',
    subtitleColor:  '#64748B',
    searchBg:       '#F8FAFC',
    searchBorder:   '1px solid #E2E8F0',
    searchColor:    '#0F172A',
    searchPlaceholder: '#94A3B8',
    searchFocusBg:  '#FFFFFF',
    searchFocusBorder: '#2563EB',
    iconBg:         '#F8FAFC',
    iconHoverBg:    '#EEF2FF',
    iconColor:      '#64748B',
    btnBg:          '#F8FAFC',
    btnBorder:      '1px solid #E2E8F0',
    btnColor:       '#64748B',
    btnHoverBg:     '#EEF2FF',
    paletteColor:   '#94A3B8',
    dropdownBg:     '#FFFFFF',
    dropdownBorder: '1px solid #E2E8F0',
    dropdownShadow: '0 8px 24px rgba(0,0,0,0.10)',
    dropdownLabel:  '#94A3B8',
    itemActive:     { background: '#EEF2FF', color: '#1D4ED8' },
    itemInactive:   { background: 'transparent', color: '#64748B' },
    itemHoverBg:    '#F8FAFC',
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{
        background: h.bg,
        backdropFilter: 'blur(16px)',
        borderBottom: h.border,
        boxShadow: h.shadow,
      }}>

      {/* Title */}
      <div>
        <h1 className="font-bold text-[15px] leading-tight tracking-tight" style={{ color: h.titleColor }}>{title}</h1>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: h.subtitleColor }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={13} className={`absolute ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`}
            style={{ color: h.subtitleColor }} />
          <input
            type="text"
            placeholder={t('common.searchTenders')}
            className={`${isRtl ? 'pr-8 pl-4' : 'pl-8 pr-4'} py-2 text-xs rounded-xl w-48 outline-none transition-all`}
            style={{
              background: h.searchBg,
              border: h.searchBorder,
              color: h.searchColor,
            }}
            onFocus={e => {
              e.target.style.background = h.searchFocusBg
              e.target.style.borderColor = h.searchFocusBorder
            }}
            onBlur={e => {
              e.target.style.background = h.searchBg
              e.target.style.border = h.searchBorder
            }}
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: h.iconBg, border: h.btnBorder }}
          onMouseOver={e => e.currentTarget.style.background = h.iconHoverBg}
          onMouseOut={e => e.currentTarget.style.background = h.iconBg}>
          <Bell size={15} style={{ color: h.iconColor }} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500"
            style={{ boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
        </button>

        {/* Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowTheme(!showTheme)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: h.btnBg,
              border: h.btnBorder,
              color: h.btnColor,
            }}
            onMouseOver={e => e.currentTarget.style.background = h.btnHoverBg}
            onMouseOut={e => e.currentTarget.style.background = h.btnBg}>
            <Palette size={13} style={{ color: h.paletteColor }} />
            {t('common.theme')}
            <ChevronDown size={11} style={{
              color: h.paletteColor,
              transform: showTheme ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
          </button>

          {showTheme && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTheme(false)} />
              <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-11 w-56 rounded-2xl p-2 z-50 fade-in`}
                style={{
                  background: h.dropdownBg,
                  border: h.dropdownBorder,
                  boxShadow: h.dropdownShadow,
                }}>
                <p className="text-[9px] uppercase tracking-[0.1em] font-bold px-2 py-1.5" style={{ color: h.dropdownLabel }}>
                  {t('audit.colourTheme')}
                </p>
                {themes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => { setTheme(th.id); setShowTheme(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors"
                    style={{
                      ...(theme === th.id ? h.itemActive : h.itemInactive),
                      fontWeight: theme === th.id ? 600 : 400,
                    }}
                    onMouseOver={e => { if (theme !== th.id) e.currentTarget.style.background = h.itemHoverBg }}
                    onMouseOut={e => { if (theme !== th.id) e.currentTarget.style.background = 'transparent' }}>
                    <div className="flex gap-1 shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: th.primary, border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` }} />
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: th.accent,  border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` }} />
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
      </div>
    </header>
  )
}
