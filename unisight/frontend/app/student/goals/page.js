'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';
import { Slider } from '@/components/ui/Slider';
import { SafeTip, CW } from '@/lib/chart';
import toast from 'react-hot-toast';

export default function GoalsPage() {
  const [sliderVal, setSliderVal] = useState(7.0);
  const [showSlider, setShowSlider] = useState(false);
  const qc = useQueryClient();

  const { data: goalData, isLoading } = useQuery({
    queryKey: ['student-goals'],
    queryFn: () => api.get('/student/goals').then(r => r.data),
  });

  const { data: longitudinal } = useQuery({
    queryKey: ['student-longitudinal'],
    queryFn: () => api.get('/student/longitudinal').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (targetCgpa) => api.post('/student/goals', { targetCgpa }),
    onSuccess: () => { qc.invalidateQueries(['student-goals']); setShowSlider(false); toast.success('Goal saved ✓'); },
    onError: () => toast.error('Failed to save goal'),
  });

  const goal = goalData?.goal;
  const pct = goal ? Math.min((goal.currentCgpa || 0) / 10, 1) : 0;

  return (
    <div className="dashboard-content">
      <PageHeader title="🎯 My CGPA Goals" subtitle="Set and track your semester CGPA targets" />

      {isLoading ? <CardSkel height={280} /> : (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Goal Arc */}
          <div className="chart-container" style={{ textAlign: 'center' }}>
            <div className="chart-title">Current Target</div>
            {!goal || showSlider ? (
              <div>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{goal ? 'Update your target' : 'Set your semester target CGPA'}</p>
                <Slider value={sliderVal} onChange={setSliderVal} min={0} max={10} step={0.1} label={`Target: ${sliderVal.toFixed(1)}`} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                  <button onClick={() => mutation.mutate(sliderVal)} disabled={mutation.isPending} style={{
                    padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: 'white',
                    border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, minHeight: 44,
                  }}>
                    {mutation.isPending ? <><span className="spinner" />Saving...</> : 'Set goal'}
                  </button>
                  {goal && <button onClick={() => setShowSlider(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer', minHeight: 44 }}>Cancel</button>}
                </div>
              </div>
            ) : (
              <div>
                <svg viewBox="0 0 200 100" style={{ width: '100%', maxWidth: 220, margin: '0 auto', display: 'block' }}>
                  <path d="M 30 90 A 70 70 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} strokeLinecap="round" />
                  <motion.path
                    d={`M 30 90 A 70 70 0 ${pct > 0.5 ? 1 : 0} 1 ${30 + pct * 140} ${90 - Math.sin(pct * Math.PI) * 70}`}
                    fill="none" stroke="#7c3aed" strokeWidth={8} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                  <text x="100" y="75" textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {goal.currentCgpa?.toFixed(2)}
                  </text>
                  <text x="100" y="92" textAnchor="middle" style={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}>
                    / {goal.targetCgpa?.toFixed(1)} target
                  </text>
                </svg>
                <div style={{ marginTop: 10 }}>
                  <span style={{
                    padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: goal.status === 'on_track' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    color: goal.status === 'on_track' ? '#10b981' : '#f59e0b',
                  }}>
                    {goal.status === 'on_track' ? '✓ On track' : '⚠ Behind pace'}
                  </span>
                  {goal.projection && <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 10 }}>{goal.projection}</p>}
                  <button onClick={() => { setSliderVal(goal.targetCgpa || 7); setShowSlider(true); }} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', marginTop: 10, display: 'block', margin: '10px auto', minHeight: 44 }}>
                    Change goal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CGPA history - shown below if we have longitudinal data, otherwise placeholder */}
          {longitudinal?.semesters?.length > 0 ? (
            <CW title="📈 CGPA History" height={280}>
              <ResponsiveContainer>
                <LineChart data={longitudinal.semesters}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
                  <XAxis dataKey="semester" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<SafeTip />} />
                  <Line type="monotone" dataKey="cgpa" name="CGPA" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CW>
          ) : (
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
              <p style={{ color: '#64748b', fontSize: 13 }}>CGPA history will appear after data is uploaded</p>
            </div>
          )}
        </div>
      )}

      {longitudinal?.semesters?.length > 0 && goal && (
        <CW title="📈 CGPA History vs Goal" height={220}>
          <ResponsiveContainer>
            <LineChart data={longitudinal.semesters}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
              <XAxis dataKey="semester" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<SafeTip />} />
              <ReferenceLine y={goal.targetCgpa} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: 'Your target', position: 'right', fontSize: 10, fill: '#64748b' }} />
              <Line type="monotone" dataKey="cgpa" name="CGPA" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CW>
      )}
    </div>
  );
}
