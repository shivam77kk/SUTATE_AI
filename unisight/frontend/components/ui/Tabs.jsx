'use client';
import { motion } from 'framer-motion';

export function Tabs({ tabs, active, onChange, variant = 'pill', accent = '#6366f1' }) {
  if (variant === 'pill') {
    return (
      <div style={{ 
        display: 'flex', gap: 4, 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: 14, padding: 4, flexWrap: 'wrap',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
      }}>
        {tabs.map((tab) => {
          const label = typeof tab === 'string' ? tab : tab.label;
          const value = typeof tab === 'string' ? tab : tab.value;
          const count = tab.count;
          const isActive = active === value;
          return (
            <motion.button
              key={value}
              onClick={() => onChange(value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#818cf8' : '#64748b',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
                minHeight: 44,
                position: 'relative',
                boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.15)' : 'none',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill-bg"
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 10,
                    background: 'rgba(99,102,241,0.15)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
              {count !== undefined && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                  background: isActive ? '#6366f1' : 'rgba(255,255,255,0.06)',
                  color: isActive ? 'white' : '#64748b',
                  position: 'relative', zIndex: 1,
                }}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {tabs.map((tab) => {
        const label = typeof tab === 'string' ? tab : tab.label;
        const value = typeof tab === 'string' ? tab : tab.value;
        const isActive = active === value;
        return (
          <motion.button
            key={value}
            onClick={() => onChange(value)}
            whileHover={{ color: '#818cf8' }}
            style={{
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#818cf8' : '#64748b',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              marginBottom: -1,
              minHeight: 44,
              position: 'relative',
            }}
          >
            {label}
            {isActive && (
              <motion.div
                layoutId="active-line-indicator"
                style={{
                  position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                  background: accent,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export default Tabs;
