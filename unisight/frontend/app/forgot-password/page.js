'use client';
import { useState } from 'react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/password/forgot', { email });
      setSent(true);
    } catch {
      setError('Failed to send. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#030306', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/login" style={{ color: '#64748b', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, textDecoration: 'none' }}>
            ← Back to sign in
          </a>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📧</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: 'white' }}>Reset your password</h1>
        </div>

        <div style={{ background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '32px 28px' }}>
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>EMAIL</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your university email" required className="input-field"
                  style={{ marginBottom: 20 }}
                />
                {error && <p style={{ color: '#fb7185', fontSize: 12, marginBottom: 16 }}>{error}</p>}
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14,
                  border: 'none', cursor: loading ? 'default' : 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
                }}>
                  {loading ? <><span className="spinner" />Sending...</> : 'Send reset link'}
                </button>
              </motion.form>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '8px 0' }}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ margin: '0 auto 16px' }}>
                  <circle cx="28" cy="28" r="26" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="1.5" />
                  <motion.path
                    d="M18 28 L24 34 L38 20" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                  />
                </svg>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: 'white', marginBottom: 8 }}>Reset link sent</h3>
                <p style={{ color: '#64748b', fontSize: 13 }}>Check your inbox — link expires in 1 hour</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
