'use client';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PeerBenchmarkCard({ myScore = 75, classAvg = 68, top10Avg = 85 }) {
  const data = [
    { name: 'Class Avg', value: classAvg, fill: '#64748b' },
    { name: 'You', value: myScore, fill: '#6366f1' },
    { name: 'Top 10%', value: top10Avg, fill: '#f59e0b' },
  ];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>Peer Benchmark</h3>
      <div style={{ flex: 1, minHeight: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: 'var(--text-main)', fontSize: 12 }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
