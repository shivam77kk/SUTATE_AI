'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';

export default function FacultyClasses() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-classes'],
    queryFn: () => api.get('/faculty/classes').then(r => r.data),
  });

  const classes = data?.classes || [];

  const deptColor = { CSE: '#6366f1', IT: '#10b981', Mech: '#f59e0b', Civil: '#0ea5e9', ECE: '#a78bfa' };

  return (
    <div className="dashboard-content">
      <div className="page-header animate-fadeIn">
        <h1 className="page-title">🏫 My <span className="gradient-text-emerald">Classes</span></h1>
        <p className="page-subtitle">All classes you're responsible for — click to view analytics</p>
      </div>

      {isLoading ? (
        <div className="grid-3">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '16px' }} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="empty-state" style={{ height: '360px' }}>
          <div style={{ fontSize: '48px' }}>🏫</div>
          <div>No classes found. Upload a CSV to create a class.</div>
          <Link href="/faculty/upload" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', textDecoration: 'none' }}>
            Upload CSV
          </Link>
        </div>
      ) : (
        <div className="grid-3">
          {classes.map((cls, i) => {
            const dc = deptColor[cls.department] || '#6366f1';
            return (
              <Link key={cls.classId} href={`/faculty/class/${cls.classId}`} style={{ textDecoration: 'none' }}>
                <div className="kpi-card animate-slideUp" style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer', transition: 'all 0.2s', border: `1px solid rgba(255,255,255,0.06)` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${dc}50`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${dc}18`, border: `1px solid ${dc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                      🏫
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: dc, background: `${dc}15`, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                      {cls.department}
                    </span>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#f1f5f9', marginBottom: '4px' }}>
                    Semester {cls.semester}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginBottom: '12px' }}>{cls.classId}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="stat-number" style={{ fontSize: '28px', color: dc }}>{cls.studentCount}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Students</div>
                    </div>
                    <div style={{ fontSize: '13px', color: dc, fontWeight: '700' }}>View →</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
