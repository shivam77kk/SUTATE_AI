'use client';
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import MicButton from '@/components/shared/MicButton.jsx';
import VoicePlayer from '@/components/shared/VoicePlayer.js';
import toast from 'react-hot-toast';

export default function VoiceAssistantPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const queryRef = useRef('');

  // ─── Visualizer ──────────────────────────────────────────────
  const updateAudioLevel = () => {
    if (!analyserRef.current || !isRecording) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; }
    const average = sum / dataArray.length;
    setAudioLevel(average);
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startVisualizer = (stream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      updateAudioLevel();
    } catch (e) { console.error('Visualizer error:', e); }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.error(e));
    }
    setAudioLevel(0);
  };

  // ─── Ask API ─────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (text) => api.post('/admin/ask', { question: text, voiceMode: true }).then(r => r.data),
    onSuccess: (data) => {
      setResult(data);
      // TTS fallback if needed
      if (!data.audio && data.answer && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(data.answer);
        window.speechSynthesis.speak(utt);
      }
    },
    onError: () => toast.error('Query failed'),
  });

  const submitQuery = (text) => {
    if (!text?.trim()) return;
    setResult(null);
    mutation.mutate(text);
  };

  // ─── Recording (MediaRecorder + Backend Gemini) ────────────────
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      startVisualizer(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setQuery('');
        setResult(null);
        toast('🎙️ Recording... speak now, then click stop.', { icon: '🎤' });
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        stopVisualizer();
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (audioBlob.size < 1000) return toast.error('Audio too short.');

        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.webm');
        
        setIsTranscribing(true);
        try {
          const res = await api.post('/admin/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 25000
          });
          const text = res.data?.text?.trim() || '';
          if (text) {
            setQuery(text);
            queryRef.current = text;
            toast.success('Understood!');
            submitQuery(text);
          } else {
            toast.error('Could not hear anything clear. Try again.');
          }
        } catch (err) {
          toast.error('Transcription failed.');
          console.error(err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error(err);
      toast.error('Microphone access denied. Check your browser settings.');
    }
  };

  return (
    <div className="dashboard-content">
      <PageHeader title="🎙️ Voice Assistant" subtitle="Dedicated Input / Output Voice Chat" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'stretch' }}>
        
        {/* LEFT PANE: INPUT */}
        <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="chart-title" style={{ marginBottom: 16 }}>Your Input</div>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              className="input-field"
              placeholder={isRecording ? 'Recording your voice... (Visualizer below)' : 'Type or speak your message...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', height: '100%', minHeight: '200px', resize: 'none', padding: 16, fontSize: 16, lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 16 }}>
            {/* Visualizer */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 8 }}>
              {isRecording ? (
                Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isRecording ? Math.max(4, audioLevel * Math.random() * 2) : 4 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                    style={{ flex: 1, background: '#10b981', borderRadius: 4, opacity: 0.8 }}
                  />
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: 12, paddingLeft: 8 }}>Standby</div>
              )}
            </div>

            <MicButton
              isListening={isRecording}
              onClick={toggleRecording}
              size="lg"
              theme={isRecording ? 'red' : 'purple'}
            />

            <button
              onClick={() => submitQuery(query)}
              disabled={!query.trim() || mutation.isPending || isTranscribing}
              className="btn btn-primary"
              style={{ height: 48, padding: '0 24px', borderRadius: 24 }}
            >
              Send
            </button>
          </div>
          
          <AnimatePresence>
            {isRecording && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, fontSize: 13, color: '#fca5a5', textAlign: 'center' }}>
                🟢 Listening... Click the mic again when finished to transcribe.
              </motion.div>
            )}
            {isTranscribing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, fontSize: 13, color: '#93c5fd', textAlign: 'center' }}>
                ⏳ Transcribing audio securely to backend...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PANE: OUTPUT */}
        <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="chart-title" style={{ marginBottom: 16 }}>AI Output</div>
          
          {mutation.isPending && (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 16 }}>
               <span className="spinner" style={{ marginBottom: 16, width: 32, height: 32, borderTopColor: '#818cf8' }} />
               Generating advanced response...
             </div>
          )}

          {!mutation.isPending && !result && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 15, textAlign: 'center' }}>
              Your answer will appear here.<br/>Speak the prompt on the left.
            </div>
          )}

          {!mutation.isPending && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
               <p style={{ fontSize: 16, color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: 20 }}>
                 {result.answer}
               </p>
               
               {result.audio && (
                 <VoicePlayer audioData={result.audio} text={result.answer} />
               )}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
