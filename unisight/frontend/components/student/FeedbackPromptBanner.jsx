import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

export default function FeedbackPromptBanner({ onOpenModal }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-5 mb-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
      <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
        <MessageSquare size={120} />
      </div>
      
      <div className="flex-1 relative z-10">
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <MessageSquare size={20} /> Your Voice Matters
        </h3>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Help us improve your currciulum! Take 2 minutes to submit your anonymous feedback on recent subjects. This data directly identifies systemic curriculum bottlenecks. 
        </p>
      </div>
      
      <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
        <button 
          onClick={onOpenModal}
          className="bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-50 transition w-full sm:w-auto shadow"
        >
          Submit Feedback
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-2 hover:bg-white/20 rounded-lg transition"
          title="Dismiss"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
