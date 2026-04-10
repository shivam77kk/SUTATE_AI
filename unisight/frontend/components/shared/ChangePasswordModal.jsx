'use client';
import { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose, onComplete }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ current: false, new: false });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast.success('Password updated successfully!');
      onComplete?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content animate-slideUp" style={{ maxWidth: '400px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Security Update</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>Please update your temporary password to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={show.current ? 'text' : 'password'} className="input-field" required
                value={form.currentPassword} onChange={e => setForm(p => ({...p, currentPassword: e.target.value}))}
              />
              <button type="button" onClick={() => setShow(p => ({...p, current: !p.current}))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>New Password (Min 8 chars)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={show.new ? 'text' : 'password'} className="input-field" required
                value={form.newPassword} onChange={e => setForm(p => ({...p, newPassword: e.target.value}))}
              />
              <button type="button" onClick={() => setShow(p => ({...p, new: !p.new}))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
            <input 
              type="password" className="input-field" required
              value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))}
            />
          </div>

          <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', display: 'flex', gap: '8px', border: '1px solid #dbeafe' }}>
            <AlertCircle size={14} style={{ color: '#1d4ed8', marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '10px', color: '#1e40af', margin: 0 }}>This is a one-time setup. Subsequent logins will use your new password.</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px', width: '100%', marginTop: '8px' }}>
            {loading ? 'Updating…' : '✅ Update Password & Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
