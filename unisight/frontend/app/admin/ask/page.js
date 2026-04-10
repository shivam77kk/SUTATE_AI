'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { SafeTip, CHART_PALETTE } from '@/lib/chart';
import MicButton from '@/components/shared/MicButton.jsx';
import VoicePlayer from '@/components/shared/VoicePlayer.js';
import toast from 'react-hot-toast';
import { Volume2, VolumeX } from 'lucide-react';

// ─── Dynamic Chart ──────────────────────────────────────────────────────────

function DynamicChart({ result }) {
  const data = result?.data || [];
  const type = result?.chartType || 'bar';
  if (!data.length) return null;

  const keys = Object.keys(data[0] || {}).filter(k => typeof data[0][k] === 'number');
  const catKey =
    Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'string') || 'name';

  if (type === 'pie') {
    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey={keys[0]}
              nameKey={catKey}
              cx="50%" cy="50%"
              outerRadius={100} innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<SafeTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
            <XAxis dataKey={catKey} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<SafeTip />} />
            {keys.map((k, i) => (
              <Line
                key={k} type="monotone" dataKey={k}
                stroke={CHART_PALETTE[i]} strokeWidth={2.5}
                dot={{ fill: CHART_PALETTE[i], r: 4 }}
                activeDot={{ r: 6 }} animationDuration={1500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
          <XAxis dataKey={catKey} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<SafeTip />} />
          {keys.map((k, i) => (
            <Bar
              key={k} dataKey={k} fill={CHART_PALETTE[i]}
              radius={[6, 6, 0, 0]} animationDuration={1500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const EXAMPLES = [
  'Which department has the most at-risk students?',
  'Show me CGPA trend over the last 4 semesters',
  'Which faculty has the highest effectiveness score?',
];

export default function AskPage() {
  const [query, setQuery]         = useState('');
  const [result, setResult]       = useState(null);
  // Voice Response ON by default so TTS plays immediately
  const [voiceMode, setVoiceMode] = useState(true);
  const [isListening, setIsListening]   = useState(false);
  const [elevenLabsOk, setElevenLabsOk] = useState(null); // null=checking, true=ok, false=failed
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  // Ref so mutationFn always reads the fresh value (avoids stale closure)
  const voiceModeRef  = useRef(true);
  const queryRef      = useRef('');

  const syncQuery = (val) => { setQuery(val); queryRef.current = val; };
  const toggleVoice = () => {
    setVoiceMode(v => { voiceModeRef.current = !v; return !v; });
  };

  // ── Browser SpeechSynthesis fallback ──────────────────────────────────────
  const browserSpeak = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.substring(0, 500));
    utt.rate = 1; utt.pitch = 1; utt.lang = 'en-US';
    // Pick a good English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
    toast('🔊 Playing via browser voice (ElevenLabs unavailable)', { duration: 3000 });
  }, []);

  // ── Check ElevenLabs connectivity on mount ────────────────────────────────
  useEffect(() => {
    api.get('/admin/voice-status')
      .then(r => setElevenLabsOk(r.data?.ok === true))
      .catch(() => setElevenLabsOk(false));
  }, []);

  // ── Backend history ────────────────────────────────────────────────────────
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['ask-history'],
    queryFn: () => api.get('/admin/ask/history').then(r => r.data),
    staleTime: 30000,
  });
  const history = historyData?.history || [];

  // ── Ask mutation — always reads from refs ─────────────────────────────────
  const mutation = useMutation({
    mutationFn: (overrideQuery) =>
      api
        .post('/admin/ask', {
          question: overrideQuery ?? queryRef.current,
          voiceMode: voiceModeRef.current,
        })
        .then(r => r.data),
    onSuccess: (data) => {
      setResult(data);
      refetchHistory();
      // If voice mode is on but ElevenLabs returned no audio, use browser TTS fallback
      if (voiceModeRef.current && !data.audio && data.answer) {
        browserSpeak(data.answer);
      }
    },
    onError: () => toast.error('AI query failed. Try rephrasing.'),
  });

  // ── Ref to always call the latest mutation (avoids stale closure) ─────────
  const submitVoiceQuery = useRef(null);
  submitVoiceQuery.current = (text) => {
    if (!text?.trim()) return;
    queryRef.current = text;
    setQuery(text);
    setResult(null);
    mutation.mutate(text);
  };

  // ── Robust STT (MediaRecorder + Backend Gemini Transcription) ─────────────
  const toggleMic = async () => {
    if (isListening) {
      if (recognitionRef.current && recognitionRef.current.state === 'recording') {
        recognitionRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recognitionRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
        queryRef.current = '';
        setQuery('');
        toast('🎙️ Recording... Speak now', { icon: '🎤', duration: 3000 });
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        if (audioBlob.size < 1000) {
          toast.error('Audio too short or empty');
          return;
        }

        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.webm');
        const toastId = toast.loading('Transcribing...');

        try {
          const res = await api.post('/admin/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 20000
          });
          toast.dismiss(toastId);

          if (res.data?.text && res.data.text.trim()) {
            const t = res.data.text.trim();
            setQuery(t);
            queryRef.current = t;
            toast.success('Voice captured!');
            // Auto submit
            setTimeout(() => submitVoiceQuery.current(t), 300);
          } else {
            toast.error('Speech not recognized. Please try again.');
          }
        } catch (err) {
          toast.dismiss(toastId);
          console.error('[Transcribe Error]', err);
          toast.error('Transcription failed: ' + (err.response?.data?.error || err.message));
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('[Mic Error]', err);
      toast.error('Microphone access denied or not available.');
    }
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    mutation.mutate();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="dashboard-content">
      <PageHeader
        title="💬 Admin AI Query"
        subtitle="Ask any question about your university data in plain English"
      />

      {/* ── Query Input Box ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-container"
        style={{ marginBottom: 24 }}
      >
        {/* Voice Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={toggleVoice}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: voiceMode ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
              border: voiceMode ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: voiceMode ? '#818cf8' : '#64748b',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Toggle voice response (TTS)"
          >
            {voiceMode ? <Volume2 size={14} /> : <VolumeX size={14} />}
            Voice Response {voiceMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Input Row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
          <textarea
            value={query}
            onChange={e => syncQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isListening ? '🎙️ Listening…' : 'e.g. Which department has the most dropouts?'}
            className="input-field flex-1"
            style={{
              resize: 'none', height: 56, lineHeight: 1.5,
              paddingTop: 14, fontSize: 15,
              border: isListening ? '1px solid rgba(239,68,68,0.5)' : undefined,
              transition: 'border 0.2s',
            }}
          />

          {/* Mic Button (STT) */}
          <MicButton
            isListening={isListening}
            onClick={toggleMic}
            size="md"
            theme="purple"
          />

          {/* Send Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!query.trim() || mutation.isPending}
            whileHover={{ scale: query.trim() ? 1.02 : 1 }}
            whileTap={{ scale: query.trim() ? 0.98 : 1 }}
            style={{
              width: 48, height: 48, borderRadius: 12, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0, cursor: query.trim() ? 'pointer' : 'default',
              background: query.trim()
                ? 'linear-gradient(135deg,#6366f1,#7c3aed)'
                : 'rgba(255,255,255,0.04)',
              color: 'white',
              boxShadow: query.trim() ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
            }}
          >
            {mutation.isPending ? (
              <span className="spinner" />
            ) : (
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >→</motion.span>
            )}
          </motion.button>
        </div>

        {/* STT Status Banner */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '8px 14px', marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 500 }}>
                Listening… Speak your question clearly, then click the mic again to stop.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXAMPLES.map((ex, i) => (
            <motion.button
              key={i}
              onClick={() => { syncQuery(ex); setResult(null); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                color: '#818cf8', cursor: 'pointer', minHeight: 34,
              }}
            >
              {ex}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Loading State ────────────────────────────────────────── */}
      <AnimatePresence>
        {mutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="chart-container"
            style={{ marginBottom: 24 }}
          >
            <div className="chart-title">🤖 AI is thinking…</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="chart-container"
            style={{ marginBottom: 24 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}
              >
                🤖
              </motion.div>
              <div>
                <div className="chart-title" style={{ marginBottom: 2 }}>AI Answer</div>
                {result.title && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>{result.title}</div>
                )}
              </div>
              {result.voiceAvailable && (
                <div
                  style={{
                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                    fontSize: 11, color: '#6ee7b7', fontWeight: 600,
                  }}
                >
                  <Volume2 size={12} /> Voice Ready
                </div>
              )}
            </div>

            {/* Answer Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: 15, color: '#f1f5f9', lineHeight: 1.8, marginBottom: 16 }}
            >
              {result.answer}
            </motion.p>

            {/* TTS Audio Player (only when backend returned audio) */}
            {result.audio && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <VoicePlayer audioData={result.audio} text={result.answer} />
              </motion.div>
            )}

            {/* No TTS but voiceMode was on — explain why */}
            {!result.audio && voiceMode && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                ℹ️ Voice response unavailable — ElevenLabs API may be unavailable.
              </div>
            )}

            {/* Chart */}
            {result.data?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ marginTop: 16 }}
              >
                <DynamicChart result={result} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History (from backend) ───────────────────────────────── */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="chart-container"
        >
          <div className="chart-title">🕘 Recent Queries</div>
          {history.slice(0, 8).map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                padding: '12px 0',
                borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                syncQuery(h.question || h.query || '');
                setResult(null);
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 4 }}>
                {h.question || h.query}
              </p>
              <p
                style={{
                  fontSize: 12, color: '#64748b',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {h.answer?.substring(0, 90)}…
              </p>
              {h.createdAt && (
                <p style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                  {new Date(h.createdAt).toLocaleString()}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
