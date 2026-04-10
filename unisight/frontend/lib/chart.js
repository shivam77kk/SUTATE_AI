'use client';
// Recharts theme wrapper and utilities for SUTATE

export const CHART_COLORS = {
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  sky:     '#0ea5e9',
};

export const CHART_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e',
  '#34d399', '#fbbf24', '#a78bfa', '#38bdf8',
];

export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(13,13,31,0.9)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#f1f5f9',
  fontSize: '12px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
};

export const AXIS_STYLE = {
  tick: { fill: '#64748b', fontSize: 11 },
  axisLine: { stroke: 'rgba(255,255,255,0.045)' },
  tickLine: false,
};

export function SafeTip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-4 py-3">
      <p style={{ color: '#94a3b8', fontSize: '10px', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, boxShadow: `0 0 6px ${entry.color}60` }} />
          <span style={{ color: '#94a3b8', fontSize: 11 }}>{entry.name}:</span>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Chart Wrapper (CW) - glass card container for Recharts
export function CW({ children, height = 280, title, action }) {
  return (
    <div className="chart-container">
      {title && (
        <div className="chart-title" style={{ justifyContent: 'space-between', position: 'relative' }}>
          <span>{title}</span>
          {action}
        </div>
      )}
      <div style={{ width: '100%', height, position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
