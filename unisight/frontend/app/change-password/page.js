'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/\d/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const SEG_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#8b5cf6'];

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(newPassword);

  const validate = () => {
    if (newPassword.length < 8) return 'At least 8 characters required.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/password/change-first', { newPassword, confirmPassword });
      if (user) setUser({ ...user, isFirstLogin: false });
      const dest = user?.role === 'admin' ? '/admin/overview'
        : user?.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
      router.replace(dest);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#030306', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: 'white' }}>Set your password</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Choose a strong password to secure your SUTATE account.</p>
        </div>
        <div style={{ background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '32px 28px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>NEW PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password" required className="input-field" style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, minHeight: 44, minWidth: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{showNew ? '🙈' : '👁️'}</button>
              </div>

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 999,
                      background: i < strength ? SEG_COLORS[strength - 1] : 'rgba(255,255,255,0.06)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
              )}
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p style={{ color: '#fb7185', fontSize: 11, marginTop: 6 }}>At least 8 characters</p>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input type={showConf ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password" required className="input-field" style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowConf(!showConf)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, minHeight: 44, minWidth: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{showConf ? '🙈' : '👁️'}</button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#fb7185', fontSize: 11, marginTop: 6 }}>Passwords do not match.</p>
              )}
            </div>

            {error && <p style={{ color: '#fb7185', fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14,
              border: 'none', cursor: loading ? 'default' : 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
            }}>
              {loading ? <><span className="spinner" />Setting password...</> : 'Set password and continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
