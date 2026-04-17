'use client';

/**
 * Animated sound wave bars shown during audio playback.
 */
export default function VoiceWave({ isPlaying, color = '#A78BFA' }) {
  if (!isPlaying) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          style={{
            width: '3px',
            background: color,
            borderRadius: '2px',
            animation: `voiceWave 0.8s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes voiceWave {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
      `}</style>
    </div>
  );
}
