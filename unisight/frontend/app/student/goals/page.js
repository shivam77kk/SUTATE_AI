'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';
import { Slider } from '@/components/ui/Slider';
import { SafeTip, CW } from '@/lib/chart';
import toast from 'react-hot-toast';
import { Target, TrendingUp, Info, Edit3, Save, X, Award, Zap, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AnimatedGauge = ({ current, target }) => {
  const percentage = Math.min((current / 10), 1);
  const radius = 90;
  const stroke = 14;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const halfCircum = circumference / 2;
  const strokeDashoffset = halfCircum - (percentage * halfCircum);
  const isOnTrack = current >= target - 0.5;

  return (
    <div style={{ position: 'relative', width: 200, height: 130, margin: '0 auto' }}>
      <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-180deg)', transformOrigin: 'center' }}>
        <circle
          stroke="rgba(255,255,255,0.06)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${halfCircum} ${circumference}`}
          style={{ strokeDashoffset: 0 }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke="url(#gaugeGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${halfCircum} ${circumference}`}
          initial={{ strokeDashoffset: halfCircum }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isOnTrack ? '#10b981' : '#6366f1'} />
            <stop offset="100%" stopColor={isOnTrack ? '#34d399' : '#8b5cf6'} />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', top: 55, left: 0, right: 0, textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
        >
          {current.toFixed(2)}
        </motion.div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
          out of 10.0
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status, current, target }) => {
  const gap = target - current;
  let color, bg, border, icon, text;
  if (status === 'on_track') {
    color = '#10b981'; bg = 'rgba(16,185,129,0.1)'; border = 'rgba(16,185,129,0.25)';
    icon = <ArrowUpRight size={14} />; text = 'On Track';
  } else if (gap > 2) {
    color = '#f43f5e'; bg = 'rgba(244,63,94,0.1)'; border = 'rgba(244,63,94,0.25)';
    icon = <ArrowDownRight size={14} />; text = 'Needs Focus';
  } else {
    color = '#f59e0b'; bg = 'rgba(245,158,11,0.1)'; border = 'rgba(245,158,11,0.25)';
    icon = <Zap size={14} />; text = 'Action Recommended';
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: bg, border: `1px solid ${border}`, color, fontSize: 12, fontWeight: 700, letterSpacing: '0.03em' }}
    >
      {icon} {text}
    </motion.div>
  );
};

