'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import toast from 'react-hot-toast';

export default function DepartmentDrilldownPage() {
  const { dept } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dept) return;
    api.get(`/admin/department/${dept}`)
      .then(res => setData(res.data))
      .catch(() => toast.error(`Failed to load data for ${dept}`))
      .finally(() => setLoading(false));
  }, [dept]);

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading department analytics...</div>;
  if (!data) return null;

  const COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981' };
  const riskData = Object.entries(data.riskDistribution || {}).map(([key, val]) => ({ name: key, value: val }));

  return (
    <div style={{ minHeight: '100%', paddingBottom: '40px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.back()} className="btn-secondary" style={{ padding: '8px 16px' }}>← Back</button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>
            <span style={{ color: 'var(--primary)' }}>{decodeURIComponent(dept)}</span> Department
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Deep-dive analytics and subject performance.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Enrolled</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-main)' }}>{data.totalStudents || 0}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Dept Avg Score</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-main)' }}>{data.avgDeptScore || 0}%</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Worst Issue</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f43f5e' }}>{data.worstSubject || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Subject with highest fail rate</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>Subject Performance Comparisons</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjectStats || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="subject" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar dataKey="passPercent" name="Pass Rate %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgAttendance" name="Avg Attendance %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>Risk Distribution</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#ccc'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1e1e', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            {riskData.map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[r.name] }} />
                {r.name} ({r.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
