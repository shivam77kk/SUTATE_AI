'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';
import { Slider } from '@/components/ui/Slider';
import toast from 'react-hot-toast';

export default function StudyPlanPage() {
  const [step, setStep] = useState(1); // 1=form, 2=plan
  const [rows, setRows] = useState([]);
  const [plan, setPlan] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'calendar'

  const { data: marksTrend, isLoading } = useQuery({
    queryKey: ['marks-trend'],
    queryFn: () => api.get('/student/marks-trend').then(r => r.data),
  });

  // Initialise rows from subjects when data loads
  useEffect(() => {
    if (marksTrend?.subjects?.length && rows.length === 0) {
      setRows(marksTrend.subjects.map(s => ({ subject: s, examDate: '', hoursPerDay: 2 })));
    }
  }, [marksTrend]);

  const mutation = useMutation({
    mutationFn: () => api.post('/student/study-plan', { subjects: rows }),
    onSuccess: ({ data }) => { setPlan(data); setStep(2); },
    onError: () => toast.error('AI couldn\'t generate plan. Try again.'),
  });

  const updateRow = (i, field, val) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  if (isLoading) return <div className="dashboard-content"><CardSkel height={400} /></div>;

  const subjects = marksTrend?.subjects || [];
  const initedRows = rows.length === 0 && subjects.length > 0
    ? subjects.map(s => ({ subject: s, examDate: '', hoursPerDay: 2 }))
    : rows;

  return (
    <div className="dashboard-content">
      <PageHeader title="📖 AI Study Plan" subtitle="Build a personalised study schedule based on your exam dates" />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="chart-container">
              <div className="chart-title">Configure your study plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {(initedRows.length > 0 ? initedRows : subjects.map(s => ({ subject: s, examDate: '', hoursPerDay: 2 }))).map((row, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 18px' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', marginBottom: 14 }}>{row.subject}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>EXAM DATE</label>
                        <input type="text" value={row.examDate}
                          onChange={e => { const newRows = [...initedRows]; newRows[i] = { ...newRows[i], examDate: e.target.value }; setRows(newRows); }}
                          placeholder="e.g. 15 Apr 2025" className="input-field" />
                      </div>
                      <div>
                        <Slider value={row.hoursPerDay}
                          onChange={val => { const newRows = [...initedRows]; newRows[i] = { ...newRows[i], hoursPerDay: val }; setRows(newRows); }}
                          min={1} max={8} step={0.5} label={`${row.hoursPerDay} hrs/day`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{
                marginTop: 24, width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: 'white',
                cursor: mutation.isPending ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
              }}>
                {mutation.isPending ? (
                  <><span className="spinner" />Building your personalised plan...
                    {[0,1,2].map(i => <motion.span key={i} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}>.</motion.span>)}
                  </>
                ) : 'Build my study plan →'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="plan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {['list', 'calendar'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: view === v ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${view === v ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                  color: view === v ? '#818cf8' : '#64748b', cursor: 'pointer', minHeight: 44,
                }}>{v === 'list' ? '📋 List View' : '📅 Calendar View'}</button>
              ))}
              <button onClick={() => setStep(1)} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#64748b', cursor: 'pointer', minHeight: 44, fontSize: 13 }}>
                ← Edit plan
              </button>
              <button onClick={() => window.print()} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#64748b', cursor: 'pointer', minHeight: 44, fontSize: 13 }}>
                🖨️ Print
              </button>
            </div>

            {plan?.plan?.map((week, wi) => (
              <div key={wi} className="chart-container" style={{ marginBottom: 16 }}>
                <div className="chart-title">Week {week.week} · {week.startDate} – {week.endDate}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {week.tasks?.map((task, ti) => (
                    <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', width: 70, flexShrink: 0 }}>{task.day}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>{task.subject}</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#f1f5f9' }}>{task.topic}</span>
                      <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>{task.duration} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
