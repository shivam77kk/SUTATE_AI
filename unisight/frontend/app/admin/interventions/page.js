'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { CardSkel, TableSkel } from '@/components/ui/Skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';

const STATUS_COLORS = { pending: '#f59e0b', in_progress: '#0ea5e9', resolved: '#10b981', escalated: '#f43f5e' };
const STATUS_ICONS = { pending: '⏳', in_progress: '🔄', resolved: '✅', escalated: '🚨' };

function TimeStamp({ date, label, color }) {
  if (!date) return <span style={{ color: '#475569', fontStyle: 'italic', fontSize: 11 }}>--</span>;
  const d = new Date(date);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: color || '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 600 }}>
        {format(d, 'dd MMM yy, hh:mm a')}
      </div>
      <div style={{ fontSize: 11, color: '#64748b' }}>
        {formatDistanceToNow(d, { addSuffix: true })}
      </div>
    </div>
  );
}

export default function InterventionsPage() {
  const qc = useQueryClient();

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['admin-interventions'] });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-interventions'],
    queryFn: async () => {
      const [statsRes, listRes] = await Promise.all([
        api.get('/interventions/stats'),
        api.get('/interventions')
      ]);
      return { stats: statsRes.data, interventions: listRes.data.interventions };
    },
    staleTime: 0,
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  const stats = data?.stats || {};
  const interventions = data?.interventions || [];
  const rawResolution = stats.resolutionRate || 0;
  const resolution = typeof rawResolution === 'string' ? parseInt(rawResolution.replace('%', ''), 10) : rawResolution;

  // Ensure newest interventions appear at the top
  const sortedInterventions = [...interventions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="dashboard-content">
      <PageHeader title="🎯 Interventions" subtitle="Track and manage at-risk student interventions" 
        action={<span style={{ fontSize: 12, color: '#64748b', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>Auto-refreshes every 15s</span>} />

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
        <div className="chart-title">📋 All Interventions Timeline</div>
        {sortedInterventions.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: 28 }}>✅</span><p>No interventions recorded</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {sortedInterventions.map((iv, i) => {
               const tc = STATUS_COLORS[iv.status] || '#64748b';
               return (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.03 }}
                   style={{ 
                     display: 'flex', 
                     gap: 20, 
                     padding: '16px', 
                     background: 'rgba(255,255,255,0.02)', 
                     borderRadius: 12, 
                     border: '1px solid rgba(255,255,255,0.05)',
                     borderLeft: `4px solid ${tc}`
                   }}
                 >
                   <div style={{ flex: 1, minWidth: 200 }}>
                     <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                       {STATUS_ICONS[iv.status] || '📝'} {iv.studentName}
                     </p>
                     <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                       <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{iv.type}</span> · <span style={{ opacity: 0.8 }}>Assigned to: {iv.facultyName || 'Unknown Faculty'}</span>
                     </p>
                     <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', background: `${tc}15`, color: tc, border: `1px solid ${tc}30`, letterSpacing: '0.05em' }}>
                       {iv.status?.replace('_', ' ')}
                     </span>
                   </div>

                   <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                     <TimeStamp date={iv.sentAt || iv.createdAt} label="Initiated" color="#818cf8" />
                     
                     <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
                     
                     {iv.resolvedAt ? (
                       <TimeStamp date={iv.resolvedAt} label="Resolved" color="#10b981" />
                     ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100 }}>
                          <span style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Resolution Time</span>
                          <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Pending action...</span>
                        </div>
                     )}
                   </div>
                 </motion.div>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
}
