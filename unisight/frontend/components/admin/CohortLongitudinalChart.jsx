import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Handle cases where semester string already contains "Sem"
    const semLabel = label?.toString().toLowerCase().includes('sem') ? label : `Semester ${label}`;
    
    return (
      <div style={{ background: 'rgba(10,10,26,0.9)', backdropFilter: 'blur(12px)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: '160px' }}>
        <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>{semLabel}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ color: '#818cf8', fontSize: '12px', fontWeight: 600 }}>Avg CGPA</span>
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>{data.avgCgpa?.toFixed(2)}</span>
        </div>
        {data.atRiskPercent !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fb7185', fontSize: '12px', fontWeight: 600 }}>At Risk</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>{data.atRiskPercent}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function CohortLongitudinalChart({ semesterData }) {
  if (!semesterData || semesterData.length === 0) {
    return <div className="p-8 text-center text-gray-500 font-medium">No longitudinal data available yet.</div>;
  }

  // Format data: ensure semester labels are clean
  const chartData = semesterData.map(d => ({
    ...d,
    // Clean up "Sem 4" to just "4" if we want, or keep it. Let's keep it but ensure it's short
    cleanSem: d.semester?.toString().replace(/sem\s*/i, 'S') || d.semester
  }));
  
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cohortColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="cleanSem" 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
            dy={10}
          />
          <YAxis 
            domain={[0, 10]} 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area 
            type="monotone" 
            dataKey="avgCgpa" 
            stroke="#818cf8" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#cohortColor)" 
            activeDot={{ r: 6, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }} 
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
