'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

const ThreeBackground = dynamic(() => import('@/components/shared/ThreeBackground'), { ssr: false });

const ROLES = [
  { value: 'student', label: 'Student', color: '#6366f1', icon: '🎓', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { value: 'faculty', label: 'Faculty', color: '#10b981', icon: '👨‍🏫', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { value: 'admin',   label: 'Admin',   color: '#f59e0b', icon: '🛡️', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeRole = ROLES.find(r => r.value === role);
  const accent = activeRole?.color || '#6366f1';
  const gradient = activeRole?.gradient || ROLES[0].gradient;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const user = data.user;
      setUser(user);
      setSuccess(true);
      // Redirect immediately — don't wait, use window.location for reliability
      const dest = user.isFirstLogin
        ? '/change-password'
        : user.role === 'admin'
        ? '/admin/overview'
        : user.role === 'faculty'
        ? '/faculty/dashboard'
        : '/student/dashboard';
      setTimeout(() => {
        router.replace(dest);
        // Fallback: if router.replace doesn't navigate in 1.5s, force it
        setTimeout(() => { window.location.href = dest; }, 1500);
      }, 300);
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 403
        ? 'Your account has been deactivated. Contact admin.'
        : 'Invalid email or password.';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #030308 0%, #05050f 40%, #0a0a1a 100%)',
    }}>
      {/* Animated gradient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ 
            position: 'absolute', width: 600, height: 600, borderRadius: '50%', opacity: 0.15,
            background: `radial-gradient(circle, ${accent}66 0%, transparent 70%)`,
            top: '-10%', left: '-10%', filter: 'blur(80px)',
            transition: 'background 0.5s',
          }} 
        />
        <motion.div 
          animate={{ x: [0, -80, 0], y: [0, 80, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ 
            position: 'absolute', width: 500, height: 500, borderRadius: '50%', opacity: 0.12,
            background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
            bottom: '-5%', right: '-5%', filter: 'blur(80px)',
          }} 
        />
      </div>
      
      <ThreeBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={shake ? { x: [-8, 8, -6, 6, 0], opacity: 1, y: 0 } : { x: 0, opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10 }}
      >
        {/* Logo Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, width: '100%' }}>
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              style={{ height: 80, flexShrink: 0, position: 'relative' }}
            >
              <img src="/logo.png" alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
            </motion.div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Smart University Analytics Platform</p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
            {ROLES.map((r, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ 
                  width: 6, height: 6, borderRadius: '50%', background: r.color, 
                  boxShadow: `0 0 10px ${r.color}`, opacity: role === r.value ? 1 : 0.4,
                  transition: 'opacity 0.3s',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Login Card — Glass Morphism */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            borderRadius: 24, padding: '36px 32px',
            background: 'rgba(13,13,31,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 96px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Top shine */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
            borderRadius: '24px 24px 0 0', pointerEvents: 'none',
          }} />

          {/* Role Tabs */}
          <div style={{ 
            display: 'flex', gap: 6, padding: 6, marginBottom: 28, borderRadius: 14,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}>
            {ROLES.map(r => (
              <motion.button
                key={r.value}
                onClick={() => setRole(r.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'color 0.3s', border: 'none',
                  color: role === r.value ? 'white' : '#64748b',
                  background: role === r.value ? gradient : 'transparent',
                  boxShadow: role === r.value ? `0 4px 16px ${accent}40, inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
                  minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <span>{r.icon}</span>
                {r.label}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@university.edu" required
                className="input-field"
                style={{ 
                  borderColor: error ? 'rgba(244,63,94,0.4)' : undefined,
                  paddingLeft: 16, paddingRight: 16, height: 48,
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: 8, position: 'relative' }}>
              <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password" required
                  className="input-field"
                  style={{ 
                    borderColor: error ? 'rgba(244,63,94,0.4)' : undefined,
                    paddingLeft: 16, paddingRight: 48, height: 48,
                  }}
                />
                <motion.button 
                  type="button" onClick={() => setShowPw(!showPw)} 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ 
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b',
                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10,
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.color = accent}
                  onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                >
                  {showPw ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                </motion.button>
              </div>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ fontSize: 12, marginTop: 8, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ⚠ {error}
                </motion.p>
              )}
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <a href="/forgot-password" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={e => e.target.style.color = '#818cf8'}
                onMouseOut={e => e.target.style.color = '#64748b'}
              >Forgot password?</a>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit" disabled={loading || success}
              whileHover={{ scale: loading || success ? 1 : 1.02, y: loading || success ? 0 : -2 }}
              whileTap={{ scale: loading || success ? 1 : 0.98 }}
              style={{
                width: '100%', height: 52, borderRadius: 14, fontWeight: 700, fontSize: 14,
                cursor: loading || success ? 'default' : 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: success ? 'linear-gradient(135deg, #10b981, #059669)' : gradient,
                color: 'white',
                boxShadow: success ? '0 8px 32px rgba(16,185,129,0.4)' : `0 8px 32px ${accent}44`,
                transition: 'background 0.5s, box-shadow 0.5s',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Button shine */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                borderRadius: '14px 14px 0 0', pointerEvents: 'none',
              }} />
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : success ? (
                '✓ Welcome back!'
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>
        </motion.div>
        
        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', marginTop: 20, fontSize: 12, fontWeight: 500, color: '#334155' }}
        >
          SUTATE AI · Powered by Google Gemini 🤖
        </motion.p>

        {/* Demo Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ 
            marginTop: 20, padding: 16, borderRadius: 16, textAlign: 'center',
            background: 'rgba(13,13,31,0.4)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p style={{ fontSize: 11, marginBottom: 8, color: '#64748b', fontWeight: 600 }}>Demo Accounts (after running seed)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, fontSize: 11 }}>
            {[
              { label: '🛡️ Admin', email: 'shivam77@gmail.com', pw: '9082249120', role: 'admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
              { label: '👨‍🏫 Faculty', email: 'prof.sharma@faculty.edu', pw: 'faculty123', role: 'faculty', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
              { label: '🎓 Student', email: 'riya.shah@student.edu', pw: 'student123', role: 'student', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
            ].map(d => (
              <span
                key={d.email}
                onClick={() => { setEmail(d.email); setPassword(d.pw); setRole(d.role); setError(''); }}
                title={`Click to fill: ${d.email} / ${d.pw}`}
                style={{
                  padding: '6px 12px', borderRadius: 8, background: d.bg, color: d.color, fontWeight: 600,
                  border: `1px solid ${d.color}30`,
                  cursor: 'pointer', transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >{d.label}</span>
            ))}
          </div>
          <p style={{ fontSize: 11, marginTop: 8, color: '#475569' }}>Click a role to auto-fill · Admin: 9082249120 · Faculty/Student: 123 suffix</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
