// Framer Motion variant presets for SUTATE

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

export const slideLeft = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

export const staggerFast = {
  visible: { transition: { staggerChildren: 0.04 } },
};

export const heightReveal = {
  hidden: { height: 0, opacity: 0, overflow: 'hidden' },
  visible: { height: 'auto', opacity: 1, overflow: 'hidden', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const springConfig = { type: 'spring', stiffness: 300, damping: 28 };
