'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkel } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const STATUS_COLORS = { open: '#f59e0b', in_progress: '#0ea5e9', resolved: '#10b981', closed: '#64748b' };
const CATEGORIES = ['Marks Error', 'Attendance Issue', 'Study Support', 'Technical Problem', 'Other'];

export default function HelpPage() {
  const [tab, setTab] = useState('submit');
  const [form, setForm] = useState({ category: '', subject: '', description: '', urgent: false });
  const qc = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-help-requests'],
    queryFn: () => api.get('/help-requests/my-requests').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/help-requests/request', { category: form.category, subject: form.subject, description: form.description, urgency: form.urgent ? 'urgent' : 'general' }),
    onSuccess: () => {
      qc.invalidateQueries(['my-help-requests']);
      setForm({ category: '', subject: '', description: '', urgent: false });
      setTab('requests');
      toast.success('Help request submitted ✓');
    },
    onError: (err) => toast.error(err.response?.data?.details || err.response?.data?.error || 'Failed to submit request'),
  });

  return (
    <div className="dashboard-content">
      <PageHeader title="🙋 Help & Support" subtitle="Submit a request or track your existing requests" />

      <div className="tab-container" style={{ marginBottom: 24 }}>
        {['submit', 'requests'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ minHeight: 44 }}>
            {t === 'submit' ? '+ New Request' : `My Requests ${requests?.requests?.length ? `(${requests.requests.length})` : ''}`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'submit' ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="chart-container">
              <div className="chart-title">New Help Request</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.07em' }}>CATEGORY</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0d0d1f' }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.07em' }}>SUBJECT</label>
                  <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Brief title of your issue" className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.07em' }}>DESCRIPTION</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe your issue in detail..." className="input-field"
                    style={{ resize: 'none', height: 100 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => setForm(p => ({ ...p, urgent: !p.urgent }))} style={{
                    width: 40, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                    background: form.urgent ? '#f43f5e' : 'rgba(255,255,255,0.08)', position: 'relative',
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: form.urgent ? 19 : 3, transition: 'left 0.2s' }} />
                  </button>
                  <span style={{ fontSize: 13, color: form.urgent ? '#fb7185' : '#64748b' }}>Mark as urgent</span>
                </div>
              </div>
              <button onClick={() => mutation.mutate()} disabled={!form.category || !form.subject || !form.description || mutation.isPending} style={{
                marginTop: 24, width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: 'white', cursor: 'pointer',
                opacity: (!form.category || !form.subject || !form.description) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
              }}>
                {mutation.isPending ? <><span className="spinner" />Submitting...</> : 'Submit request'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isLoading ? <TableSkel rows={4} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(requests?.requests || []).length === 0 ? (
                  <div className="empty-state"><span style={{ fontSize: 32 }}>✅</span><p style={{ fontWeight: 600 }}>No requests yet</p></div>
                ) : (
                  (requests.requests || []).map((req, i) => (
                    <div key={i} className="chart-container">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 15, color: '#f1f5f9' }}>{req.subject}</p>
                          <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{req.category}</p>
                        </div>
                        <span style={{
                          padding: '2px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          background: `${STATUS_COLORS[req.status] || '#64748b'}18`,
                          color: STATUS_COLORS[req.status] || '#64748b',
                          border: `1px solid ${STATUS_COLORS[req.status] || '#64748b'}33`,
                        }}>{req.status?.replace('_', ' ')}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: req.facultyResponse ? 10 : 0 }}>{req.description}</p>
                      {req.facultyResponse && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10, marginTop: 8 }}>
                          <p style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>FACULTY RESPONSE</p>
                          <p style={{ fontSize: 13, color: '#f1f5f9', fontStyle: 'italic' }}>{req.facultyResponse}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
