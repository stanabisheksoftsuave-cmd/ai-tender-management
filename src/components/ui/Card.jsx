export default function Card({ children, className = '', hover = false, branded = false, glass = false, accent = false, style, ...props }) {
  const extraClasses = [
    hover ? 'card-hover cursor-pointer' : '',
    branded ? 'olng-card-branded' : '',
    glass ? 'olng-glass' : '',
    accent ? 'olng-section-card' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={`rounded-2xl ${extraClasses} ${className}`}
      style={{
        background: glass ? undefined : 'var(--color-surface)',
        border: glass ? undefined : '1px solid var(--color-border)',
        boxShadow: glass ? undefined : 'var(--color-shadow, 0 1px 4px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.1))',
        // Merged, not spread after — a caller-provided `style` (e.g. an
        // `animationDelay` for staggered entrances) must add to the card's
        // own background/border/shadow, not silently replace them. Passing
        // `style` through `...props` below did exactly that: two `style=`
        // attributes on the same element don't merge, the later one wins
        // outright, so every `<Card style={{...}}>` caller was rendering
        // with no background, default browser border and no shadow.
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between px-5 py-4"
      style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-xl" style={{ background: 'rgba(37,99,235,0.12)' }}>
            <Icon size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs mt-0.5 text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
