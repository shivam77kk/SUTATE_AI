'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const SEVERITY_CONFIG = {
  danger: { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', icon: '🚨', label: 'Critical' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '⚠️', label: 'Warning' },
  info: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)', icon: 'ℹ️', label: 'Info' },
  success: { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', icon: '✅', label: 'Good' },
};

export default function StudentTimeline() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-timeline'],
    queryFn: () => api.get('/student/timeline').then(r => r.data),
  });

  const events = data?.events || [];

  if (isLoading) {
    return (
      <div className="dashboard-content">
        <div className="page-header">
          <div className="skeleton" style={{ width: '250px', height: '32px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '320px', height: '16px' }} />
        </div>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px', marginBottom: '12px' }} />)}
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="page-header animate-fadeIn">
        <h1 className="page-title">⏳ Academic <span className="gradient-text">Timeline</span></h1>
        <p className="page-subtitle">Your complete academic event history — alerts, warnings, and milestones</p>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px' }}>🎉</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>All clear!</div>
          <div>No academic events recorded yet. Keep up the great work!</div>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '24px' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: '7px', top: '24px', bottom: '0', width: '2px', background: 'rgba(255,255,255,0.07)' }} />

          {events.map((event, i) => {
            const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
            return (
              <div key={i} className="animate-slideUp" style={{ animationDelay: `${i * 0.06}s`, display: 'flex', gap: '16px', marginBottom: '20px', position: 'relative' }}>
                {/* Dot */}
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: sev.color, flexShrink: 0,
                  marginTop: '18px', marginLeft: '-9px',
                  boxShadow: `0 0 12px ${sev.color}60`,
                  zIndex: 1,
                }} />

                {/* Card */}
                <div style={{
                  flex: 1,
                  background: sev.bg,
                  border: `1px solid ${sev.border}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  transition: 'transform 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{sev.icon}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{event.event}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <span className="risk-badge" style={{ color: sev.color, background: sev.bg, borderColor: sev.border, flexShrink: 0 }}>
                      {sev.label}
                    </span>
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
