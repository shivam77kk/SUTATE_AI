'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import { CardSkel } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import toast from 'react-hot-toast';

const LEVELS = { none: 0, badge1: 1, badge2: 2, badge3: 3 };

function AchievementBadge({ label, earned, icon }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: earned ? 1 : 0.25, filter: earned ? 'none' : 'grayscale(1)',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: earned ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${earned ? '#6366f1' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        {icon}
      </div>
      <span style={{ fontSize: 9, color: earned ? '#818cf8' : '#64748b', fontWeight: 600, textAlign: 'center', maxWidth: 60 }}>{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('profile');
  const TABS = ['profile', 'achievements', 'parent'];

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/student/me').then(r => r.data),
  });

  const { data: achievements } = useQuery({
    queryKey: ['student-achievements'],
    queryFn: () => api.get('/student/achievements').then(r => r.data),
  });

  const downloadPDF = async () => {
    try {
      const res = await api.get('/student/report-pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `SUTATE_Report_${user?.name}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download report'); }
  };

  const parentMutation = useMutation({
    mutationFn: (data) => api.post('/student/parent-contact', data),
    onSuccess: () => toast.success('Parent contact updated ✓'),
    onError: () => toast.error('Failed to update parent contact'),
  });

  const [parentForm, setParentForm] = useState({ parentName: '', parentEmail: '', parentPhone: '' });

  if (isLoading) return <div className="dashboard-content"><CardSkel height={300} /></div>;

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: '#f1f5f9' }}>{user?.name}</h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {user?.studentId && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{user.studentId}</span>}
              {profile?.department && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 11 }}>{profile.department}</span>}
              {profile?.semester && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 11 }}>Sem {profile.semester}</span>}
            </div>
          </div>
        </div>
        <button onClick={downloadPDF} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, minHeight: 44 }}>
          📄 Download PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-container" style={{ marginBottom: 24 }}>
        {TABS.map(t => <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize', minHeight: 44 }}>{t}</button>)}
      </div>

      {tab === 'profile' && profile && (
        <div className="grid-2">
          <div className="chart-container">
            <div className="chart-title">Academic Stats</div>
            {[
              ['CGPA', profile.cgpa?.toFixed(2), '#6366f1'],
              ['Risk Score', `${profile.dropoutProbability ?? '--'}%`, profile.dropoutTier === 'LOW' ? '#10b981' : '#f43f5e'],
              ['Attendance', `${profile.avgAttendance ?? '--'}%`, '#10b981'],
              ['Class Rank', profile.classRank ? `#${profile.classRank}` : '--', '#f59e0b'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'monospace' }}>{val}</span>
              </div>
            ))}
          </div>
          <div className="chart-container">
            <div className="chart-title">Subject Performance</div>
            {profile.subjects?.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{s.subject}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: s.percentage >= 75 ? '#10b981' : s.percentage >= 50 ? '#f59e0b' : '#f43f5e' }}>{s.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="chart-container">
          <div className="chart-title">🏅 Achievements</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Attendance Hero', icon: '📅', earned: (profile?.avgAttendance || 0) >= 90 },
              { label: 'Top 10%', icon: '🏆', earned: (profile?.classRank || 999) <= (profile?.totalStudents || 999) * 0.1 },
              { label: 'Study Streak', icon: '🔥', earned: achievements?.streak >= 7 },
              { label: 'Goal Crusher', icon: '🎯', earned: achievements?.goalsMet > 0 },
              { label: 'Quiz Ace', icon: '🧠', earned: achievements?.quizzesCompleted >= 10 },
              { label: 'On Track', icon: '✅', earned: profile?.dropoutTier === 'LOW' },
            ].map((a, i) => <AchievementBadge key={i} {...a} />)}
          </div>
        </div>
      )}

      {tab === 'parent' && (
        <div className="chart-container">
          <div className="chart-title">👨‍👩‍👧 Parent / Guardian Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {[
              { field: 'parentName', label: 'PARENT NAME', placeholder: 'Full name' },
              { field: 'parentEmail', label: 'PARENT EMAIL', type: 'email', placeholder: 'parent@email.com' },
              { field: 'parentPhone', label: 'PHONE NUMBER', placeholder: '+91 XXXXX XXXXX' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.07em' }}>{label}</label>
                <input type={type || 'text'} value={parentForm[field]} placeholder={placeholder}
                  onChange={e => setParentForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="input-field" />
              </div>
            ))}
          </div>
          <button onClick={() => parentMutation.mutate(parentForm)} disabled={parentMutation.isPending} style={{
            padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', border: 'none',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, minHeight: 44,
          }}>
            {parentMutation.isPending ? <><span className="spinner" />Saving...</> : 'Save contact'}
          </button>
        </div>
      )}
    </div>
  );
}
