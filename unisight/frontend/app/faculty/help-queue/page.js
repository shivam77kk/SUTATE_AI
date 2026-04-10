'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkel } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'open', 'in_progress', 'resolved'];
const STATUS_COLORS = { open: '#f59e0b', in_progress: '#0ea5e9', resolved: '#10b981' };

export default function HelpQueuePage() {
  const [tab, setTab] = useState('All');
  const [responding, setResponding] = useState({});
  const [responseText, setResponseText] = useState({});
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['help-queue'],
    queryFn: () => api.get('/help/faculty-queue').then(r => r.data),
    refetchInterval: 30000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ requestId, response }) => api.patch(`/help-requests/${requestId}/respond`, { response }),
    onSuccess: () => { qc.invalidateQueries(['help-queue']); toast.success('Response sent ✓'); },
    onError: () => toast.error('Failed to respond'),
  });

  const requests = (data?.requests || []).filter(r => tab === 'All' || r.status === tab);

  return (
    <div className="dashboard-content">
      <PageHeader title="🙋 Help Queue" subtitle="Respond to student help requests"
        action={<span style={{ fontSize: 12, color: '#64748b', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>Auto-refreshes every 30s</span>} />

      <Tabs tabs={STATUS_TABS.map(t => ({ label: t === 'All' ? 'All' : t.replace('_', ' '), value: t }))} active={tab} onChange={setTab} />
      <div style={{ marginTop: 20 }}>
        {isLoading ? <TableSkel rows={4} /> : requests.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: 32 }}>✅</span><p>No requests in this category</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map((req, i) => {
              const tc = STATUS_COLORS[req.status] || '#64748b';
              const isResponding = responding[req._id];
              return (
                <div key={i} className="chart-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, color: '#f1f5f9', marginBottom: 2 }}>{req.subject}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{req.studentName || 'Student'} · {req.category} {req.urgent && <span style={{ color: '#f43f5e', fontWeight: 700 }}>· URGENT</span>}</p>
                    </div>
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', background: `${tc}18`, color: tc, border: `1px solid ${tc}33`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {req.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>{req.description}</p>
                  {!isResponding ? (
                    <button onClick={() => setResponding(p => ({ ...p, [req._id]: true }))} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
                      Respond
                    </button>
                  ) : (
                    <AnimatePresence>
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <textarea value={responseText[req._id] || ''} onChange={e => setResponseText(p => ({ ...p, [req._id]: e.target.value }))}
                          placeholder="Write your response..." className="input-field"
                          style={{ resize: 'none', height: 80, marginBottom: 10 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setResponding(p => ({ ...p, [req._id]: false })); }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 13, minHeight: 44 }}>Cancel</button>
                          <button onClick={() => respondMutation.mutate({ requestId: req._id, response: responseText[req._id], status: 'resolved' })} disabled={!responseText[req._id]?.trim()} style={{ padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
                            Send & resolve
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
