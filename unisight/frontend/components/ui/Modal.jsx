'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, maxWidth = 520 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={{
              background: 'rgba(17,17,38,0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 24,
              padding: 32,
              maxWidth,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 32px 96px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative',
            }}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top glass shine */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
              borderRadius: '24px 24px 0 0',
              pointerEvents: 'none',
            }} />
            {title && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, position: 'relative' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>
                  {title}
                </h3>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    background: 'rgba(255,255,255,0.06)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 10, width: 34, height: 34, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#64748b', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <X size={16} />
                </motion.button>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
