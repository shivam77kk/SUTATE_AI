'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Defs, LinearGradient, Stop } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';
import { Slider } from '@/components/ui/Slider';
import { SafeTip, CW } from '@/lib/chart';
import toast from 'react-hot-toast';
import { Target, TrendingUp, Info, CheckCircle2, AlertCircle, Edit3, Save, X } from 'lucide-react';

const AnimatedGauge = ({ current, target }) => {
  const percentage = Math.min((current / 10), 1);
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const halfCircum = circumference / 2;
  const strokeDashoffset = halfCircum - (percentage * halfCircum);

  return (
    <div style={{ position: 'relative', width: 200, height: 120, margin: '0 auto' }}>
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
            <stop offset="0%" stopColor="var(--indigo)" />
            <stop offset="100%" stopColor="var(--violet)" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: 'Space Grotesk' }}
        >
          {current.toFixed(2)}
        </motion.div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Target: {target.toFixed(1)}
        </div>
      </div>
    </div>
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
      toast.success('Strategy updated ✓'); 
    },
    onError: () => toast.error('Failed to update goal'),
  });

  const goal = goalData?.goal;

  return (
    <div className="dashboard-content">
      <PageHeader title="🎯 Academic Goals" subtitle="Visualize your trajectory and optimize your path to excellence" />

      {isLoading ? <CardSkel height={300} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 24 }}>
          {/* Main Goal Card */}
          <div className="chart-container" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <div className="section-header">
                <div className="chart-title" style={{ margin: 0 }}><Target size={16} /> Progress to Target</div>
                <button onClick={() => { setSliderVal(goal?.targetCgpa || 8.0); setIsEditing(!isEditing); }} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                  {isEditing ? <><X size={14} /> Close</> : <><Edit3 size={14} /> Update Target</>}
                </button>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr' : '1fr 1fr', gap: 40, alignItems: 'center', marginTop: 10 }}>
                <div style={{ textAlign: 'center' }}>
                   <AnimatedGauge current={goal?.currentCgpa || 0} target={goal?.targetCgpa || 8.0} />
                   <div style={{ marginTop: -10 }}>
                      <span className={`badge ${goal?.status === 'on_track' ? 'badge-success' : 'badge-warning'}`}>
                        {goal?.status === 'on_track' ? '✓ On Track' : '⚠ Action Recommended'}
                      </span>
                   </div>
                </div>

                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div 
                      key="editing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      style={{ padding: '24px', background: 'var(--bg-hover)', borderRadius: 16, border: '1px solid var(--border-light)' }}
                    >
                       <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Drag to set your new semester CGPA target:</p>
                       <Slider value={sliderVal} onChange={setSliderVal} min={5} max={10} step={0.1} label={`Priority Target: ${sliderVal.toFixed(1)}`} />
                       <button 
                        onClick={() => mutation.mutate(sliderVal)} 
                        disabled={mutation.isPending} 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: 24, height: 48 }}
                       >
                         {mutation.isPending ? <div className="spinner" /> : <><Save size={16} /> Save New Target</>}
                       </button>
                    </motion.div>
                  ) : (
                    <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                       <div className="kpi-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                             <div style={{ color: 'var(--indigo-light)' }}><Info size={20} /></div>
                             <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>AI Strategic Insight</p>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{goal?.projection}</p>
                             </div>
                          </div>
                          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                             <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Next Milestones</p>
                             <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span className="tag tag-info">UT2 Excellence</span>
                                <span className="tag tag-safe">90% Attendance</span>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* History Chart */}
          <CW title="📈 Value Trajectory" height={320}>
            <ResponsiveContainer>
              <AreaChart data={longitudinal?.semesters}>
                <defs>
                  <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--indigo)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="semester" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<SafeTip />} cursor={{ stroke: 'var(--border-light)', strokeWidth: 1 }} />
                <ReferenceLine y={goal?.targetCgpa} stroke="var(--rose-light)" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fill: 'var(--rose-light)', fontSize: 10, fontWeight: 700 }} />
                <Area type="monotone" dataKey="cgpa" stroke="var(--indigo-light)" strokeWidth={3} fillOpacity={1} fill="url(#colorCgpa)" />
              </AreaChart>
            </ResponsiveContainer>
          </CW>
        </div>
      )}

      {longitudinal?.semesters?.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
           <div className="kpi-card kpi-card-indigo">
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Semester Delta</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                 <div className="stat-number">
                    {longitudinal.semesters.length >= 2 
                      ? (longitudinal.semesters[longitudinal.semesters.length-1].cgpa - longitudinal.semesters[longitudinal.semesters.length-2].cgpa).toFixed(2)
                      : '0.00'}
                 </div>
                 <span className="severity-success" style={{ fontSize: 11, fontWeight: 700 }}>+ Improvement</span>
              </div>
           </div>
           
           <div className="kpi-card kpi-card-violet">
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Distance to Goal</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                 <div className="stat-number">
                    {Math.max(0, (goal?.targetCgpa || 8.0) - (goal?.currentCgpa || 0)).toFixed(2)}
                 </div>
                 <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>GPA points left</span>
              </div>
           </div>

           <div className="kpi-card kpi-card-emerald">
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Consistency Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                 <div className="stat-number">94%</div>
                 <span className="tag tag-safe">Stable</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
