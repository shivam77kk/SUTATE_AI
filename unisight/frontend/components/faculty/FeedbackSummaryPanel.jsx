import React from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';

export default function FeedbackSummaryPanel({ summaryData }) {
  if (!summaryData || !summaryData.subjects) return null;
  
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="text-indigo-600" /> Student Curriculum Feedback
        </h3>
        <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm">
          Response Rate: {summaryData.overallResponseRate}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryData.subjects.map((sub, i) => (
          <div key={i} className={`p-4 rounded-xl border ${sub.isFlaggedAsCurriculumIssue ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-900 text-lg">{sub.subject}</h4>
              {sub.isFlaggedAsCurriculumIssue && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                  <AlertCircle size={12}/> FLAGGED
                </span>
              )}
            </div>
            
            <div className="flex gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Avg Difficulty</p>
                <p className={`text-2xl font-black ${sub.avgDifficultyRating >= 4 ? 'text-red-600' : 'text-gray-800'}`}>
                  {sub.avgDifficultyRating}<span className="text-sm">/5</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Sentiment</p>
                <p className={`text-2xl font-black ${sub.avgSentimentScore < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {sub.avgSentimentScore > 0 ? '+' : ''}{sub.avgSentimentScore}
                </p>
              </div>
            </div>

            {sub.topFeedbackSamples?.length > 0 && (
              <div className="bg-white/50 p-3 rounded border border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-1">Top Samples:</p>
                <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                  {sub.topFeedbackSamples.map((samp, idx) => <li key={idx}>"{samp}"</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
