'use client';
import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md', color = '#6366f1' }) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 40,
    xl: 60,
  };

  const dimension = sizes[size] || sizes.md;

  return (
    <motion.div
      style={{
        width: dimension,
        height: dimension,
        border: `${dimension / 8}px solid rgba(255,255,255,0.1)`,
        borderTopColor: color,
        borderRadius: '50%',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

export function LoadingDots({ color = '#6366f1' }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ size = 60, color = '#6366f1' }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          opacity: 0.6,
        }}
        animate={{
          scale: [1, 1.5],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
        }}
        animate={{
          scale: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export function LoadingBar({ progress = 0, color = '#6366f1', height = 4 }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 999,
          position: 'relative',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '30%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
            borderRadius: 999,
          }}
          animate={{
            x: ['-100%', '300%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5,5,15,0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: 20,
      }}
    >
      <LoadingPulse size={80} />
      <motion.p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

export function LoadingCard({ height = 200 }) {
  return (
    <div
      className="chart-container"
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function LoadingTable({ rows = 5 }) {
  return (
    <div className="chart-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              height: 48,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
              backgroundSize: '200% 100%',
              borderRadius: 8,
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    </div>
  );
}
