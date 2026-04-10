'use client';
import { useState, useRef, useCallback } from 'react';

/**
 * Hook for playing base64 audio strings.
 * Returns: { isPlaying, play, stop }
 */
export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const play = useCallback((audioDataUrl) => {
    if (!audioDataUrl) return;

    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioDataUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    audio.play().catch(err => {
      console.error('Audio playback failed:', err);
      setIsPlaying(false);
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return { isPlaying, play, stop };
}
