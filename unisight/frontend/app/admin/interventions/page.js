'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { CardSkel, TableSkel } from '@/components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = { pending: '#f59e0b', in_progress: '#0ea5e9', resolved: '#10b981', escalated: '#f43f5e' };

export default function InterventionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-interventions'],
    queryFn: () => api.get('/interventions/stats').then(r => r.data).then(stats => ({ stats, interventions: [] })),
  });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  const stats = data?.stats || {};
  const interventions = data?.interventions || [];
  const resolution = stats.resolutionRate || 0;

  return (
    <div className="dashboard-content">
      <PageHeader title="🎯 Interventions" subtitle="Track and manage at-risk student interventions" />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="TOTAL" value={stats.total ?? '--'} color="indigo" />
        <KPICard label="RESOLVED" value={stats.resolved ?? '--'} color="emerald" />
        <KPICard label="PENDING" value={stats.pending ?? '--'} color="amber" />
        <KPICard label="RESOLUTION RATE" value={`${resolution}%`} color={resolution >= 70 ? 'emerald' : 'rose'} />
      </div>

      {/* Resolution gauge */}
      <div className="chart-container" style={{ marginBottom: 24 }}>
        <div className="chart-title">🎯 Resolution Rate</div>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 999, marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${resolution}%`, background: resolution >= 70 ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: 999, transition: 'width 1s ease' }} />
        </div>
        <p style={{ fontSize: 12, color: '#64748b' }}>{resolution}% of interventions resolved</p>
      </div>

      <div className="chart-container">
        <div className="chart-title">📋 All Interventions</div>
        {interventions.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: 28 }}>✅</span><p>No interventions recorded</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Student</th><th>Type</th><th>Status</th><th>Assigned To</th><th>Date</th></tr></thead>
            <tbody>
              {interventions.map((iv, i) => {
                const tc = STATUS_COLORS[iv.status] || '#64748b';
                return (
                  <tr key={i}>
                    <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{iv.studentName}</td>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{iv.type}</td>
                    <td><span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: `${tc}18`, color: tc, textTransform: 'capitalize' }}>{iv.status?.replace('_', ' ')}</span></td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{iv.facultyName || '--'}</td>
                    <td style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>{iv.createdAt ? formatDistanceToNow(new Date(iv.createdAt), { addSuffix: true }) : '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
