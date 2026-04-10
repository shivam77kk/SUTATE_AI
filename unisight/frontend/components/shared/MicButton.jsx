'use client';
import { Mic, MicOff } from 'lucide-react';

/**
 * Reusable Mic Button with pulsing animation when active.
 */
export default function MicButton({
  isListening, 
  onClick, 
  disabled = false,
  size = 'md', 
  theme = 'purple'
}) {
  const sizes = { 
    sm: 'w-8 h-8', 
    md: 'w-12 h-12', 
    lg: 'w-16 h-16' 
  };
  const iconSizes = { 
    sm: 14, 
    md: 18, 
    lg: 24 
  };

  const themeColors = {
    purple: isListening ? 'bg-red-500 border-red-400' : 'border-purple-500 hover:bg-purple-500/20',
    teal:   isListening ? 'bg-red-500 border-red-400' : 'border-emerald-500 hover:bg-emerald-500/20',
    amber:  isListening ? 'bg-red-500 border-red-400' : 'border-amber-500 hover:bg-amber-500/20',
  };

  const textColor = theme === 'purple' ? 'text-purple-400' : theme === 'teal' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizes[size]}
        rounded-full border-2
        flex items-center justify-center
        transition-all duration-200
        ${themeColors[theme]}
        ${isListening ? 'animate-pulse' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isListening ? 'Listening... click to stop' : 'Click to speak'}
      type="button"
    >
      {isListening
        ? <MicOff size={iconSizes[size]} className="text-white" />
        : <Mic size={iconSizes[size]} className={textColor} />
      }
    </button>
  );
}
