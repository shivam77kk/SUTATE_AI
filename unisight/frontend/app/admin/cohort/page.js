'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';

export default function CohortPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-cohorts'],
    queryFn: () => api.get('/cohort').then(r => r.data),
  });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  const cohorts = data?.cohorts || [];

  return (
    <div className="dashboard-content">
      <PageHeader title="👥 Cohort Analysis" subtitle="Track cohort-level dropout trends and predictions" />
      <div className="grid-3">
        {cohorts.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <span style={{ fontSize: 32 }}>👥</span>
            <p>No cohort data yet. Upload student data first.</p>
          </div>
        ) : cohorts.map((cohort, i) => {
          const riskColor = cohort.avgDropoutScore >= 70 ? '#f43f5e' : cohort.avgDropoutScore >= 40 ? '#f59e0b' : '#10b981';
          return (
            <Link key={i} href={`/admin/cohort/${cohort.cohortId || cohort._id}`} style={{ textDecoration: 'none' }}>
              <div className="kpi-card" style={{ cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${riskColor}, transparent 70%)`, borderRadius: '14px 14px 0 0' }} />
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 2 }}>{cohort.cohortName || cohort.semester}</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>{cohort.department} · {cohort.year}</p>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Students', value: cohort.studentCount },
                    { label: 'Avg CGPA', value: cohort.avgCgpa?.toFixed(2) },
                    { label: 'Avg Risk', value: `${cohort.avgDropoutScore?.toFixed(0)}%`, color: riskColor },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: item.color || '#f1f5f9', fontFamily: "'Space Grotesk',sans-serif" }}>{item.value ?? '--'}</p>
                      <p style={{ fontSize: 10, color: '#64748b' }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
