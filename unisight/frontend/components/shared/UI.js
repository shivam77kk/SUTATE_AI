'use client';

export function RiskBadge({ level, pulse = false }) {
  const styles = {
    HIGH: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#F87171' },
    MEDIUM: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#FBBF24' },
    LOW: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#34D399' },
  };
  const s = styles[level] || styles.LOW;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700,
      ...(pulse && level === 'HIGH' ? { animation: 'pulse-ring 2s infinite' } : {}),
    }}>
      {pulse && level === 'HIGH' && <span style={{ width: 6, height: 6, background: '#F87171', borderRadius: '50%', display: 'inline-block' }} />}
      {level}
    </span>
  );
}

export function KpiCard({ label, value, icon, accent, sub, trend }) {
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? '#34D399' : trend === 'down' ? '#F87171' : 'rgba(255,255,255,0.3)';
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{label}</div>
        <span style={{ fontSize: 18, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: accent || 'white', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginBottom: 8 }}>{value}</div>
      {(sub || trend) && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend && <span style={{ color: trendColor, fontWeight: 700 }}>{trendSymbol}</span>}
          {sub}
        </div>
      )}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 20, radius = 8, style = {} }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite', ...style }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={i === 0 ? 24 : 16} style={{ marginBottom: i < rows - 1 ? 12 : 0 }} />
      ))}
    </div>
  );
}
