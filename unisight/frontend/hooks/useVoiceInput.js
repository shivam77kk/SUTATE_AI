'use client';
import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook for capturing voice input using Web Speech API.
 * Returns: { isListening, transcript, startListening, stopListening, supported }
 */
export function useVoiceInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!supported) {
      toast.error('Voice input is not supported in this browser. Please use Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'en-IN'; // Indian English
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      console.log('Speech recognition result received');
      const text = event.results[0][0].transcript;
      console.log('Transcript:', text);
      setTranscript(text);
      if (onTranscript) onTranscript(text);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied. Please enable it in browser settings.');
      } else if (event.error === 'no-speech') {
        toast.error('No speech detected. Try speaking louder or closer to the mic.');
      } else if (event.error === 'network') {
        toast.error('Network error during speech recognition.');
      } else {
        toast.error(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    console.log('Calling recognition.start()...');
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      toast.error('Failed to start microphone. It might be already in use.');
      setIsListening(false);
    }
  }, [supported, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, supported };
}
