'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/\d/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const SEG_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#8b5cf6'];

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);
  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('At least 8 characters required.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post(`/password/reset/${token}`, { newPassword, confirmPassword });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 400) setExpired(true);
      else setError('Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: 8 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'white', fontSize: 20, marginBottom: 8 }}>Password updated!</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Your SUTATE password has been reset successfully.</p>
      <a href="/login" style={{
        display: 'inline-block', padding: '10px 24px', borderRadius: 10, fontWeight: 700,
        fontSize: 14, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', textDecoration: 'none',
      }}>Sign in →</a>
    </div>
  );

  if (expired) return (
    <div style={{ textAlign: 'center', padding: 8 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
      <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: '#fb7185', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>This link has expired.</h3>
        <p style={{ color: '#64748b', fontSize: 13 }}>Reset links expire after 1 hour.</p>
      </div>
      <a href="/forgot-password" style={{ color: '#818cf8', fontSize: 13 }}>Request a new one →</a>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>NEW PASSWORD</label>
        <div style={{ position: 'relative' }}>
          <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="New password" required className="input-field" style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowNew(!showNew)} style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{showNew ? '🙈' : '👁️'}</button>
        </div>
        {newPassword.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < strength ? SEG_COLORS[strength-1] : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>CONFIRM PASSWORD</label>
        <div style={{ position: 'relative' }}>
          <input type={showConf ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password" required className="input-field" style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowConf(!showConf)} style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{showConf ? '🙈' : '👁️'}</button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <p style={{ color: '#fb7185', fontSize: 11, marginTop: 6 }}>Passwords do not match.</p>
        )}
      </div>
      {error && <p style={{ color: '#fb7185', fontSize: 12, marginBottom: 16 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{
        width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'default' : 'pointer',
        background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
      }}>
        {loading ? <><span className="spinner" />Resetting...</> : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#030306', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <img src="/logo.png" alt="SUTATE AI" style={{ width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.45))' }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>SUTATE AI</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'white', marginBottom: 6 }}>Reset your password</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>Create a new secure password below</p>
        </div>
        <div style={{ background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '32px 28px' }}>
          <Suspense fallback={<div className="skeleton" style={{ height: 200, borderRadius: 12 }} />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