export default function GoalsPage() {
  const [sliderVal, setSliderVal] = useState(8.0);
  const [isEditing, setIsEditing] = useState(false);
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
    onSuccess: () => { 
      qc.invalidateQueries(['student-goals']); 
      setIsEditing(false); 
      toast.success('Target updated successfully'); 
    },
    onError: () => toast.error('Failed to update goal'),
  });

  const goal = goalData?.goal;
  const currentCgpa = goal?.currentCgpa || 0;
  const targetCgpa = goal?.targetCgpa || 8.0;
  const gap = Math.max(0, targetCgpa - currentCgpa);
  const progressPct = targetCgpa > 0 ? Math.min(100, (currentCgpa / targetCgpa) * 100) : 0;

  const semesters = longitudinal?.semesters || longitudinal?.trend || [];
  const hasTrend = semesters.length > 1;
  const semDelta = hasTrend 
    ? (semesters[semesters.length - 1].cgpa - semesters[semesters.length - 2].cgpa) 
    : 0;

  return (
    <div className="dashboard-content">
      <PageHeader title="🎯 Academic Goals" subtitle="Track your progress and set strategic targets for academic excellence" />

      {isLoading ? <CardSkel height={300} /> : (
        <>
          {/* Top KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <motion.div className="kpi-card kpi-card-indigo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={16} color="#818cf8" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current CGPA</span>
              </div>
              <div className="stat-number" style={{ fontSize: 28 }}>{currentCgpa.toFixed(2)}</div>
            </motion.div>

            <motion.div className="kpi-card kpi-card-violet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={16} color="#a78bfa" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target CGPA</span>
              </div>
              <div className="stat-number" style={{ fontSize: 28 }}>{targetCgpa.toFixed(1)}</div>
            </motion.div>

            <motion.div className="kpi-card kpi-card-amber" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="#fbbf24" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gap to Target</span>
              </div>
              <div className="stat-number" style={{ fontSize: 28, color: gap > 1.5 ? '#fb7185' : gap > 0.5 ? '#fbbf24' : '#34d399' }}>{gap.toFixed(2)}</div>
            </motion.div>

            <motion.div className="kpi-card kpi-card-emerald" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#34d399" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sem Delta</span>
              </div>
              <div className="stat-number" style={{ fontSize: 28, color: semDelta >= 0 ? '#34d399' : '#fb7185' }}>
                {semDelta >= 0 ? '+' : ''}{semDelta.toFixed(2)}
              </div>
            </motion.div>
          </div>

          {/* Main Content Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Progress Card */}
            <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
              <div className="section-header" style={{ marginBottom: 16 }}>
                <div className="chart-title" style={{ margin: 0 }}><Target size={16} /> Progress to Target</div>
                <button onClick={() => { setSliderVal(targetCgpa); setIsEditing(!isEditing); }} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>
                  {isEditing ? <><X size={14} /> Close</> : <><Edit3 size={14} /> Update Target</>}
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <AnimatedGauge current={currentCgpa} target={targetCgpa} />
                
                {/* Progress bar */}
                <div style={{ width: '100%', maxWidth: 260, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Progress</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: 6 }}>
                    <motion.div
                      className="progress-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      style={{ background: `linear-gradient(90deg, #6366f1, ${progressPct >= 80 ? '#10b981' : '#8b5cf6'})` }}
                    />
                  </div>
                </div>

                <StatusBadge status={goal?.status} current={currentCgpa} target={targetCgpa} />
              </div>

              {/* Edit Mode */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Set your semester CGPA target:</p>
                    <Slider value={sliderVal} onChange={setSliderVal} min={5} max={10} step={0.1} label={`Target: ${sliderVal.toFixed(1)}`} />
                    <button 
                      onClick={() => mutation.mutate(sliderVal)} 
                      disabled={mutation.isPending} 
                      className="btn-primary" 
                      style={{ width: '100%', marginTop: 16, height: 44 }}
                    >
                      {mutation.isPending ? <div className="spinner" /> : <><Save size={16} /> Save Target</>}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* AI Insight + Trajectory */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* AI Insight Card */}
              <div className="chart-container" style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(99,102,241,0.2)' }}>
                    <Info size={18} color="#818cf8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>AI Strategic Insight</p>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{goal?.projection || 'Set a target to receive personalized insights.'}</p>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: 8, alignSelf: 'center' }}>Milestones</span>
                  <span className="tag tag-info">UT2 Excellence</span>
                  <span className="tag tag-safe">90% Attendance</span>
                  {gap > 1 && <span className="tag tag-warning">Focus Core Subjects</span>}
                </div>
              </div>

              {/* Trajectory Chart */}
              <div className="chart-container" style={{ flex: 1, padding: 24 }}>
                <div className="chart-title"><TrendingUp size={16} /> CGPA Trajectory</div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer>
                    <AreaChart data={semesters}>
                      <defs>
                        <linearGradient id="colorCgpa2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="semester" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<SafeTip />} />
                      <ReferenceLine y={targetCgpa} stroke="#fb7185" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fill: '#fb7185', fontSize: 10, fontWeight: 700 }} />
                      <Area type="monotone" dataKey="cgpa" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCgpa2)" dot={{ fill: '#6366f1', stroke: '#1e1b4b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Required Actions Card */}
          {goal?.requiredActions && (
            <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ padding: 24 }}>
              <div className="chart-title"><Award size={16} /> Recommended Actions</div>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{goal.requiredActions}</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
