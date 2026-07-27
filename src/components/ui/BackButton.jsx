import { ArrowLeft } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useNavigation } from '../../context/NavigationContext'

/*
 * The one back control. Reads its target from NavigationContext so every page
 * gets the same behaviour: history back when there is history, logical parent
 * route otherwise.
 */
export default function BackButton({ label, showLabel = true, className = '' }) {
  const { isDark } = useTheme()
  const { lang, t } = useLanguage()
  const { goBack, canGoBack } = useNavigation()
  const isRtl = lang === 'ar'

  if (!canGoBack) return null

  const bg     = isDark ? 'rgba(255,255,255,0.05)' : '#F4F6FA'
  const border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
  const color  = isDark ? '#94A3B8' : '#64748B'

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label || t('common.back')}
      title={label || t('common.back')}
      className={`flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${className}`}
      style={{ background: bg, border, color }}
      onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FF'}
      onMouseOut={e => e.currentTarget.style.background = bg}
    >
      <ArrowLeft size={14} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
      {showLabel && <span className="hidden sm:inline">{label || t('common.back')}</span>}
    </button>
  )
}
