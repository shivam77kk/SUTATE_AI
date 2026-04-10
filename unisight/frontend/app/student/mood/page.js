'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { SafeTip } from '@/lib/chart';
import { CardSkel } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const MOODS = [
  { emoji: '😞', label: 'Very Bad', value: 1, color: '#f43f5e' },
  { emoji: '😟', label: 'Bad', value: 2, color: '#f59e0b' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#64748b' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#10b981' },
  { emoji: '😊', label: 'Great', value: 5, color: '#6366f1' },
];

export default function MoodPage() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mood-history'],
    queryFn: () => api.get('/mood/history').then(r => r.data),
  });

  const history = data?.history || [];
  const avgMood = data?.avgMood || 0;
  const streak = data?.streak || 0;

  const submitMood = async () => {
    if (!selectedMood) return;
    setSubmitting(true);
    try {
      await api.post('/mood', { moodScore: selectedMood, note });
      toast.success('Mood logged successfully!');
      setSelectedMood(null);
      setNote('');
      refetch();
    } catch (err) {
      toast.error('Failed to log mood');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMoodData = MOODS.find(m => m.value === selectedMood);

  return (
    <div className="dashboard-content">
      <PageHeader 
        title="💚 Mood Tracker" 
        subtitle="Track your daily mood and see patterns over time"
      />

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="kpi-card kpi-card-indigo">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Average Mood
          </div>
          <div className="stat-number" style={{ color: '#818cf8' }}>
            {avgMood > 0 ? avgMood.toFixed(1) : '--'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            out of 5.0
          </div>
        </div>

        <div className="kpi-card kpi-card-emerald">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Current Streak
          </div>
          <div className="stat-number" style={{ color: '#34d399' }}>
            {streak}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            days in a row
          </div>
        </div>

        <div className="kpi-card kpi-card-violet">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Total Entries
          </div>
          <div className="stat-number" style={{ color: '#a78bfa' }}>
            {history.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            mood logs
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Log Mood */}
        <div className="chart-container">
          <div className="chart-title">Log Today's Mood</div>
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'space-between' }}>
            {MOODS.map(mood => (
              <motion.button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: 14,
                  fontSize: 32,
                  background: selectedMood === mood.value 
                    ? `${mood.color}18` 
                    : 'rgba(255,255,255,0.03)',
                  border: selectedMood === mood.value 
                    ? `2px solid ${mood.color}` 
                    : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {mood.emoji}
                {selectedMood === mood.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      fontSize: 9,
                      fontWeight: 700,
                      color: mood.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {mood.label}
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selectedMood && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="How are you feeling? (optional)"
                  className="input-field"
                  style={{ 
                    resize: 'none', 
                    height: 80, 
                    marginBottom: 14,
                    borderColor: selectedMoodData?.color + '40',
                  }}
                  maxLength={200}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setSelectedMood(null); setNote(''); }}
                    className="btn-ghost"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitMood}
                    disabled={submitting}
                    className="btn-primary"
                    style={{ 
                      flex: 2,
                      background: `linear-gradient(135deg, ${selectedMoodData?.color}, ${selectedMoodData?.color}cc)`,
                    }}
                  >
                    {submitting ? <><span className="spinner" />Logging...</> : 'Log Mood'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mood Trend */}
        <div className="chart-container">
          <div className="chart-title">Mood Trend (Last 7 Days)</div>
          {isLoading ? (
            <CardSkel height={200} />
          ) : history.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p style={{ fontSize: 13 }}>No mood data yet. Start logging!</p>
            </div>
          ) : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={history.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                  />
                  <Tooltip content={<SafeTip />} />
                  <Line 
                    type="monotone" 
                    dataKey="moodScore" 
                    name="Mood"
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      {history.length > 0 && (
        <div className="chart-container" style={{ marginTop: 24 }}>
          <div className="chart-title">Recent Entries</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.slice(0, 5).map((entry, i) => {
              const moodData = MOODS.find(m => m.value === entry.moodScore);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 10,
                    borderLeft: `3px solid ${moodData?.color || '#64748b'}`,
                  }}
                >
                  <div style={{ fontSize: 28 }}>{moodData?.emoji || '😐'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {moodData?.label || 'Unknown'}
                    </div>
                    {entry.note && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{entry.note}"
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
