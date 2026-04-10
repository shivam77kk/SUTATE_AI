import React from 'react';

export default function CohortLongitudinalChart({ semesterData }) {
  if (!semesterData || semesterData.length === 0) return <div className="p-4 text-gray-500">No data available</div>;

  const maxSemesters = Math.max(...semesterData.map(d => d.semester), 8); // Display at least 8 semesters context
  const targetCgpa = 10;
  
  return (
    <div className="w-full bg-white rounded-xl shadow border border-gray-100 p-6">
      <h3 className="font-bold text-lg text-gray-900 mb-4">Longitudinal Average CGPA Trend</h3>
      <div className="relative h-64 flex items-end justify-between border-b border-l border-gray-200 pb-2 pl-2">
        {/* Y Axis markings */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none -ml-6 text-xs text-gray-400">
          <span>10.0</span>
          <span>7.5</span>
          <span>5.0</span>
          <span>2.5</span>
          <span>0.0</span>
        </div>
        
        {semesterData.map((data, idx) => {
          const heightPct = (data.avgCgpa / targetCgpa) * 100;
          return (
            <div key={idx} className="flex flex-col items-center group w-full relative h-full justify-end">
              <div 
                className="w-1/2 bg-indigo-500 rounded-t-sm transition-all relative"
                style={{ height: `${heightPct}%`, minHeight: '1px' }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  Sem {data.semester}: {data.avgCgpa.toFixed(2)} CGPA
                  <br/>
                  At-Risk: {data.atRiskPercent}%
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-2 font-medium">S{data.semester}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
