'use client';
import { motion } from 'framer-motion';

export function KPICard({ label, value, unit, color = 'indigo', trend, badge, subtitle, icon }) {
  const colors = {
    indigo:  { accent: '#6366f1', pale: 'rgba(99,102,241,0.12)', glow: 'rgba(99,102,241,0.2)', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    emerald: { accent: '#10b981', pale: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.2)', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    amber:   { accent: '#f59e0b', pale: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.2)', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    rose:    { accent: '#f43f5e', pale: 'rgba(244,63,94,0.12)',  glow: 'rgba(244,63,94,0.2)', gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)' },
    violet:  { accent: '#8b5cf6', pale: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.2)', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    sky:     { accent: '#0ea5e9', pale: 'rgba(14,165,233,0.12)', glow: 'rgba(14,165,233,0.2)', gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <motion.div
      className="kpi-card"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent gradient line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${c.accent}, transparent 70%)`,
        borderRadius: '14px 14px 0 0',
      }} />
      {/* Subtle accent glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 100, height: 100,
        background: `radial-gradient(circle, ${c.glow}, transparent 70%)`,
        pointerEvents: 'none', opacity: 0.5,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 14 }}>
          {label}
        </div>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: c.pale, border: `1px solid ${c.accent}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>{icon}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, position: 'relative' }}>
        <span className="stat-number" style={{ color: '#f1f5f9' }}>{value ?? '--'}</span>
        {unit && <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>{unit}</span>}
      </div>
      {badge && <div style={{ marginTop: 10 }}>{badge}</div>}
      {subtitle && <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{subtitle}</div>}
      {trend !== undefined && trend !== null && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ 
            marginTop: 8, fontSize: 11, 
            color: trend >= 0 ? '#10b981' : '#f43f5e', 
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: trend >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
            width: 'fit-content',
          }}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last analysis
        </motion.div>
      )}
    </motion.div>
  );
}

export default KPICard;
