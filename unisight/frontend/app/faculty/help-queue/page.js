'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkel } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

const STATUS_TABS = ['All', 'open', 'in_progress', 'resolved'];
const STATUS_COLORS = { open: '#f59e0b', in_progress: '#0ea5e9', resolved: '#10b981' };
const STATUS_ICONS = { open: '⏳', in_progress: '🔄', resolved: '✅' };

function TimeStamp({ date, label, color }) {
  if (!date) return null;
  const d = new Date(date);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: color || '#64748b' }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{format(d, 'dd MMM, hh:mm a')}</span>
      <span style={{ opacity: 0.5 }}>({formatDistanceToNow(d, { addSuffix: true })})</span>
    </div>
  );
}

export default function HelpQueuePage() {
  const [tab, setTab] = useState('All');
  const [responding, setResponding] = useState({});
  const [responseText, setResponseText] = useState({});
  const qc = useQueryClient();

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['help-queue'] });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['help-queue'],
    queryFn: () => api.get('/help/faculty-queue').then(r => r.data),
    staleTime: 0,
    refetchInterval: 15000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ requestId, response }) => api.patch(`/help-requests/${requestId}/respond`, { response }),
    onSuccess: () => { 
      qc.invalidateQueries(['help-queue']); 
      toast.success('Response sent ✓'); 
      setResponding({});
      setResponseText({});
    },
    onError: () => toast.error('Failed to respond'),
  });

  const rawRequests = data?.requests || [];
  const filteredRequests = rawRequests.filter(r => tab === 'All' || r.status === tab);
  
  // Sort requests by latest activity first (respondedAt or createdAt)
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aTime = a.respondedAt || a.updatedAt || a.createdAt;
    const bTime = b.respondedAt || b.updatedAt || b.createdAt;
    return new Date(bTime) - new Date(aTime);
  });

  return (
    <div className="dashboard-content">
      <PageHeader title="🙋 Help Queue" subtitle="Respond to student help requests"
        action={<span style={{ fontSize: 12, color: '#64748b', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>Auto-refreshes every 15s</span>} />

      <Tabs tabs={STATUS_TABS.map(t => ({ label: t === 'All' ? 'All' : t.replace('_', ' '), value: t }))} active={tab} onChange={setTab} />
      <div style={{ marginTop: 20 }}>
        {isLoading ? <TableSkel rows={4} /> : sortedRequests.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: 32 }}>✅</span><p style={{ fontWeight: 600 }}>No requests in this category</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedRequests.map((req, i) => {
              const tc = STATUS_COLORS[req.status] || '#64748b';
              const isResponding = responding[req._id];
              return (
                <motion.div 
                  key={req._id || i} 
                  className="chart-container"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ position: 'relative', borderLeft: `3px solid ${tc}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 15, color: '#f1f5f9', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {STATUS_ICONS[req.status] || '📝'} {req.subject}
                        {req.urgency === 'urgent' && (
                          <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Urgent
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{req.studentName || 'Student'} · {req.category}</p>
                    </div>
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', background: `${tc}18`, color: tc, border: `1px solid ${tc}33`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {req.status?.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Student Message */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 14px', marginBottom: req.facultyResponse || isResponding ? 12 : 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{req.studentName || 'Student'} asked</span>
                      <TimeStamp date={req.createdAt} label="Sent" color="#94a3b8" />
                    </div>
                    <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.55, margin: 0 }}>{req.description}</p>
                  </div>

                  {/* Faculty Response or Respond Actions */}
                  {req.facultyResponse ? (
                    <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(16,185,129,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          You replied
                        </span>
                        <TimeStamp date={req.respondedAt} label="Replied" color="#10b981" />
                      </div>
                      <p style={{ fontSize: 13, color: '#d1fae5', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>{req.facultyResponse}</p>
                    </div>
                  ) : !isResponding ? (
                    <button onClick={() => setResponding(p => ({ ...p, [req._id]: true }))} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
                      Reply to student
                    </button>
                  ) : (
                    <AnimatePresence>
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <textarea value={responseText[req._id] || ''} onChange={e => setResponseText(p => ({ ...p, [req._id]: e.target.value }))}
                          placeholder="Write your response to the student..." className="input-field"
                          style={{ resize: 'none', height: 80, marginBottom: 10 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setResponding(p => ({ ...p, [req._id]: false })); }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 13, minHeight: 44 }}>Cancel</button>
                          <button onClick={() => respondMutation.mutate({ requestId: req._id, response: responseText[req._id] })} disabled={!responseText[req._id]?.trim()} style={{ padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
                            Send & Resolve
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
