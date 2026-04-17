'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';

export default function FeedbackPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-feedback'],
    queryFn: () => api.get('/feedback/overview').then(r => r.data).catch(() => ({ feedback: [] })),
  });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  const feedback = data?.feedback || [];

  return (
    <div className="dashboard-content">
      <PageHeader title="💬 Student Feedback" subtitle="Aggregate student difficulty ratings per subject" />
      <div className="grid-2">
        {feedback.map((f, i) => (
          <div key={i} className="chart-container">
            <div className="chart-title">{f.subject}</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{f.totalResponses || 0} responses · Avg rating: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{f.avgRating?.toFixed(1) || '--'}</span></p>
            {/* Difficulty equaliser bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([1,2,3,4,5]).map(r => {
                const count = f.distribution?.[r] || 0;
                const pct = f.totalResponses ? (count / f.totalResponses) * 100 : 0;
                const label = { 1: 'Very Hard', 2: 'Hard', 3: 'Moderate', 4: 'Easy', 5: 'Very Easy' }[r];
                const col = r <= 2 ? '#f43f5e' : r === 3 ? '#f59e0b' : '#10b981';
                return (
                  <div key={r}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: '#94a3b8' }}>{r} · {label}</span>
                      <span style={{ color: col, fontFamily: 'monospace', fontWeight: 600 }}>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 6 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 999, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {f.comments?.length > 0 && (
              <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Selected comments</p>
                {f.comments.slice(0, 3).map((c, j) => <p key={j} style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 6 }}>"{c}"</p>)}
              </div>
            )}
          </div>
        ))}
        {feedback.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><span style={{ fontSize: 32 }}>💬</span><p>No feedback data available yet</p></div>}
      </div>
    </div>
  );
}
