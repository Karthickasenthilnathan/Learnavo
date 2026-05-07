const colorMap = {
  emerald: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
  blue:    { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
  amber:   { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  red:     { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
  purple:  { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)' },
};

export default function StatsCard({ icon, label, value, subtext, color = 'emerald', trend }) {
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div
      className="glass-card"
      style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {/* Icon + label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: c.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.2rem',
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: trend >= 0 ? 'var(--verified)' : 'var(--rejected)',
            background: trend >= 0 ? 'var(--verified-bg)' : 'var(--rejected-bg)',
            padding: '3px 8px', borderRadius: 'var(--radius-full)',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <div style={{
          fontSize: '1.75rem', fontWeight: 800,
          color: c.color, lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
          {label}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}