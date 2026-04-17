'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function InterventionTracker() {
  const [interventions, setInterventions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/interventions/my')
      .then(res => {
        setInterventions(res.data.interventions);
        setStats(res.data.stats);
      })
      .catch(() => toast.error('Failed to load interventions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Loading closed-loop tracking...</div>;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Closed-Loop Intervention Tracking</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Track the outcome of risk alerts you've sent to students.</p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Sent</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.total}</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#10b981', textTransform: 'uppercase' }}>Improved</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{stats.improved}</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#f59e0b', textTransform: 'uppercase' }}>Pending</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{stats.pending}</div>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--primary)', textTransform: 'uppercase' }}>Resolution Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>{stats.resolutionRate}</div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 0' }}>Student</th>
              <th style={{ padding: '12px 0' }}>Sent At</th>
              <th style={{ padding: '12px 0' }}>Initial Risk</th>
              <th style={{ padding: '12px 0' }}>Current Risk</th>
              <th style={{ padding: '12px 0' }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {interventions.map(i => (
              <tr key={i._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 0', color: 'var(--text-main)', fontWeight: '500' }}>{i.studentName}</td>
                <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>{new Date(i.sentAt).toLocaleDateString()}</td>
                <td style={{ padding: '16px 0' }}>
                  <span style={{ color: i.riskAtSend === 'HIGH' ? '#f43f5e' : '#f59e0b', fontSize: '12px', fontWeight: '600' }}>{i.riskAtSend}</span>
                </td>
                <td style={{ padding: '16px 0' }}>
                  {i.riskAfter ? (
                     <span style={{ color: i.riskAfter === 'LOW' ? '#10b981' : i.riskAfter === 'HIGH' ? '#f43f5e' : '#f59e0b', fontSize: '12px', fontWeight: '600' }}>{i.riskAfter}</span>
                  ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ padding: '16px 0' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                    background: i.outcome === 'improved' ? 'rgba(16,185,129,0.1)' : 
                                i.outcome === 'worsened' ? 'rgba(244,63,94,0.1)' :
                                i.outcome === 'unchanged' ? 'rgba(255,255,255,0.05)' : 'rgba(245,158,11,0.1)',
                    color: i.outcome === 'improved' ? '#10b981' : 
                           i.outcome === 'worsened' ? '#f43f5e' :
                           i.outcome === 'unchanged' ? 'var(--text-muted)' : '#f59e0b'
                  }}>
                    {i.outcome.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {interventions.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No interventions tracked yet. Send risk alerts from the student profile to start tracking.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
