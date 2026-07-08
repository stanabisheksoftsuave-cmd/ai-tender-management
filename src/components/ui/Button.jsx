const variants = {
  primary:   'text-white active:scale-[0.97]',
  secondary: 'text-[var(--color-primary)] active:scale-[0.97]',
  ghost:     'text-slate-300 hover:text-white active:scale-[0.97]',
  danger:    'bg-red-500/90 hover:bg-red-500 text-white shadow-sm active:scale-[0.97]',
  accent:    'text-white active:scale-[0.97]',
  ai:        'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-sm active:scale-[0.97]',
  brand:     'olng-btn-generate text-white active:scale-[0.97]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-sm gap-2',
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', disabled, style = {}, ...props }) {
  const isPrimary = variant === 'primary'
  const isAccent  = variant === 'accent'
  const isSecondary = variant === 'secondary'
  const isGhost   = variant === 'ghost'

  const inlineStyle = {
    ...(isPrimary  ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' } : {}),
    ...(isAccent   ? { background: 'var(--color-accent)' } : {}),
    ...(isSecondary? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' } : {}),
    ...(isGhost    ? { background: 'transparent' } : {}),
    ...style,
  }

  const hoverClass = isPrimary
    ? 'hover:opacity-90'
    : isSecondary
      ? 'hover:bg-white/10'
      : isGhost
        ? 'hover:bg-white/8'
        : ''

  return (
    <button
      className={`inline-flex items-center font-medium rounded-xl transition-all duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${hoverClass} ${className}`}
      disabled={disabled}
      style={inlineStyle}
      {...props}
    >
      {children}
    </button>
  )
}
