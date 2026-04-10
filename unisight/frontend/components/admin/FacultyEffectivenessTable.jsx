import React from 'react';
import { Award, ArrowUpRight, ArrowDownRight, Minus, Star, TrendingUp, Users } from 'lucide-react';

export default function FacultyEffectivenessTable({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) return (
    <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 border-dashed p-32 rounded-[3rem] text-center backdrop-blur-md animate-fadeIn">
      <div className="bg-amber-500/10 p-10 rounded-[2.5rem] mb-8 border border-amber-500/20 shadow-2xl animate-pulse">
        <Star size={64} className="text-amber-500 opacity-60" fill="currentColor" />
      </div>
      <h3 className="text-3xl font-black text-white mb-4 italic">The Spotlight Awaits</h3>
      <p className="text-gray-400 max-w-md text-lg leading-relaxed mb-10">
        Faculty performance analytics are calculated post-assessment. No evaluation cycles have been finalized for the current semester yet.
      </p>
      <div className="flex gap-4">
        <div className="px-6 py-2 rounded-full border border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest">Awaiting UT1 Data</div>
        <div className="px-6 py-2 rounded-full border border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Audit Pending</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {leaderboard.map((row, idx) => {
        const isTop = idx === 0;
        const isTop3 = idx < 3;
        
        return (
          <div 
            key={idx} 
            className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${
              isTop ? 'bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border-indigo-500/30' : 
              'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            {/* Glossy overlay for top rank */}
            {isTop && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />}
            
            <div className="flex flex-col md:flex-row items-center gap-6 p-6">
              {/* Rank Badge */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-black/40 border border-white/10">
                <span className={`text-2xl font-black ${
                  idx === 0 ? 'text-yellow-400' : 
                  idx === 1 ? 'text-gray-300' : 
                  idx === 2 ? 'text-orange-400' : 'text-gray-500'
                }`}>
                  #{idx + 1}
                </span>
                {isTop3 && <Award size={14} className={idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-orange-400'} />}
              </div>

              {/* Faculty Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                    {row.facultyName || 'Unknown Faculty'}
                  </h3>
                  <div className="flex justify-center md:justify-start gap-2">
                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase border border-indigo-500/20">
                      {row.department}
                    </span>
                    <span className="bg-white/5 text-gray-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase border border-white/5">
                      {row.classId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500"/> {row.classPassRate}% Pass Rate</span>
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-blue-400"/> Section Analytics</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="flex gap-4 items-center">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Effectiveness</p>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          row.effectivenessScore >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                          row.effectivenessScore >= 60 ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${row.effectivenessScore}%` }}
                      />
                    </div>
                    <span className="text-xl font-black text-white">{row.effectivenessScore}</span>
                  </div>
                </div>

                <div className="w-px h-10 bg-white/10 mx-2" />

                <div className="text-center min-w-[80px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Trend</p>
                  {row.scoreChangeVsPrevSem > 0 ? (
                    <div className="flex flex-col items-center text-emerald-400">
                      <ArrowUpRight size={20} className="animate-pulse" />
                      <span className="text-xs font-black">+{row.scoreChangeVsPrevSem}</span>
                    </div>
                  ) : row.scoreChangeVsPrevSem < 0 ? (
                    <div className="flex flex-col items-center text-rose-400">
                      <ArrowDownRight size={20} />
                      <span className="text-xs font-black">{row.scoreChangeVsPrevSem}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Minus size={20} />
                      <span className="text-xs font-black">STABLE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Teaching Recommendations Highlight (only for top or hovered) */}
            {row.teachingRecommendations?.length > 0 && (
              <div className="px-6 pb-4 pt-0 mt-[-10px]">
                <div className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-start gap-3">
                  <Star size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Top Strategy</p>
                    <p className="text-xs text-gray-300 italic">"{row.teachingRecommendations[0].description}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
