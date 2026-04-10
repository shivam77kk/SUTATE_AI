'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export default function StudentAttendance() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => api.get('/student/attendance').then(r => r.data),
  });

  const subjects = data?.subjects || [];
  const overall = subjects.length
    ? Math.round(subjects.reduce((a, s) => a + s.percentage, 0) / subjects.length)
    : 0;
  const dangerCount = subjects.filter(s => s.status === 'danger').length;
  const warningCount = subjects.filter(s => s.status === 'warning').length;

  if (isLoading) return (
    <div className="dashboard-content">
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: '12px' }} />)}
    </div>
  );

  return (
    <div className="dashboard-content">
      <div className="page-header animate-fadeIn">
        <h1 className="page-title">📅 My <span className="gradient-text">Attendance</span></h1>
        <p className="page-subtitle">Detailed attendance record across all subjects this semester</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {[
          { icon: '📊', label: 'Overall Attendance', value: `${overall}%`, color: overall >= 85 ? '#34d399' : overall >= 75 ? '#fbbf24' : '#fb7185' },
          { icon: '🚨', label: 'Below 75% (Risk)', value: dangerCount, color: '#fb7185' },
          { icon: '⚠️', label: 'Near Threshold', value: warningCount, color: '#fbbf24' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="kpi-card animate-slideUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
                <div className="stat-number" style={{ color }}>{value}</div>
              </div>
              <div style={{ fontSize: '28px' }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Cards */}
      {subjects.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px' }}>📭</div>
          <div>No attendance data available yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {subjects.map((s, i) => {
            const color = s.status === 'safe' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#f43f5e';
            const classesNeeded = s.percentage < 75
              ? Math.ceil((0.75 * s.total - s.attended) / (1 - 0.75))
              : 0;
            return (
              <div key={s.subject} className="animate-slideUp" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 24px', borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#f1f5f9' }}>{s.subject}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color }}>{s.percentage}%</div>
                      <span className={`tag tag-${s.status}`}>
                        {s.status === 'safe' ? 'SAFE' : s.status === 'warning' ? 'WARNING' : 'DANGER'}
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar-container" style={{ marginBottom: '12px' }}>
                    <div className="progress-bar" style={{ width: `${s.percentage}%`, background: color }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>Attended: <strong style={{ color: '#94a3b8' }}>{s.attended}/{s.total} classes</strong></span>
                    {classesNeeded > 0 ? (
                      <span style={{ color: '#fb7185' }}>⚠️ Need {classesNeeded} more classes to reach 75%</span>
                    ) : (
                      <span style={{ color: '#34d399' }}>✅ Above minimum threshold</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
