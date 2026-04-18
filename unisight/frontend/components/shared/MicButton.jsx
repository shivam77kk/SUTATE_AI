'use client';
import { Mic, MicOff } from 'lucide-react';

/**
 * Reusable Mic Button with pulsing animation when active.
 * Uses inline styles (no Tailwind dependency).
 */
export default function MicButton({
  isListening,
  onClick,
  disabled = false,
  size = 'md',
  theme = 'purple'
}) {
  const sizeMap = { sm: 32, md: 48, lg: 64 };
  const iconMap = { sm: 14, md: 20, lg: 26 };
  const dim = sizeMap[size] || 48;
  const iconSize = iconMap[size] || 20;

  const accentMap = {
    purple: '#a78bfa',
    teal: '#6ee7b7',
    amber: '#fbbf24',
  };
  const accent = accentMap[theme] || '#a78bfa';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      title={isListening ? 'Listening… click to stop' : 'Click to speak'}
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        minHeight: dim,
        borderRadius: '50%',
        border: `2px solid ${isListening ? '#22c55e' : '#ef4444'}`,
        background: isListening
          ? 'rgba(34,197,94,0.2)'
          : 'rgba(239,68,68,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s ease',
        flexShrink: 0,
        animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
        boxShadow: isListening
          ? '0 0 20px rgba(34,197,94,0.5)'
          : '0 0 0 transparent',
      }}
    >
      {isListening ? (
        <Mic size={iconSize} color="#22c55e" />
      ) : (
        <MicOff size={iconSize} color="#ef4444" />
      )}
      {/* Inline keyframes for pulse animation */}
      <style jsx>{`
        @keyframes micPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(34,197,94,0.3); }
          50% { transform: scale(1.08); box-shadow: 0 0 25px rgba(34,197,94,0.6); }
        }
      `}</style>
    </button>
  );
}

