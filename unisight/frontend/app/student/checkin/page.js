'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

// Check-in is a standalone 3-step page WITHOUT sidebar
const MOODS = ['😞', '😟', '😐', '🙂', '😊'];
const CONFIDENCE = [1, 2, 3, 4, 5];

export default function CheckinPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [moodScore, setMoodScore] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [personalNote, setPersonalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/mood', { moodScore, confidenceScore, personalNote: personalNote || undefined });
      setFlagged(data.flagged || false);
      setStep(3);
    } catch {
      toast.error('Failed to submit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const dashboard = user?.role === 'student' ? '/student/dashboard' : '/faculty/dashboard';

  return (
    <div style={{
      minHeight: '100vh', background: '#030306', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: 'white', marginBottom: 6 }}>
            💚 Weekly Check-in
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Takes 30 seconds · Helps SUTATE support you better</p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s < step ? 24 : 8, height: 8, borderRadius: 999, transition: 'all 0.3s',
              background: s <= step ? '#6366f1' : 'rgba(255,255,255,0.08)',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div style={{ background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28 }}>
                <p style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', marginBottom: 8 }}>How are you feeling today?</p>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 22 }}>Be honest — your check-in is private and helps your faculty support you.</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  {MOODS.map((emoji, i) => (
                    <button key={i} onClick={() => setMoodScore(i + 1)} style={{
                      flex: 1, fontSize: 28, padding: '10px 4px',
                      background: moodScore === i + 1 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${moodScore === i + 1 ? '#6366f1' : 'transparent'}`,
                      borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', minHeight: 60,
                    }}>{emoji}</button>
                  ))}
                </div>
                <button onClick={() => moodScore && setStep(2)} disabled={!moodScore} style={{
                  width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
                  background: moodScore ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,0.04)',
                  color: moodScore ? 'white' : '#64748b', cursor: moodScore ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s', minHeight: 48,
                }}>Continue →</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div style={{ background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28 }}>
                <p style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', marginBottom: 8 }}>How confident are you about exams?</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  {CONFIDENCE.map(n => (
                    <button key={n} onClick={() => setConfidenceScore(n)} style={{
                      flex: 1, fontWeight: 700, fontSize: 18, padding: '12px 4px',
                      background: confidenceScore === n ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${confidenceScore === n ? '#6366f1' : 'transparent'}`,
                      borderRadius: 12, cursor: 'pointer', color: confidenceScore === n ? '#818cf8' : '#94a3b8',
                      transition: 'all 0.2s', minHeight: 60,
                    }}>{n}</button>
                  ))}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>ANYTHING ON YOUR MIND? (OPTIONAL)</label>
                  <textarea value={personalNote} onChange={e => setPersonalNote(e.target.value)} maxLength={200}
                    placeholder="Feeling stressed? Got good news? Share briefly..." className="input-field"
                    style={{ resize: 'none', height: 80 }} />
                  <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: 'monospace' }}>{personalNote.length}/200</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', minHeight: 44 }}>← Back</button>
                  <button onClick={submit} disabled={!confidenceScore || loading} style={{
                    flex: 1, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
                    background: confidenceScore ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,0.04)',
                    color: confidenceScore ? 'white' : '#64748b', cursor: confidenceScore ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
                  }}>
                    {loading ? <><span className="spinner" />Submitting...</> : 'Submit check-in'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ background: '#0d0d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
                {flagged ? (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💛</div>
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: '#f1f5f9', marginBottom: 10 }}>We hear you</h3>
                    <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                      Your faculty advisor has been notified. You are not alone — SUTATE AI is here to support you through this.
                    </p>
                  </>
                ) : (
                  <>
                    <motion.svg width={80} height={80} viewBox="0 0 80 80" style={{ margin: '0 auto 16px' }}>
                      <circle cx="40" cy="40" r="36" fill="rgba(16,185,129,0.08)" stroke="#10b981" strokeWidth="1.5" />
                      <motion.path d="M25 40 L33 48 L55 28" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                    </motion.svg>
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: '#f1f5f9', marginBottom: 10 }}>Check-in complete!</h3>
                    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Thanks! See you next week. Keep it up 🌟</p>
                  </>
                )}
                <button onClick={() => router.push(dashboard)} style={{
                  padding: '12px 32px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
                  background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: 'white', cursor: 'pointer', minHeight: 48,
                }}>Back to Dashboard →</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
