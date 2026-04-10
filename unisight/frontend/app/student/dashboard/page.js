'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import { KPICard } from '@/components/shared/KPICard';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel, ChartSkel } from '@/components/ui/Skeleton';
import { Slider } from '@/components/ui/Slider';
import { SafeTip, CHART_PALETTE, CW } from '@/lib/chart';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TIER_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f43f5e', CRITICAL: '#7f1d1d' };
const TIER_BG = { LOW: 'rgba(16,185,129,0.12)', MEDIUM: 'rgba(245,158,11,0.12)', HIGH: 'rgba(244,63,94,0.12)', CRITICAL: 'rgba(127,29,29,0.25)' };
const PRIORITY_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function TierBadge({ tier }) {
  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      style={{
        padding: '2px 10px', 
        borderRadius: 999, 
        fontSize: 10.5, 
        fontWeight: 700,
        textTransform: 'uppercase', 
        letterSpacing: '0.07em',
        background: TIER_BG[tier] || TIER_BG.LOW,
        color: TIER_COLORS[tier] || TIER_COLORS.LOW,
        border: `1px solid ${TIER_COLORS[tier] || TIER_COLORS.LOW}33`,
      }}
    >
      {tier}
    </motion.span>
  );
}

function WhatIfSimulator({ dashboard }) {
  const [extraClasses, setExtraClasses] = useState(0);
  const [extraMarks, setExtraMarks] = useState(0);

  const base = dashboard?.dropoutProbability ?? 50;
  const attendanceImpact = Math.min(extraClasses * 0.8, 20);
  const marksImpact = Math.min(extraMarks * 0.4, 15);
  const newScore = Math.max(0, base - attendanceImpact - marksImpact);
  const getTier = (s) => s >= 81 ? 'CRITICAL' : s >= 61 ? 'HIGH' : s >= 31 ? 'MEDIUM' : 'LOW';
  const newTier = getTier(newScore);
  const changed = extraClasses > 0 || extraMarks > 0;

  return (
    <motion.div 
      variants={itemVariants}
      className="chart-container" 
      style={{ marginTop: 0 }}
      whileHover={{ borderColor: 'rgba(99,102,241,0.2)' }}
    >
      <div className="chart-title">🔮 What-If Simulator</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Slider value={extraClasses} onChange={setExtraClasses} min={0} max={20} label={`Attend ${extraClasses} more classes`} />
        <Slider value={extraMarks} onChange={setExtraMarks} min={0} max={30} label={`Score ${extraMarks} more marks`} />
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          {changed ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                Attend {extraClasses} more classes & score {extraMarks} more marks →
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <TierBadge tier={dashboard?.dropoutTier || 'LOW'} />
                <span style={{ color: '#64748b' }}>→</span>
                <TierBadge tier={newTier} />
              </div>
              <p style={{ color: '#64748b', fontSize: 11, marginTop: 8, fontFamily: 'monospace' }}>
                Risk score: {Math.round(base)} → {Math.round(newScore)}
              </p>
            </motion.div>
          ) : (
            <p style={{ color: '#64748b', fontSize: 13 }}>Adjust the sliders to see your path forward</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GoalArcDisplay({ goal, onSetGoal, currentCgpa }) {
  const [sliderVal, setSliderVal] = useState(currentCgpa || 7.0);
  const [showSlider, setShowSlider] = useState(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (targetCgpa) => api.post('/student/goals', { targetCgpa }),
    onSuccess: () => {
      qc.invalidateQueries(['student-goals']);
      setShowSlider(false);
      toast.success('Goal saved ✓');
    },
    onError: () => toast.error('Failed to save goal'),
  });

  if (!goal || showSlider) {
    return (
      <motion.div variants={itemVariants} className="chart-container text-center" whileHover={{ borderColor: 'rgba(124,58,237,0.2)' }}>
        <div className="chart-title">🎯 CGPA Goal</div>
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Set your semester target CGPA</div>
        <Slider value={sliderVal} onChange={setSliderVal} min={0} max={10} step={0.1} label={`Target: ${sliderVal.toFixed(1)}`} />
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <motion.button 
            onClick={() => mutation.mutate(sliderVal)} 
            disabled={mutation.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2 rounded-lg font-semibold cursor-pointer inline-flex items-center gap-1.5"
            style={{ 
              background: 'linear-gradient(135deg,#6366f1,#7c3aed)', 
              color: 'white', 
              border: 'none',
              minHeight: '44px'
            }}
          >
            {mutation.isPending ? <><span className="spinner" />Saving...</> : 'Set goal'}
          </motion.button>
          {goal && (
            <button 
              onClick={() => setShowSlider(false)} 
              className="px-4 py-2 rounded-lg bg-white/4 border border-white/6 text-sm cursor-pointer"
              style={{ color: '#94a3b8', minHeight: '44px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const pct = Math.min(goal.currentCgpa / 10, 1);
  const r = 70, cx = 100, cy = 90;
  const startAngle = Math.PI, endAngle = 0;
  const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
  const progAngle = startAngle + pct * Math.PI;
  const xp = cx + r * Math.cos(progAngle), yp = cy + r * Math.sin(progAngle);

  return (
    <motion.div variants={itemVariants} className="chart-container text-center" whileHover={{ borderColor: 'rgba(124,58,237,0.2)' }}>
      <div className="chart-title">🎯 CGPA Goal</div>
      <svg viewBox="0 0 200 100" style={{ width: '100%', maxWidth: 240, margin: '0 auto', display: 'block' }}>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} strokeLinecap="round" />
        <motion.path
          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${xp} ${yp}`}
          fill="none" 
          stroke="#7c3aed" 
          strokeWidth={8} 
          strokeLinecap="round"
          initial={{ pathLength: 0 }} 
          animate={{ pathLength: 1 }} 
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 20, fontWeight: 800, fill: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>
          {goal.currentCgpa?.toFixed(2)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}>
          / {goal.targetCgpa?.toFixed(1)}
        </text>
      </svg>
      <motion.span 
        whileHover={{ scale: 1.05 }}
        style={{
          padding: '3px 12px', 
          borderRadius: 999, 
          fontSize: 11, 
          fontWeight: 600,
          background: goal.status === 'on_track' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
          color: goal.status === 'on_track' ? '#10b981' : '#f59e0b',
        }}
      >
        {goal.status === 'on_track' ? '✓ On track' : '⚠ Behind pace'}
      </motion.span>
      {goal.projection && <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 8 }}>{goal.projection}</p>}
      <button 
        onClick={() => setShowSlider(true)} 
        className="text-xs bg-transparent border-none cursor-pointer mt-2"
        style={{ color: '#818cf8', minHeight: '44px' }}
      >
        Change goal
      </button>
    </motion.div>
  );
}

function MoodCard({ onDismiss }) {
  const [moodScore, setMoodScore] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [personalNote, setPersonalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const MOODS = ['😞','😟','😐','🙂','😊'];

  const submit = async () => {
    if (!moodScore || !confidenceScore) return;
    setLoading(true);
    try {
      const { data } = await api.post('/mood', { moodScore, confidenceScore, personalNote: personalNote || undefined });
      if (data.flagged) toast('We\'ve noted this. You\'re not alone. 💙', { icon: '💛' });
      else toast.success('Check-in saved ✓');
      onDismiss();
    } catch { toast.error('Failed to save. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div 
      className="chart-container" 
      initial={{ opacity: 0, y: -12 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ borderLeft: '3px solid #6366f1' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="chart-title">💚 Weekly Check-in</div>
        <button 
          onClick={onDismiss} 
          className="bg-transparent border-none cursor-pointer text-lg flex items-center justify-center"
          style={{ color: '#64748b', minWidth: '44px', minHeight: '44px' }}
        >
          ✕
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>How are you feeling this week?</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {MOODS.map((m, i) => (
          <motion.button
            key={i}
            onClick={() => setMoodScore(i + 1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 text-2xl cursor-pointer transition-all"
            style={{ 
              background: moodScore === i+1 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${moodScore === i+1 ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 10, 
              padding: '8px 4px',
              minHeight: '44px',
            }}
          >
            {m}
          </motion.button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Confidence for exams?</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1,2,3,4,5].map(n => (
          <motion.button
            key={n}
            onClick={() => setConfidenceScore(n)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 font-bold text-sm cursor-pointer transition-all"
            style={{
              background: confidenceScore === n ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${confidenceScore === n ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 10, 
              padding: '8px 4px', 
              color: confidenceScore === n ? '#818cf8' : '#94a3b8',
              minHeight: '44px',
            }}
          >
            {n}
          </motion.button>
        ))}
      </div>
      <textarea 
        value={personalNote} 
        onChange={e => setPersonalNote(e.target.value)} 
        maxLength={200}
        placeholder="Anything personal? (optional)" 
        className="input-field w-full"
        style={{ resize: 'none', height: 60, fontSize: 13, marginBottom: 4 }} 
      />
      <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b', marginBottom: 12, fontFamily: 'monospace' }}>
        {personalNote.length}/200
      </div>
      <motion.button 
        onClick={submit} 
        disabled={!moodScore || !confidenceScore || loading}
        whileHover={{ scale: (!moodScore || !confidenceScore) ? 1 : 1.01 }}
        whileTap={{ scale: (!moodScore || !confidenceScore) ? 1 : 0.99 }}
        className="w-full py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer flex items-center justify-center gap-2"
        style={{
          cursor: (!moodScore || !confidenceScore) ? 'not-allowed' : 'pointer',
          opacity: (!moodScore || !confidenceScore) ? 0.38 : 1,
          background: 'linear-gradient(135deg,#6366f1,#7c3aed)', 
          color: 'white',
          minHeight: '44px',
        }}
      >
        {loading ? <><span className="spinner" />Submitting...</> : 'Submit check-in'}
      </motion.button>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [moodDismissed, setMoodDismissed] = useState(false);
  const [pollDone, setPollDone] = useState(false);
  const [pollRating, setPollRating] = useState(null);

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/student/dashboard').then(r => r.data),
  });

  const { data: moodStatus } = useQuery({
    queryKey: ['mood-status'],
    queryFn: () => api.get('/mood/status').then(r => r.data),
  });

  const { data: activePoll } = useQuery({
    queryKey: ['active-poll'],
    queryFn: () => api.get('/polls/active').then(r => r.data),
  });

  const { data: marksTrend, isLoading: marksLoading } = useQuery({
    queryKey: ['marks-trend'],
    queryFn: () => api.get('/student/marks-trend').then(r => r.data),
  });

  const { data: radar, isLoading: radarLoading } = useQuery({
    queryKey: ['student-radar'],
    queryFn: () => api.get('/student/radar').then(r => r.data),
  });

  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => api.get('/student/attendance').then(r => r.data),
  });

  const { data: activity } = useQuery({
    queryKey: ['student-activity'],
    queryFn: () => api.get('/student/activity').then(r => r.data),
  });

  const { data: goalData } = useQuery({
    queryKey: ['student-goals'],
    queryFn: () => api.get('/student/goals').then(r => r.data),
  });

  const submitPoll = async (rating, pollId) => {
    setPollRating(rating);
    try {
      await api.post(`/polls/${pollId}/respond`, { rating });
      setTimeout(() => setPollDone(true), 300);
    } catch { toast.error('Failed to submit poll response'); }
  };

  const showMood = !moodDismissed && moodStatus?.hasSubmittedThisWeek === false;
  const showPoll = activePoll?.activePoll && !pollDone;

  if (dashLoading) return (
    <div className="dashboard-content">
      <CardSkel height={60} />
      <div className="grid-4" style={{ marginTop: 20 }}>
        {[...Array(4)].map((_, i) => <CardSkel key={i} height={120} />)}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="dashboard-content"
    >
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'} 👋`}
        subtitle={`${user?.department || ''} · Last analysed: ${dashboard?.lastAnalysedAt ? formatDistanceToNow(new Date(dashboard.lastAnalysedAt), { addSuffix: true }) : 'Not yet'}`}
      />

      {/* Mood Check-in */}
      <AnimatePresence>
        {showMood && (
          <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
            <MoodCard onDismiss={() => setMoodDismissed(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Poll */}
      <AnimatePresence>
        {showPoll && (
          <motion.div 
            className="chart-container mb-6"
            style={{ borderLeft: '3px solid #10b981' }}
            initial={{ opacity: 0, y: -12 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="chart-title">📊 Live Poll · {activePoll.activePoll.facultyName}</div>
            <p style={{ fontSize: 14, color: '#f1f5f9', marginBottom: 14 }}>{activePoll.activePoll.question}</p>
            {pollDone ? (
              <div style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>✓ Response recorded!</div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(r => (
                  <motion.button
                    key={r}
                    onClick={() => submitPoll(r, activePoll.activePoll.pollId)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-2.5 rounded-lg font-bold text-base cursor-pointer transition-all"
                    style={{
                      background: pollRating === r ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${pollRating === r ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
                      color: pollRating === r ? '#10b981' : '#94a3b8',
                      minHeight: '44px',
                    }}
                  >
                    {r}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid-4 mb-6">
        <motion.div whileHover={{ y: -4 }}>
          <KPICard label="CGPA" value={dashboard?.cgpa?.toFixed(2)} unit="/10.0" color="indigo" />
        </motion.div>
        <motion.div whileHover={{ y: -4 }}>
          <KPICard label="ATTENDANCE" value={`${dashboard?.avgAttendance ?? '--'}%`} color="emerald" />
        </motion.div>
        <motion.div whileHover={{ y: -4 }}>
          <KPICard 
            label="CLASS RANK" 
            value={dashboard?.classRank ? `#${dashboard.classRank}` : '--'} 
            unit={`/ ${dashboard?.totalStudents || 0}`} 
            color="amber" 
          />
        </motion.div>
        <motion.div whileHover={{ y: -4 }}>
          <KPICard
            label="RISK SCORE"
            value={dashboard?.dropoutProbability ?? '--'}
            unit="/ 100"
            color={dashboard?.dropoutTier === 'CRITICAL' || dashboard?.dropoutTier === 'HIGH' ? 'rose' : 'emerald'}
            badge={dashboard?.dropoutTier && <TierBadge tier={dashboard.dropoutTier} />}
          />
        </motion.div>
      </motion.div>

      {/* Charts row */}
      <motion.div variants={itemVariants} className="grid-2 mb-6">
        {marksLoading ? <ChartSkel /> : (
          <CW title="📈 Marks Trend" height={280}>
            <ResponsiveContainer>
              <LineChart data={marksTrend?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
                <XAxis dataKey="exam" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<SafeTip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {(marksTrend?.subjects || []).map((subj, i) => (
                  <Line 
                    key={subj} 
                    type="monotone" 
                    dataKey={subj} 
                    stroke={CHART_PALETTE[i % CHART_PALETTE.length]} 
                    strokeWidth={2} 
                    dot={false} 
                    animationDuration={1500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CW>
        )}

        {radarLoading ? <ChartSkel height={280} /> : (
          <CW title="🕸️ Subject Radar" height={280}>
            <ResponsiveContainer>
              <RadarChart data={(radar?.data || []).map(s => ({ subject: s.subject, score: s.score }))}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar 
                  name="Score" 
                  dataKey="score" 
                  stroke="#7c3aed" 
                  fill="rgba(124,58,237,0.12)" 
                  fillOpacity={1} 
                />
                <Tooltip content={<SafeTip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CW>
        )}
      </motion.div>

      {/* Risk reason */}
      {dashboard?.riskReason && (
        <motion.div 
          variants={itemVariants}
          className="chart-container mb-6"
          style={{ borderLeft: `3px solid ${TIER_COLORS[dashboard.dropoutTier] || '#64748b'}` }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="text-xl">⚠️</span>
            <div>
              <div className="chart-title mb-1.5">Why am I at {dashboard.dropoutTier} risk?</div>
              <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>{dashboard.riskReason}</p>
              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginTop: 6, display: 'block' }}>
                Last analysed {dashboard.lastAnalysedAt ? formatDistanceToNow(new Date(dashboard.lastAnalysedAt), { addSuffix: true }) : '--'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Attendance bars */}
      {!attLoading && (attendance?.subjects || attendance?.attendance)?.length > 0 && (
        <motion.div variants={itemVariants} className="chart-container mb-6">
          <div className="chart-title">📅 Attendance by Subject</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(attendance.subjects || attendance.attendance || []).map((att, i) => {
              const pct = att.percentage || 0;
              const col = pct >= 80 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e';
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{att.subject}</span>
                    <span style={{ color: col, fontFamily: 'monospace', fontWeight: 600 }}>
                      {att.attended}/{att.total} · {pct}%
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 5, position: 'relative' }}>
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${pct}%` }} 
                      transition={{ duration: 1, delay: i * 0.1 }}
                      style={{ height: '100%', background: col, borderRadius: 999 }} 
                    />
                    <div style={{ position: 'absolute', top: -3, left: '75%', width: 2, height: 11, background: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Row: What-If + Goal */}
      <motion.div variants={itemVariants} className="grid-2 mb-6">
        <WhatIfSimulator dashboard={dashboard} />
        <GoalArcDisplay goal={goalData?.goal} currentCgpa={dashboard?.cgpa} />
      </motion.div>

      {/* Peer benchmark */}
      {dashboard?.peerRank !== undefined && (
        <motion.div variants={itemVariants} className="chart-container mb-6">
          <div className="chart-title">🏆 Peer Benchmarking</div>
          <div style={{ position: 'relative', height: 20, marginBottom: 12 }}>
            <div style={{ position: 'absolute', width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, top: 6 }} />
            <motion.div 
              initial={{ left: '50%' }} 
              animate={{ left: `${100 - (dashboard.peerRank || 50)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              style={{ 
                position: 'absolute', 
                top: 2, 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                background: '#6366f1', 
                boxShadow: '0 0 12px rgba(99,102,241,0.6)', 
                transform: 'translateX(-50%)' 
              }} 
            />
          </div>
          <p style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Top {100 - (dashboard.peerRank || 50)}% of your class</p>
        </motion.div>
      )}

      {/* Recommendations */}
      {dashboard?.recommendations?.length > 0 && (
        <motion.div variants={itemVariants} className="chart-container mb-6">
          <div className="chart-title">💡 AI Recommendations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {dashboard.recommendations.slice(0, 3).map((rec, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[rec.priority] || '#64748b', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 3 }}>{rec.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{rec.description}</div>
                  {rec.resources?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {rec.resources.map((r, j) => (
                        <a 
                          key={j} 
                          href={r.url} 
                          target="_blank" 
                          rel="noopener" 
                          className="text-xs inline-flex items-center gap-1"
                          style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          🔗 {r.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity */}
      {activity && (
        <motion.div variants={itemVariants} className="chart-container mb-6">
          <div className="chart-title">⚡ Activity Score</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Assignment submissions', value: activity.assignmentSubmissionPct, suffix: '%' },
              { label: 'Lab completion', value: activity.labCompletionPct, suffix: '%' },
              { label: 'Participation score', value: activity.participationScore, suffix: '' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: '#94a3b8' }}>{item.label}</span>
                  <span style={{ color: '#f1f5f9', fontFamily: 'monospace', fontWeight: 600 }}>{item.value ?? '--'}{item.suffix}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 4 }}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${item.value || 0}%` }} 
                    transition={{ duration: 1, delay: i * 0.15 }}
                    style={{ height: '100%', background: '#6366f1', borderRadius: 999 }} 
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Scholarship */}
      {dashboard?.scholarshipEligible !== undefined && (
        <motion.div 
          variants={itemVariants}
          className="rounded-xl mb-6 px-5 py-3.5"
          style={{
            background: dashboard.scholarshipEligible ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${dashboard.scholarshipEligible ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}
        >
          <span style={{ fontSize: 13, color: dashboard.scholarshipEligible ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
            {dashboard.scholarshipEligible ? '🎓 Merit Scholarship — You qualify ✓' : `⚠️ ${dashboard.scholarshipMessage || 'You do not currently qualify for merit scholarship.'}`}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
