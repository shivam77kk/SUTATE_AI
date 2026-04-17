'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

function QuizGame({ subject, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [state, setState] = useState('quiz');

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setChecked(false);
    setCorrect(0);
    setState('quiz');
    try {
      const { data } = await api.post('/student/quiz/generate', { subject });
      const qs = typeof data.reply === 'string' ? JSON.parse(data.reply) : data.reply;
      
      if (Array.isArray(qs) && qs.length > 0) {
        setQuestions(qs);
      } else {
        throw new Error('No questions received');
      }
    } catch (err) { 
      console.error('Quiz generation error:', err);
      const msg = err?.response?.data?.error || err.message || 'Failed to generate questions';
      setError(msg);
      toast.error(msg); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQuestions();
  }, [subject]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <span className="spinner" style={{ margin: '0 auto', display: 'block' }} />
      <p style={{ marginTop: 16, color: '#64748b' }}>Generating questions...</p>
    </div>
  );

  if (error || questions.length === 0) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>😕</p>
      <p style={{ color: '#f43f5e', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
        {error || 'Could not generate questions'}
      </p>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
        This can happen due to AI service limits. Please try again.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={fetchQuestions} style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>
          🔄 Try Again
        </button>
        <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', minHeight: 44 }}>
          ← Back
        </button>
      </div>
    </div>
  );

  const totalQ = questions.length;

  if (state === 'results') {
    const pct = correct / totalQ;
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <svg width={100} height={100} viewBox="0 0 100 100" style={{ margin: '0 auto 20px' }}>
          <circle cx={50} cy={50} r={40} fill="rgba(99,102,241,0.08)" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
          <motion.circle cx={50} cy={50} r={40} fill="none" stroke={pct >= 0.8 ? '#10b981' : pct >= 0.4 ? '#f59e0b' : '#f43f5e'} strokeWidth={6} strokeLinecap="round"
            strokeDasharray={251} initial={{ strokeDashoffset: 251 }} animate={{ strokeDashoffset: 251 - 251 * pct }} transition={{ duration: 1.2 }} transform="rotate(-90 50 50)" />
          <text x="50" y="54" textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: 'white', fontFamily: "'Space Grotesk',sans-serif" }}>{correct}/{totalQ}</text>
        </svg>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          {pct >= 0.8 ? '🎉 Excellent!' : pct >= 0.4 ? '👍 Good effort!' : '💪 Keep practicing!'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={fetchQuestions} style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>
            🔄 New Questions
          </button>
          <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>Back to subjects</button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  const handleNext = () => {
    if (selected === q.correctIndex) setCorrect(c => c + 1);
    setChecked(true);
  };
  const goNext = () => {
    if (current < totalQ - 1) { setCurrent(c => c + 1); setSelected(null); setChecked(false); }
    else setState('results');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {Array.from({ length: totalQ }, (_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < current ? '#10b981' : i === current ? '#6366f1' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6, textAlign: 'right' }}>Question {current + 1} of {totalQ}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 20, lineHeight: 1.5 }}>{q.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {q.options?.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.06)', col = '#94a3b8';
          if (checked) {
            if (i === q.correctIndex) { bg = 'rgba(16,185,129,0.12)'; border = '#10b981'; col = '#10b981'; }
            else if (i === selected) { bg = 'rgba(244,63,94,0.12)'; border = '#f43f5e'; col = '#fb7185'; }
          } else if (selected === i) { bg = 'rgba(99,102,241,0.12)'; border = '#6366f1'; col = '#818cf8'; }
          return (
            <button key={i} onClick={() => !checked && setSelected(i)} style={{
              width: '100%', padding: '12px 16px', borderRadius: 10, textAlign: 'left', fontSize: 14,
              background: bg, border: `1px solid ${border}`, color: col, cursor: checked ? 'default' : 'pointer', minHeight: 44,
            }}>{opt}</button>
          );
        })}
      </div>
      {checked && q.explanation && (
        <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 1.6 }}>💡 {q.explanation}</div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        {!checked && selected !== null && <button onClick={handleNext} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Check answer</button>}
        {checked && <button onClick={goNext} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>{current < totalQ - 1 ? 'Next →' : 'See results →'}</button>}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [quizKey, setQuizKey] = useState(0);
  const { data: radar, isLoading } = useQuery({
    queryKey: ['student-radar'],
    queryFn: () => api.get('/student/radar').then(r => r.data),
  });
  const subjects = [...(radar?.data || [])].sort((a, b) => (a.score || 0) - (b.score || 0)).map(s => ({ ...s, percentage: s.score }));

  const startQuiz = (subjectName) => {
    setQuizKey(k => k + 1); // Force a new instance even for the same subject
    setSelectedSubject(subjectName);
  };

  if (selectedSubject) return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setSelectedSubject(null)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13, minHeight: 44 }}>← Back</button>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: '#f1f5f9' }}>Quiz: {selectedSubject}</h2>
      </div>
      <div className="chart-container">
        <QuizGame key={quizKey} subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
      </div>
    </div>
  );

  return (
    <div className="dashboard-content">
      <PageHeader title="🧠 Practice Quiz" subtitle="AI-generated MCQs from your weakest subjects" />
      {isLoading ? <CardSkel height={300} /> : (
        <>
          {subjects[0] && (
            <button onClick={() => startQuiz(subjects[0].subject)} style={{ width: '100%', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', border: 'none', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 20, minHeight: 48 }}>
              🎯 Test my weakest: {subjects[0].subject}
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {subjects.map((subj, i) => {
              const c = subj.percentage >= 80 ? '#10b981' : subj.percentage >= 60 ? '#f59e0b' : '#f43f5e';
              return (
                <div key={i} className="chart-container" style={{ borderLeft: `3px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, color: '#f1f5f9', marginBottom: 3 }}>{subj.subject}</p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>{subj.percentage}% avg score</p>
                  </div>
                  <button onClick={() => startQuiz(subj.subject)} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
                    Practice →
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

