'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { CardSkel } from '@/components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function SystemPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/admin/system').then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  const d = data || {};
  const logs = d.recentLogs || [];

  return (
    <div className="dashboard-content">
      <PageHeader title="⚙️ System Health" subtitle="Monitor SUTATE AI pipeline and system status" />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="TOTAL USERS" value={d.totalUsers ?? '--'} color="indigo" />
        <KPICard label="PIPELINE RUNS" value={d.pipelineRuns ?? '--'} color="emerald" />
        <KPICard label="ALERTS TODAY" value={d.alertsToday ?? '--'} color="rose" />
        <KPICard label="ACTIVE NOW" value={d.activeSessionsNow ?? '--'} color="amber" />
      </div>

      {/* Pipeline status */}
      {d.lastPipelineRun && (
        <div className="chart-container" style={{ marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.pipelineStatus === 'success' ? '#10b981' : '#f43f5e' }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>AI Pipeline: {d.pipelineStatus === 'success' ? 'Healthy' : 'Error'}</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b' }}>Last run: {formatDistanceToNow(new Date(d.lastPipelineRun), { addSuffix: true })}</p>
          {d.avgProcessingTime && <p style={{ fontSize: 12, color: '#64748b' }}>Avg time: {d.avgProcessingTime}ms</p>}
        </div>
      )}

      {/* Services status */}
      {d.services && (
        <div className="chart-container" style={{ marginBottom: 24 }}>
          <div className="chart-title">🔌 Services</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(d.services).map(([service, status]) => (
              <div key={service} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'up' ? '#10b981' : '#f43f5e' }} />
                <span style={{ fontSize: 13, color: status === 'up' ? '#f1f5f9' : '#fb7185', fontWeight: 500 }}>{service}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent logs */}
      <div className="chart-container">
        <div className="section-header">
          <div className="chart-title">📋 Recent Logs</div>
          <a href="/admin/logs" style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>View all →</a>
        </div>
        {logs.slice(0, 8).map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
            <span style={{ fontFamily: 'monospace', color: '#64748b', flexShrink: 0, width: 120 }}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--'}</span>
            <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0, background: { error: 'rgba(244,63,94,0.12)', warn: 'rgba(245,158,11,0.12)', info: 'rgba(14,165,233,0.12)' }[log.level] || 'rgba(255,255,255,0.04)', color: { error: '#fb7185', warn: '#fbbf24', info: '#38bdf8' }[log.level] || '#64748b' }}>{log.level}</span>
            <span style={{ color: '#94a3b8', flex: 1 }}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
