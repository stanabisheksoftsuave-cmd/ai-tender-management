import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, DEMO_USERS, roles } from '../context/AuthContext'
import { useTheme, themes } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

// ── Icons ─────────────────────────────────────────────────────────────────────
const MailSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)
const LockSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const ArrowRightSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-7-7 7 7-7 7"/>
  </svg>
)
const EyeSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
)
const ChevronSvg = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const SparkleSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
)
const InfoSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
  </svg>
)

// ── Animated dot particle (pure CSS) ─────────────────────────────────────────
const DOTS = [
  { top: '12%', left: '18%', size: 3, opacity: 0.4 },
  { top: '28%', left: '72%', size: 2, opacity: 0.25 },
  { top: '55%', left: '35%', size: 4, opacity: 0.2 },
  { top: '70%', left: '80%', size: 2, opacity: 0.35 },
  { top: '85%', left: '55%', size: 3, opacity: 0.3 },
  { top: '40%', left: '10%', size: 2, opacity: 0.2 },
  { top: '18%', left: '90%', size: 3, opacity: 0.3 },
]

export default function Login() {
  const { login, setFirstPassword } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const navigate = useNavigate()
  const [username, setUsername]           = useState('')
  const [password, setPassword]           = useState('')
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd]             = useState(false)
  const [needsSetPassword, setNeedsSetPassword] = useState(false)
  const [error, setError]                 = useState('')
  const [showAccounts, setShowAccounts]   = useState(false)
  const [showThemes, setShowThemes]       = useState(false)
  const isRtl = lang === 'ar'

  const handleLogin = () => {
    setError('')
    if (!username.trim()) { setError(t('login.error.emptyEmail')); return }
    const result = login(username.trim(), password)
    if (result === 'inactive')          { setError(t('login.error.inactive')); return }
    if (result === 'must_set_password') { setNeedsSetPassword(true); setPassword(''); setError(''); return }
    if (result === 'invalid')           { setError(t('login.error.invalid')); return }
    // '/' resolves to whichever landing page the signed-in role may open (the
    // Dashboard is not available to every role). replace, so Back from it never
    // lands on the login screen.
    navigate('/', { replace: true })
  }

  const handleSetPassword = () => {
    setError('')
    if (!newPassword)                     { setError(t('login.error.emptyNewPwd')); return }
    if (newPassword.length < 6)           { setError(t('login.error.pwdLength')); return }
    if (newPassword !== confirmPassword)  { setError(t('login.error.pwdMatch')); return }
    const result = setFirstPassword(username.trim(), newPassword)
    if (result === 'not_found')  { setError(t('login.error.notFound')); return }
    if (result === 'inactive')   { setError(t('login.error.inactive')); return }
    navigate('/', { replace: true })
  }

  const fillCredentials = (u) => {
    setUsername(u.username)
    setPassword(u.password)
    setNeedsSetPassword(false)
    setError('')
    setShowAccounts(false)
  }

  // ── Input style helpers ────────────────────────────────────────────────────
  const inputCls = (disabled = false) => isDark
    ? `w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors ${disabled ? 'bg-slate-800/40 border-slate-700/50 cursor-default text-slate-500' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'}`
    : `w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${disabled ? 'bg-slate-100 border-slate-200 cursor-default text-slate-400' : 'bg-white border-slate-200 hover:border-slate-300'}`

  return (
    <div className="min-h-screen flex" style={{ background: isDark ? '#0A0F1E' : theme === 'olng' ? '#ecf4fc' : '#F1F5FF', direction: isRtl ? 'rtl' : 'ltr' }}
      onClick={() => showThemes && setShowThemes(false)}>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center p-12 relative overflow-hidden"
        style={{ background: theme === 'olng'
          ? 'linear-gradient(145deg, #1b4c6f 0%, #0d3352 50%, #0089cf 100%)'
          : 'linear-gradient(135deg, #0A0F1E 0%, #0D1530 60%, #0A1628 100%)' }}>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: theme === 'olng'
            ? 'linear-gradient(rgba(175,217,244,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(175,217,244,0.06) 1px, transparent 1px)'
            : 'linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Floating dots */}
        {DOTS.map((d, i) => (
          <div key={i} className="absolute rounded-full" style={{
            top: d.top, left: d.left,
            width: d.size * 4, height: d.size * 4,
            background: theme === 'olng'
              ? `rgba(175,217,244,${d.opacity})`
              : `rgba(245,158,11,${d.opacity})`,
            boxShadow: theme === 'olng'
              ? `0 0 ${d.size * 6}px rgba(175,217,244,${d.opacity * 0.5})`
              : `0 0 ${d.size * 6}px rgba(245,158,11,${d.opacity * 0.6})`,
          }} />
        ))}

        {/* Watermark — OLNG flame shape / star */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ opacity: theme === 'olng' ? 0.08 : 0.06 }}>
          {theme === 'olng' ? (
            <svg width="340" height="340" viewBox="0 0 100 100" fill="currentColor" style={{ color: '#afd9f4' }}>
              {/* Flame shape — simplified OLNG blue flame element */}
              <path d="M50 10 C50 10 30 30 30 55 C30 70 38 80 50 85 C62 80 70 70 70 55 C70 30 50 10 50 10Z" opacity="0.6"/>
              <path d="M50 30 C50 30 40 45 40 58 C40 66 44 72 50 75 C56 72 60 66 60 58 C60 45 50 30 50 30Z" opacity="0.9"/>
              <circle cx="50" cy="20" r="6" opacity="0.4"/>
            </svg>
          ) : (
            <svg width="360" height="360" viewBox="0 0 100 100" fill="currentColor" style={{ color: '#F59E0B' }}>
              <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
            </svg>
          )}
        </div>

        {/* Glow blobs */}
        <div className="absolute top-16 -left-16 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: theme === 'olng'
            ? 'radial-gradient(circle, rgba(0,137,207,0.20) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: theme === 'olng'
            ? 'radial-gradient(circle, rgba(175,217,244,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />

        {/* ── Top: Logo ── */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/olng-logo-white.svg"
              alt="Oman LNG"
              className="h-24 w-auto object-contain"
            />
          </div>

          {/* Label */}
          <p className="text-[10px] font-bold tracking-[0.25em] mb-5"
            style={{ color: theme === 'olng' ? '#afd9f4' : '#F59E0B' }}>
            {t('login.procurementDir')}
          </p>

          {/* Hero heading */}
          <h2 className="text-4xl font-extrabold leading-tight mb-6">
            <span className="text-white block">{t('login.heroLine1')}</span>
            <span className="text-white block">{t('login.heroLine2')}</span>
            <span className="block" style={{ color: theme === 'olng' ? '#afd9f4' : '#2563EB' }}>{t('login.heroLine3')}</span>
            <span className="block" style={{ color: theme === 'olng' ? 'rgba(204,230,248,0.75)' : '#94A3B8' }}>{t('login.heroLine4')}</span>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            {t('login.heroParagraph')}
          </p>
        </div>

      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative"
        style={{ background: isDark ? '#0D1225' : theme === 'olng' ? '#ecf4fc' : '#F1F5FF' }}>

        {/* Top-right controls */}
        <div className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} flex items-center gap-2`}>

          {/* Theme button + dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowThemes(v => !v)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1'}`,
                color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
              }}>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: themes.find(t => t.id === theme)?.primary }} />
              {themes.find(t => t.id === theme)?.label.split(' ')[0]}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transform: showThemes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {showThemes && (
              <div className="absolute top-full mt-1.5 rounded-xl overflow-hidden z-50 w-44 py-1"
                style={{
                  background: isDark ? '#1E2540' : '#FFFFFF',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  [isRtl ? 'right' : 'left']: 0,
                }}>
                {themes.map(th => (
                  <button key={th.id} onClick={() => { setTheme(th.id); setShowThemes(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors"
                    style={{
                      background: theme === th.id
                        ? isDark ? 'rgba(255,255,255,0.08)' : '#F1F5FF'
                        : 'transparent',
                      color: isDark ? (theme === th.id ? '#fff' : 'rgba(255,255,255,0.6)') : (theme === th.id ? '#0F172A' : '#64748B'),
                    }}>
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ background: th.primary }} />
                    <span className="flex-1 font-medium truncate">{th.label}</span>
                    {theme === th.id && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 rounded-lg p-0.5"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1'}`,
            }}>
            {['en', 'ar'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                className="text-[10px] px-2.5 py-1 rounded-md transition-all font-semibold"
                style={lang === l
                  ? { background: theme === 'olng' ? '#0089cf' : '#2563EB', color: '#fff' }
                  : { color: isDark ? 'rgba(255,255,255,0.4)' : '#64748B' }}>
                {l === 'en' ? 'EN' : 'عربي'}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-md rounded-2xl p-8"
          style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            backdropFilter: 'blur(12px)',
            boxShadow: isDark ? 'none' : '0 4px 24px rgba(0,0,0,0.08)',
          }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img src="/olng-logo.png" alt="Oman LNG" className="h-9 w-9 object-contain rounded-lg" />
            <div className="font-bold text-sm" style={{ color: isDark ? '#fff' : '#0F172A' }}>
              Oman LNG
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold mb-1" style={{ color: isDark ? '#fff' : '#0F172A' }}>{t('login.welcome')}</h1>
            <p className="text-xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>{t('login.subtitle')}</p>
          </div>

          {/* First-login banner */}
          {needsSetPassword && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4"
              style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <InfoSvg />
              <p className="text-[11px] text-blue-300 leading-relaxed">
                {t('login.firstLoginBanner')}
              </p>
            </div>
          )}

          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                {t('login.email')}
              </label>
              <div className="relative">
                <span className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} style={{ color: isDark ? '#64748B' : '#94A3B8' }}><MailSvg /></span>
                <input type="email" value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  onKeyDown={e => !needsSetPassword && e.key === 'Enter' && handleLogin()}
                  placeholder={t('login.placeholder.email')}
                  readOnly={needsSetPassword}
                  className={inputCls(needsSetPassword).replace('pl-9', isRtl ? 'pr-9 pl-3' : 'pl-9')}
                />
              </div>
            </div>

            {/* Normal password */}
            {!needsSetPassword && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                  {t('login.password')}
                </label>
                <div className="relative">
                  <span className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} style={{ color: isDark ? '#64748B' : '#94A3B8' }}><LockSvg /></span>
                  <input type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className={`${inputCls().replace('pl-9', isRtl ? 'pr-9 pl-3' : 'pl-9')} ${isRtl ? 'pl-9' : 'pr-9'}`}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 transition-colors`}
                    style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                    {showPwd ? <EyeOffSvg /> : <EyeSvg />}
                  </button>
                </div>
              </div>
            )}

            {/* Set-password fields */}
            {needsSetPassword && (
              <>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    {t('login.newPassword')}
                  </label>
                  <div className="relative">
                    <span className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} style={{ color: isDark ? '#64748B' : '#94A3B8' }}><LockSvg /></span>
                    <input type={showPwd ? 'text' : 'password'} value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError('') }}
                      placeholder={t('login.placeholder.password')}
                      className={`${inputCls().replace('pl-9', isRtl ? 'pr-9 pl-3' : 'pl-9')} ${isRtl ? 'pl-9' : 'pr-9'}`}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 transition-colors`}
                      style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                      {showPwd ? <EyeOffSvg /> : <EyeSvg />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    {t('login.confirmPassword')}
                  </label>
                  <div className="relative">
                    <span className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} style={{ color: isDark ? '#64748B' : '#94A3B8' }}><LockSvg /></span>
                    <input type={showPwd ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                      placeholder={t('login.placeholder.confirm')}
                      className={inputCls().replace('pl-9', isRtl ? 'pr-9 pl-3' : 'pl-9')}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: isDark ? '#FCA5A5' : '#DC2626' }}>
                <InfoSvg />
                {error}
              </div>
            )}

            {/* Remember me + Forgot password */}
            {!needsSetPassword && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                  <input type="checkbox" className="rounded accent-blue-600" />
                  {t('login.rememberMe')}
                </label>
                <button className="text-xs transition-colors" style={{ color: '#2563EB' }}
                  onMouseOver={e => e.target.style.color='#1D4ED8'}
                  onMouseOut={e => e.target.style.color='#2563EB'}>
                  {t('login.forgotPassword')}
                </button>
              </div>
            )}

            {/* CTA button */}
            {(() => {
              const btnGrad = theme === 'olng'
                ? 'linear-gradient(135deg, #0089cf, #1b4c6f)'
                : 'linear-gradient(135deg, #2563EB, #1D4ED8)'
              const btnShadow = theme === 'olng'
                ? '0 4px 24px rgba(0,137,207,0.35)'
                : '0 4px 24px rgba(37,99,235,0.35)'
              return needsSetPassword ? (
                <div className="space-y-2 pt-1">
                  <button onClick={handleSetPassword}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: btnGrad, boxShadow: btnShadow }}>
                    {t('login.setPasswordSignIn')} <ArrowRightSvg />
                  </button>
                  <button onClick={() => { setNeedsSetPassword(false); setNewPassword(''); setConfirmPassword(''); setError('') }}
                    className="w-full py-2 text-xs transition-colors" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                    {t('login.backToSignIn')}
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90 active:scale-[0.98] mt-1"
                  style={{ background: btnGrad, boxShadow: btnShadow }}>
                  {t('login.signInSecurely')} <ArrowRightSvg />
                </button>
              )
            })()}
          </div>

          {/* Demo accounts */}
          <div className="mt-5 rounded-xl overflow-hidden"
            style={{
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
              background: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
            }}>
            <button onClick={() => setShowAccounts(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors"
              style={{ color: '#818CF8' }}
              onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <span className="flex items-center gap-1.5 font-medium">
                <SparkleSvg />
                {t('login.demo')}
              </span>
              <span style={{ color: isDark ? '#64748B' : '#94A3B8' }}><ChevronSvg open={showAccounts} /></span>
            </button>

            {showAccounts && (
              <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}` }}>
                {DEMO_USERS.filter(u => u.password).map(u => {
                  const role = roles.find(r => r.id === u.roleId)
                  return (
                    <button key={u.id} onClick={() => fillCredentials(u)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                      onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: role?.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate" style={{ color: isDark ? '#CBD5E1' : '#0F172A' }}>{u.name}</div>
                        <div className="text-[11px] truncate" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>{u.username}</div>
                      </div>
                      <span className="text-[10px] shrink-0 rounded px-1.5 py-0.5"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                          color: isDark ? '#94A3B8' : '#64748B',
                        }}>
                        {role?.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
