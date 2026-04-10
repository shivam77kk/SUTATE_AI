'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';

const getColor = (score) => {
  if (score >= 75) return '#f43f5e';
  if (score >= 50) return '#f59e0b';
  return '#10b981';
};

const Ring = ({ score, size = 64 }) => {
  const c = getColor(score);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={c} strokeWidth="5"
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        transform="rotate(-90 28 28)" />
      <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill={c}>{score}</text>
    </svg>
  );
};

export default function AdminInterventionScores() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-intervention-scores'],
    queryFn: () => api.get('/admin/intervention-scores').then(r => r.data),
  });

  const students = data?.students || [];

  return (
    <div className="dashboard-content">
      <div className="page-header animate-fadeIn">
        <h1 className="page-title">🎯 Intervention <span className="gradient-text-rose">Priority Score</span></h1>
        <p className="page-subtitle">AI-computed urgency scores — act on the highest-scored students first. Score 0–100 (higher = needs help now)</p>
      </div>

      <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '22px' }}>💡</span>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--text-primary)' }}>USP Feature:</strong> Intervention Score = weighted combination of risk level, attendance below 75%, and marks below passing threshold. Students above 75 need immediate faculty contact.
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '14px' }} />)}
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state"><span style={{ fontSize: '40px' }}>✅</span><span>No students require urgent intervention right now</span></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {students.map((s, i) => {
            const sc = s.interventionScore || 0;
            const c = getColor(sc);
            return (
              <div key={s.studentId} className="animate-slideUp" style={{ animationDelay: `${i * 0.03}s`, background: 'var(--bg-card)', border: `1px solid rgba(255,255,255,0.05)`, borderLeft: `4px solid ${c}`, borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Rank */}
                <div style={{ width: '32px', textAlign: 'center', fontWeight: '800', fontSize: '16px', color: 'var(--text-faint)', flexShrink: 0 }}>
                  #{i + 1}
                </div>

                {/* Ring */}
                <Ring score={sc} size={56} />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>{s.name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-faint)' }}>{s.studentId}</span>
                    <span className={`risk-badge risk-${s.riskLevel?.toLowerCase()}`}>{s.riskLevel}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>{s.department}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                    {s.riskReason}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>📊 Avg Score: <strong style={{ color: s.avgScore < 40 ? '#f43f5e' : 'var(--text-secondary)' }}>{s.avgScore}%</strong></span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>📅 Attendance: <strong style={{ color: s.avgAttendance < 75 ? '#f59e0b' : 'var(--text-secondary)' }}>{s.avgAttendance}%</strong></span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>❌ Fail count: <strong style={{ color: s.failCount > 0 ? '#f43f5e' : 'var(--text-secondary)' }}>{s.failCount} subjects</strong></span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>⚠️ Low att: <strong style={{ color: s.lowAttCount > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>{s.lowAttCount} subjects</strong></span>
                  </div>
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0 }}>
                  <Link href={`/faculty/student/${s.studentId}`} style={{ padding: '9px 16px', background: `${c}18`, border: `1px solid ${c}30`, borderRadius: '10px', color: c, fontSize: '12px', fontWeight: '700', textDecoration: 'none', transition: 'all 0.2s' }}>
                    View Profile →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
