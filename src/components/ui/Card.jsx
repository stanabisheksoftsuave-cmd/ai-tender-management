export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`rounded-2xl ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--color-shadow, 0 1px 4px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.1))',
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
