import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';

export default function FeedbackModal({ subjects, classId, semester, uploadId, onClose }) {
  const [responses, setResponses] = useState(
    subjects.map(s => ({ subject: s, difficultyRating: 3, feedbackText: '' }))
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = (index, val) => {
    const newRes = [...responses];
    newRes[index].difficultyRating = val;
    setResponses(newRes);
  };

  const handleText = (index, val) => {
    const newRes = [...responses];
    newRes[index].feedbackText = val;
    setResponses(newRes);
  };

  const submitFeedback = async () => {
    try {
      setLoading(true);
      await api.post('/feedback', { classId, semester, uploadId: uploadId || 'manual', responses });
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Curriculum Feedback</h2>
            <p className="text-xs text-gray-500 mt-1">Your feedback helps identify subject bottlenecks</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-emerald-600">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Send size={32} />
              </div>
              <h3 className="text-xl font-bold">Feedback Submitted!</h3>
              <p className="text-gray-500 mt-2">Thank you for shaping the curriculum.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {responses.map((res, idx) => (
                <div key={res.subject} className="bg-white border text-left border-gray-200 p-5 rounded-xl shadow-sm">
                  <h4 className="font-bold text-lg text-gray-800 mb-3">{res.subject}</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Difficulty Rating (1-Easy, 5-Hard)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => handleRating(idx, num)}
                          className={`w-10 h-10 rounded-lg font-bold transition flex items-center justify-center ${
                            res.difficultyRating === num 
                              ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                              : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Specific Feedback (Optional)</label>
                    <textarea 
                      placeholder="What made this subject difficult? Any syllabus constraints?"
                      value={res.feedbackText}
                      onChange={(e) => handleText(idx, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      rows="2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!submitted && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition">Cancel</button>
            <button 
              onClick={submitFeedback}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow flex items-center gap-2"
            >
              {loading ? 'Submitting...' : 'Submit All Feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
