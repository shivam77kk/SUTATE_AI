'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { CardSkel, TableSkel } from '@/components/ui/Skeleton';
import { CW, SafeTip } from '@/lib/chart';
import Link from 'next/link';
import toast from 'react-hot-toast';

function HeatmapGrid({ students, subjects }) {
  if (!students?.length || !subjects?.length) return null;
  const getColor = (pct) => {
    if (pct === null || pct === undefined) return 'rgba(255,255,255,0.04)';
    if (pct >= 75) return 'rgba(16,185,129,0.45)';
    if (pct >= 50) return 'rgba(245,158,11,0.45)';
    return 'rgba(244,63,94,0.45)';
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: '7px 10px', fontSize: 10, color: '#64748b', textAlign: 'left', fontWeight: 700, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>STUDENT</th>
            {subjects.map(s => <th key={s} style={{ padding: '7px 10px', fontSize: 9, color: '#64748b', textAlign: 'center', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {students.slice(0, 30).map((stu, i) => (
            <tr key={i}>
              <td style={{ padding: '5px 10px', fontSize: 12, color: '#f1f5f9', fontWeight: 500, whiteSpace: 'nowrap' }}>
                <Link href={`/faculty/student/${stu.studentId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{stu.name}</Link>
              </td>
              {subjects.map(s => {
                const pct = stu.subjects?.[s];
                return (
                  <td key={s} style={{ padding: 4, textAlign: 'center' }}>
                    <div style={{ width: '100%', minWidth: 40, height: 26, borderRadius: 5, background: getColor(pct), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {pct !== null && pct !== undefined ? `${pct}%` : '--'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PollPanel({ classId }) {
  const [question, setQuestion] = useState('');
  const [launching, setLaunching] = useState(false);

  const { data: pollData } = useQuery({
    queryKey: ['active-poll-faculty', classId],
    queryFn: () => api.get(`/polls/results/${classId}`).then(r => r.data),
    refetchInterval: 5000,
  });

  const launch = async () => {
    if (!question.trim()) return;
    setLaunching(true);
    try {
      await api.post('/polls', { question, classId });
      setQuestion('');
      toast.success('Poll launched ✓');
    } catch { toast.error('Failed to launch poll'); }
    finally { setLaunching(false); }
  };

  const close = async (pollId) => {
    try { await api.post(`/polls/${pollId}/close`); }
    catch { toast.error('Failed to close poll'); }
  };

  const dist = pollData?.distribution || [];

  return (
    <div className="chart-container">
      <div className="chart-title">📊 Live Poll</div>
      <div style={{ marginBottom: 16 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type a poll question..." className="input-field" style={{ marginBottom: 8 }} />
        <button onClick={launch} disabled={!question.trim() || launching} style={{
          width: '100%', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 13, border: 'none',
          background: question.trim() ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.04)',
          color: question.trim() ? 'white' : '#64748b', cursor: question.trim() ? 'pointer' : 'not-allowed', minHeight: 44,
        }}>
          {launching ? <><span className="spinner" />Launching...</> : '🚀 Launch Poll'}
        </button>
      </div>
      {dist.length > 0 && (
        <div style={{ height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={dist}>
              <XAxis dataKey="rating" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<SafeTip />} />
              <Bar dataKey="count" name="Responses" radius={[4, 4, 0, 0]}>
                {dist.map((_, i) => <Cell key={i} fill="#10b981" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function ClassPage() {
  const { id } = useParams();

  const { data: classData, isLoading } = useQuery({
    queryKey: ['class-detail', id],
    queryFn: () => api.get(`/faculty/class/${id}/summary`).then(r => r.data),
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['class-heatmap', id],
    queryFn: () => api.get(`/faculty/class/${id}/heatmap`).then(r => r.data),
  });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  const kpi = classData?.kpi || {};
  const students = classData?.students || [];
  const subjects = heatmapData?.subjects || [];
  const heatmapStudents = heatmapData?.data || [];
  const c = { ...kpi, className: id, avgCgpa: 0, avgAttendance: 0, aiNarrative: classData?.narrative };

  return (
    <div className="dashboard-content">
      <PageHeader
        title={c.className || `Class ${id}`}
        subtitle={`${c.subject || ''} · Sem ${c.semester || ''}`}
        breadcrumb={['Faculty', 'Dashboard', c.className || id]}
      />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="STUDENTS" value={kpi.totalStudents ?? students.length} color="indigo" />
        <KPICard label="CLASS AVG" value={kpi.classAvgScore ?? '--'} unit="/ 160" color="emerald" />
        <KPICard label="AT-RISK" value={kpi.atRiskCount ?? '--'} color="rose" />
        <KPICard label="PASS %" value={kpi.passPercent !== undefined ? `${kpi.passPercent}%` : '--'} color="amber" />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Marks heatmap */}
        <div className="chart-container">
          <div className="chart-title">🔥 Marks Heatmap</div>
          <HeatmapGrid students={heatmapStudents.map(s => ({ ...s, subjects: Object.fromEntries(subjects.map(sub => [sub, s[sub]])) }))} subjects={subjects} />
        </div>
        {/* Poll panel */}
        <PollPanel classId={id} />
      </div>

      {/* AI narrative */}
      {c.aiNarrative && (
        <div className="chart-container" style={{ marginBottom: 24, borderLeft: '3px solid #6366f1' }}>
          <div className="chart-title">🤖 AI Class Summary</div>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, fontStyle: 'italic' }}>{c.aiNarrative}</p>
        </div>
      )}

      {/* At-risk students list */}
      {(classData?.atRiskStudents || []).length > 0 && (
        <div className="chart-container">
          <div className="chart-title">🚨 Needs Immediate Attention</div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Tier</th><th>CGPA</th><th>Attendance</th><th></th></tr></thead>
            <tbody>
              {(classData?.atRiskStudents || []).map((s, i) => {
                const tc = { HIGH: '#f43f5e', CRITICAL: '#dc2626', MEDIUM: '#f59e0b' }[s.riskLevel || s.dropoutTier] || '#f59e0b';
                return (
                  <tr key={i}>
                    <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{s.name}</td>
                    <td><span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: `${tc}18`, color: tc, border: `1px solid ${tc}33` }}>{s.riskLevel || s.dropoutTier}</span></td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{s.avgScore ?? '--'}%</td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{s.avgAttendance ?? '--'}%</td>
                    <td><Link href={`/faculty/student/${s.studentId}`} style={{ color: '#818cf8', fontSize: 12 }}>View profile →</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
