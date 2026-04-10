'use client';
import { motion } from 'framer-motion';

export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <motion.div 
      className="page-header"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {breadcrumb && (
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'monospace' }}>
          {breadcrumb.map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span style={{ color: '#334155' }}>/</span>}
              <span style={{ color: i === breadcrumb.length - 1 ? '#94a3b8' : '#64748b' }}>{item}</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ 
            background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {action && <motion.div whileHover={{ scale: 1.02 }} style={{ flexShrink: 0 }}>{action}</motion.div>}
      </div>
    </motion.div>
  );
}

export default PageHeader;
