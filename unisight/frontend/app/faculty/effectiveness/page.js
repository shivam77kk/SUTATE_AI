'use client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { CardSkel, TableSkel } from '@/components/ui/Skeleton';
import { CW, SafeTip } from '@/lib/chart';

export default function EffectivenessPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-effectiveness-history'],
    queryFn: () => api.get('/faculty/effectiveness').then(r => r.data),
  });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  const eff = data?.overall || {};
  const history = data?.history || [];

  return (
    <div className="dashboard-content">
      <PageHeader
        title="🎖️ Teaching Effectiveness"
        subtitle="Your teaching performance metrics over time"
      />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="OVERALL SCORE" value={eff.score ?? '--'} unit="/ 100" color="indigo" />
        <KPICard label="BADGE" value="" badge={<span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: '#f59e0b' }}>{eff.badge || '--'}</span>} color="amber" />
        <KPICard label="STUDENT PASS RATE" value={eff.studentPassRate !== undefined ? `${eff.studentPassRate}%` : '--'} color="emerald" />
        <KPICard label="AVG IMPROVEMENT" value={eff.avgImprovement !== undefined ? `+${eff.avgImprovement}%` : '--'} color="violet" />
      </div>

      {history.length > 1 && (
        <CW title="📈 Effectiveness Score Over Time" height={260}>
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<SafeTip />} />
              <Line type="monotone" dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CW>
      )}

      <div className="chart-container" style={{ marginTop: 24 }}>
        <div className="chart-title">📋 Effectiveness History</div>
        <table className="data-table">
          <thead><tr><th>Period</th><th>Score</th><th>Badge</th><th>Pass Rate</th><th>Avg Improvement</th><th>Students</th></tr></thead>
          <tbody>
            {history.map((row, i) => (
              <tr key={i}>
                <td>{row.period}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: row.score >= 75 ? '#10b981' : row.score >= 50 ? '#f59e0b' : '#f43f5e' }}>{row.score}</td>
                <td><span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{row.badge || '--'}</span></td>
                <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{row.studentPassRate !== undefined ? `${row.studentPassRate}%` : '--'}</td>
                <td style={{ fontFamily: 'monospace', color: '#10b981' }}>{row.avgImprovement !== undefined ? `+${row.avgImprovement}%` : '--'}</td>
                <td style={{ color: '#94a3b8' }}>{row.studentCount ?? '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
