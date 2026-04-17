'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkel } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [form, setForm] = useState({ title: '', body: '', targetRoles: [], targetDepartments: [] });
  const qc = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get('/admin/notifications').then(r => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post('/admin/notifications/send', form),
    onSuccess: () => {
      qc.invalidateQueries(['admin-notifications']);
      setForm({ title: '', body: '', targetRoles: [], targetDepartments: [] });
      toast.success('Notification broadcast sent ✓');
    },
    onError: () => toast.error('Failed to send notification'),
  });

  const toggleArr = (key, val) => {
    setForm(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(v => v !== val) : [...p[key], val]
    }));
  };

  return (
    <div className="dashboard-content">
      <PageHeader title="📣 Broadcast Notifications" subtitle="Send announcements to students and faculty" />

      <div className="grid-2">
        <div className="chart-container">
          <div className="chart-title">New Broadcast</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.07em' }}>TITLE</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title..." className="input-field" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.07em' }}>MESSAGE BODY</label>
              <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Message content..." className="input-field" style={{ height: 100, resize: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.07em' }}>TARGET ROLES</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['student', 'faculty', 'admin'].map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f1f5f9', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.targetRoles.includes(r)} onChange={() => toggleArr('targetRoles', r)} />
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.07em' }}>TARGET DEPARTMENTS (OPTIONAL)</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Business'].map(d => (
                  <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f1f5f9', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.targetDepartments.includes(d)} onChange={() => toggleArr('targetDepartments', d)} />
                    {d}
                  </label>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Leave empty to send to all departments.</p>
            </div>

            <button onClick={() => sendMutation.mutate()} disabled={!form.title || !form.body || sendMutation.isPending} style={{
              width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', mt: 10,
              background: (!form.title || !form.body) ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#6366f1,#7c3aed)',
              color: (!form.title || !form.body) ? '#64748b' : 'white', cursor: (!form.title || !form.body) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
            }}>
              {sendMutation.isPending ? <><span className="spinner" />Sending...</> : '🚀 Send Broadcast'}
            </button>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-title">Broadcast History</div>
          {isLoading ? <TableSkel rows={5} /> : (history?.notifications || []).length === 0 ? (
            <div className="empty-state"><span style={{ fontSize: 24 }}>📭</span><p>No past broadcasts</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(history?.notifications || []).map((n, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{n.title}</p>
                    <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '--'}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{n.body}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {n.targetRoles?.map((r, j) => <span key={`r${j}`} style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 10, fontWeight: 600 }}>{r}</span>)}
                    {n.targetDepartments?.map((d, j) => <span key={`d${j}`} style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 10, fontWeight: 600 }}>{d}</span>)}
                    {(!n.targetDepartments || n.targetDepartments.length === 0) && <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>All Depts</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
