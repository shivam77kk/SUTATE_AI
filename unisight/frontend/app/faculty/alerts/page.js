'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function FacultyAlerts() {
  const [sendingId, setSendingId] = useState(null);
  const [preview, setPreview] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['faculty-pending-alerts'],
    queryFn: () => api.get('/faculty/pending-alerts').then(r => r.data),
  });

  const students = data?.students || [];

  const handleSendAlert = async (studentId, name) => {
    setSendingId(studentId);
    try {
      const { data: resp } = await api.post('/faculty/send-alert', { studentId });
      setPreview({ email: resp.emailDraft, name: resp.sentTo || name });
      toast.success(`Alert generated for ${name}`);
    } catch {
      toast.error('Failed to generate alert');
    } finally { setSendingId(null); }
  };

  const handleSendAll = async () => {
    if (!students.length) return;
    const highRisk = students.filter(s => s.riskLevel === 'HIGH').slice(0, 3);
    for (const s of highRisk) {
      await handleSendAlert(s.studentId, s.name);
    }
    toast.success(`Sent ${highRisk.length} alerts`);
    refetch();
  };

  const riskColor = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981' };

  return (
    <div className="dashboard-content">
      <div className="page-header animate-fadeIn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🚨 At-Risk <span className="gradient-text-emerald">Alerts</span></h1>
          <p className="page-subtitle">Students flagged by AI for immediate faculty intervention</p>
        </div>
        <button onClick={handleSendAll} disabled={!students.length} className="btn-primary" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
          📧 Alert All HIGH Risk
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total At-Risk', value: students.length, color: '#fb7185', icon: '👥' },
          { label: 'HIGH Risk', value: students.filter(s => s.riskLevel === 'HIGH').length, color: '#f43f5e', icon: '🚨' },
          { label: 'MEDIUM Risk', value: students.filter(s => s.riskLevel === 'MEDIUM').length, color: '#f59e0b', icon: '⚠️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="kpi-card animate-slideUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color }}>{value}</div>
              </div>
              <div style={{ fontSize: '28px' }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px' }}>
          <div style={{ fontSize: '48px' }}>✅</div>
          <div>No at-risk students found for your classes</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {students.map(s => {
            const rc = riskColor[s.riskLevel] || '#64748b';
            return (
              <div key={s.studentId} className="animate-slideUp" style={{ background: 'var(--card-bg)', border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `4px solid ${rc}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${rc}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: rc, flexShrink: 0, border: `1px solid ${rc}30` }}>
                  {s.name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '15px' }}>{s.name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{s.studentId}</span>
                    <span className={`risk-badge risk-${s.riskLevel?.toLowerCase()}`}>{s.riskLevel}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{s.riskReason || 'AI flagged for intervention'}</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>📊 Avg: {s.avgScore ?? '—'}%</span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>📅 Attendance: {s.avgAttendance ?? '—'}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Link href={`/faculty/student/${s.studentId}`} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                    View Profile
                  </Link>
                  <button
                    onClick={() => handleSendAlert(s.studentId, s.name)}
                    disabled={sendingId === s.studentId}
                    style={{ padding: '8px 14px', background: `${rc}18`, border: `1px solid ${rc}30`, borderRadius: '8px', color: rc, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {sendingId === s.studentId ? '⏳' : '📧 Alert'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Email Preview Modal */}
      {preview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>📧 AI-Generated Alert</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>For: {preview.name}</p>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', fontSize: '13px', color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: '1.7', fontFamily: 'monospace', maxHeight: '320px', overflowY: 'auto', marginBottom: '16px' }}>
              {preview.email}
            </div>
            <button onClick={() => setPreview(null)} className="btn-ghost" style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
