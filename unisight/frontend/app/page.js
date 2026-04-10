'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/authStore';

const HeroScene = dynamic(() => import('@/components/shared/HeroScene'), { ssr: false });

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Risk Detection',
    desc: 'Gemini AI automatically flags at-risk students based on marks, attendance, and behavioral patterns — days before they fail.',
    color: '#6366f1',
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    desc: 'Department-wide dashboards with live charts, heatmaps, and semester trend lines. No spreadsheets needed.',
    color: '#10b981',
  },
  {
    icon: '📧',
    title: 'One-Click AI Alerts',
    desc: 'Faculty generates personalized, empathetic warning emails for students with a single click — written by Gemini.',
    color: '#f59e0b',
  },
  {
    icon: '🏛️',
    title: 'Department Drill-Down',
    desc: 'Admin sees per-subject pass rates, attendance heatmaps, and risk distribution for every department at one glance.',
    color: '#0ea5e9',
  },
  {
    icon: '🎯',
    title: 'Intervention Priority Score',
    desc: 'USP: AI ranks every at-risk student by urgency score (0–100) so faculty knows exactly who to contact first.',
    color: '#f43f5e',
  },
  {
    icon: '📤',
    title: 'Smart CSV Upload',
    desc: 'Upload marks CSV and watch AI agents process students in real-time via Socket.IO — insights generated in seconds.',
    color: '#a78bfa',
  },
];

const STATS = [
  { value: '60+', label: 'Students Enrolled', color: '#6366f1' },
  { value: '5', label: 'Subjects Tracked', color: '#10b981' },
  { value: '3', label: 'User Roles', color: '#f59e0b' },
  { value: 'Real-time', label: 'AI Processing', color: '#f43f5e' },
];

