'use client';
import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import TeacherEffectivenessPanel from '../../../components/faculty/TeacherEffectivenessPanel';
import FeedbackSummaryPanel from '../../../components/faculty/FeedbackSummaryPanel';
import { LayoutDashboard } from 'lucide-react';

export default function FacultyEffectivenessHistory() {
  const [insights, setInsights] = useState([]);
  const [selectedSem, setSelectedSem] = useState(null);

  useEffect(() => {
    api.get('/faculty/effectiveness-history').then(res => {
      setInsights(res.data.history || []);
      if (res.data.history?.length > 0) setSelectedSem(res.data.history[0]);
    }).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-8 flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <LayoutDashboard className="text-indigo-600" size={32}/> My Teaching Analytics
          </h1>
          <p className="text-gray-500 mt-2">Private AI evaluations of curriculum delivery & pass rates.</p>
        </div>
        
        {insights.length > 0 && (
          <select 
            className="border-2 border-gray-200 rounded-lg p-2 font-bold outline-none focus:border-indigo-500 transition text-gray-700 bg-white"
            onChange={(e) => setSelectedSem(insights[e.target.value])}
          >
            {insights.map((ins, i) => (
              <option key={ins._id} value={i}>{ins.classId} — Effectiveness: {ins.effectivenessScore}</option>
            ))}
          </select>
        )}
      </div>

      {!selectedSem ? (
        <div className="text-center p-20 text-gray-400 font-medium text-lg">
          No teaching datasets analysed yet. Upload class data to generate an evaluation.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="xl:col-span-1">
            <TeacherEffectivenessPanel insights={selectedSem} />
          </div>
          <div className="xl:col-span-1">
            <FeedbackSummaryPanel summaryData={{
              overallResponseRate: 68,
              subjects: selectedSem.studentFeedbackSummary?.map(sm => ({
                subject: sm.subject,
                isFlaggedAsCurriculumIssue: sm.avgDifficultyRating >= 4,
                avgDifficultyRating: sm.avgDifficultyRating,
                avgSentimentScore: sm.avgSentimentScore,
                topFeedbackSamples: sm.topFeedbackSamples
              })) || []
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
