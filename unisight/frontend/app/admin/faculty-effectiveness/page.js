'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { TableSkel, CardSkel } from '@/components/ui/Skeleton';

export default function FacultyEffectivenessPage() {
  const [dept, setDept] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-faculty-effectiveness', dept],
    queryFn: () => api.get('/admin/faculty-effectiveness').then(r => r.data),
  });

  const leaderboard = data?.leaderboard || [];
  const departments = ['all', ...[...new Set(leaderboard.map(f => f.department).filter(Boolean))]];
  const faculty = (dept === 'all' ? leaderboard : leaderboard.filter(f => f.department === dept)).map(f => ({
    name: f.facultyName,
    department: f.department,
    score: f.effectivenessScore,
    badge: f.effectivenessScore >= 85 ? 'Excellent' : f.effectivenessScore >= 70 ? 'Good' : 'Developing',
    studentPassRate: f.classPassRate,
    studentCount: null,
  }));

  return (
    <div className="dashboard-content">
      <PageHeader title="⭐ Faculty Effectiveness" subtitle="Teaching effectiveness scores across all faculty" />

      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '10px 16px', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: '#f59e0b' }}>⚠ Individual scores are NOT shared publicly. This view is restricted to admins only.</p>
      </div>

      <Tabs tabs={departments.map(d => ({ label: d === 'all' ? 'All Departments' : d, value: d }))} active={dept} onChange={setDept} />

      <div style={{ marginTop: 20 }}>
        {isLoading ? <TableSkel rows={6} /> : (
          <div className="chart-container">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Department</th><th>Score</th><th>Badge</th><th>Students</th><th>Pass Rate</th></tr>
              </thead>
              <tbody>
                {faculty.map((f, i) => (
                  <tr key={i}>
                    <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{f.name}</td>
                    <td style={{ color: '#64748b' }}>{f.department}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: f.score >= 75 ? '#10b981' : f.score >= 50 ? '#f59e0b' : '#f43f5e' }}>
                      {f.score ?? '--'}
                    </td>
                    <td><span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{f.badge || '--'}</span></td>
                    <td style={{ color: '#94a3b8' }}>{f.studentCount ?? '--'}</td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{f.studentPassRate !== undefined ? `${f.studentPassRate}%` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