const PORTALS = [
  { label: 'Student', icon: '🎓', desc: 'View marks, attendance, AI advisor chat, and academic timeline.', color: '#6366f1', href: '/login' },
  { label: 'Faculty', icon: '👨‍🏫', desc: 'Upload CSVs, view class heatmaps, send AI alert emails.', color: '#10b981', href: '/login' },
  { label: 'Admin', icon: '🛡️', desc: 'University-wide analytics, NL queries, intervention scores.', color: '#f59e0b', href: '/login' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') router.replace('/student/dashboard');
    else if (user.role === 'faculty') router.replace('/faculty/dashboard');
    else router.replace('/admin/overview');
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: '#030308', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: scrollY > 60 ? 'rgba(3,3,8,0.8)' : 'transparent',
          backdropFilter: scrollY > 60 ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrollY > 60 ? 'blur(20px)' : 'none',
          borderBottom: scrollY > 60 ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          padding: '14px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em' }} className="gradient-text">SUTATE</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: '300', color: 'rgba(255,255,255,0.3)' }}> AI</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href="#features" style={{ padding: '7px 16px', color: '#64748b', fontSize: '13px', fontWeight: '600', textDecoration: 'none', borderRadius: '8px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>Features</a>
          <a href="#portals" style={{ padding: '7px 16px', color: '#64748b', fontSize: '13px', fontWeight: '600', textDecoration: 'none', borderRadius: '8px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>Portals</a>
          <Link href="/login" style={{ 
            padding: '9px 24px', 
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
            borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: '700', textDecoration: 'none', 
            transition: 'all 0.3s', 
            boxShadow: '0 0 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            Sign In →
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '80px 24px 60px' }}>
        {/* 3D Scene */}
        <HeroScene />
        
        {/* BG gradient orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '5%', left: '0%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)', filter: 'blur(80px)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '0%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 60%)', filter: 'blur(80px)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '40%', left: '40%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)', filter: 'blur(60px)', borderRadius: '50%' }} />
        </div>

        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          style={{ textAlign: 'center', maxWidth: '820px', position: 'relative', zIndex: 2 }}
        >
          {/* Badge */}
          <motion.div variants={itemVariants} style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 18px', 
            background: 'rgba(99,102,241,0.08)', 
            border: '1px solid rgba(99,102,241,0.2)', 
            borderRadius: '999px', marginBottom: '28px', fontSize: '12px', fontWeight: '700', color: '#818cf8', letterSpacing: '0.06em', textTransform: 'uppercase',
            backdropFilter: 'blur(12px)',
          }}>
            <motion.span 
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', display: 'inline-block', boxShadow: '0 0 8px #6366f1' }} 
            />
            AI-Powered University Analytics Platform
          </motion.div>

          {/* Title */}
          <motion.h1 variants={itemVariants} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1.08', margin: '0 0 24px', color: '#fff' }}>
            Smart University <br />
            <span className="gradient-text" style={{ fontSize: 'clamp(44px, 7vw, 80px)' }}>Data Automation</span>
          </motion.h1>

          <motion.p variants={itemVariants} style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#64748b', lineHeight: '1.75', maxWidth: '600px', margin: '0 auto 40px' }}>
            SUTATE AI uses Gemini AI to detect at-risk students, generate faculty alerts, and provide university-wide analytics — all from a unified platform.
          </motion.p>

          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ 
              padding: '14px 36px', 
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
              borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', textDecoration: 'none', 
              boxShadow: '0 8px 32px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)', 
              transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              Get Started — It's Free →
            </Link>
            <a href="#features" style={{ 
              padding: '14px 32px', 
              background: 'rgba(255,255,255,0.04)', 
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '14px', color: '#94a3b8', fontSize: '15px', fontWeight: '600', textDecoration: 'none', 
              transition: 'all 0.2s',
            }}>
              See Features ↓
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 48px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: '-50px' }}
          variants={containerVariants}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
        >
          {STATS.map(({ value, label, color }) => (
            <motion.div 
              key={label} 
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              style={{ 
                background: 'rgba(13,13,31,0.5)', 
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.07)', 
                borderTop: `2px solid ${color}`, 
                borderRadius: '16px', padding: '24px', textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '36px', fontWeight: '800', color, marginBottom: '6px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={containerVariants}>
          <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Features</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 16px', color: '#fff' }}>
              Everything you need to <span className="gradient-text">run a smarter university</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>Built for students, faculty, and admins — each with their own AI-powered workflow.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {FEATURES.map(({ icon, title, desc, color }, i) => (
              <motion.div 
                key={title}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ 
                  background: 'rgba(13,13,31,0.5)', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', 
                  borderRadius: '18px', padding: '28px', 
                  position: 'relative', overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, background: `radial-gradient(circle, ${color}15, transparent)`, pointerEvents: 'none' }} />
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${color}10`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>{icon}</div>
                <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: '#f1f5f9' }}>{title}</h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.65' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Portals */}
      <section id="portals" style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={containerVariants}>
          <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>User Portals</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#fff' }}>
              One platform, <span className="gradient-text-emerald">three powerful portals</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {PORTALS.map(({ label, icon, desc, color, href }) => (
              <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{ 
                    background: `rgba(13,13,31,0.5)`, 
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${color}20`, 
                    borderRadius: '20px', padding: '36px 28px', textAlign: 'center', 
                    cursor: 'pointer',
                    boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
                  <div style={{ fontSize: '52px', marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>{icon}</div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: '800', fontSize: '22px', color, marginBottom: '12px' }}>{label} Portal</h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.65', marginBottom: '24px' }}>{desc}</p>
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', 
                    background: `${color}12`, border: `1px solid ${color}30`, borderRadius: '12px', color, fontSize: '13px', fontWeight: '700',
                    boxShadow: `0 4px 16px ${color}15`,
                  }}>
                    Sign In as {label} →
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ 
            maxWidth: '620px', margin: '0 auto', 
            background: 'rgba(13,13,31,0.5)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.15)', borderRadius: '24px', padding: '60px 48px',
            boxShadow: '0 16px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚀</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '12px', color: '#fff' }}>
            Ready to get started?
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>
            Sign in with your credentials. Students, faculty, and admins each get their own AI-powered portal.
          </p>
          <Link href="/login" style={{ 
            padding: '14px 40px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '14px', 
            color: 'white', fontSize: '15px', fontWeight: '700', textDecoration: 'none', display: 'inline-block', 
            boxShadow: '0 8px 32px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)', 
            transition: 'all 0.3s',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            Sign In to SUTATE AI →
          </Link>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#334155' }}>
            Demo accounts available on the login page
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '32px 48px', 
        borderTop: '1px solid rgba(255,255,255,0.06)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        background: 'rgba(3,3,8,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em' }} className="gradient-text">SUTATE</span>
          <span style={{ fontSize: '16px', fontWeight: '300', color: 'rgba(255,255,255,0.3)' }}> AI</span>
        </div>
        <div style={{ fontSize: '12px', color: '#334155' }}>
          Smart University Data Automation Technology & Analytics Engine — AI-driven insights for every stakeholder
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/login" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </footer>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          nav { padding: 14px 20px !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
          section > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
          section > div > div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          section > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
