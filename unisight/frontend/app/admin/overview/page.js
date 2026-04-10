'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { CardSkel, TableSkel } from '@/components/ui/Skeleton';
import { CW, SafeTip, CHART_PALETTE } from '@/lib/chart';
import { formatDistanceToNow } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function AdminOverview() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/admin/overview').then(r => r.data),
  });

  if (isLoading) return (
    <div className="dashboard-content">
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => <CardSkel key={i} height={120} />)}
      </div>
      <TableSkel rows={5} />
    </div>
  );

  const d = overview || {};
  const depts = d.byDepartment || [];
  const trend = d.semesterTrend || [];
  const atRisk = d.atRiskStudents || [];
  const roi = d.roi;

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="dashboard-content"
    >
      <PageHeader
        title="🌐 University Overview"
        subtitle={d.lastUpdatedAt ? `Last updated ${formatDistanceToNow(new Date(d.lastUpdatedAt), { addSuffix: true })}` : 'SUTATE AI Dashboard'}
        action={
          <Link href="/admin/ask" className="px-4 py-2.5 rounded-lg font-bold text-sm no-underline inline-flex items-center gap-2" 
            style={{ 
              background: 'linear-gradient(135deg,#6366f1,#7c3aed)', 
              color: 'white',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
            }}>
            💬 Ask AI
          </Link>
        }
      />

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid-4" style={{ marginBottom: 24 }}>
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard label="TOTAL STUDENTS" value={d.totalStudents ?? '--'} color="indigo" />
        </motion.div>
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard 
            label="AT-RISK" 
            value={d.atRiskCount ?? '--'} 
            color="rose" 
            subtitle={d.interventionRate !== undefined ? `${d.interventionRate}% intervention rate` : undefined} 
          />
        </motion.div>
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard label="UNIV. AVG CGPA" value={d.avgCgpa?.toFixed(2) ?? '--'} unit="/ 10" color="emerald" />
        </motion.div>
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard label="TOTAL FACULTY" value={d.totalFaculty ?? '--'} color="amber" />
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid-2" style={{ marginBottom: 24 }}>
        <motion.div 
          whileHover={{ borderColor: 'rgba(99,102,241,0.3)' }}
          transition={{ duration: 0.2 }}
        >
          <CW title="🏛️ At-Risk by Department" height={280}>
            <ResponsiveContainer>
              <BarChart data={depts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="department" width={90} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<SafeTip />} />
                <Bar 
                  dataKey="atRiskCount" 
                  name="At-Risk Students" 
                  fill="#f43f5e" 
                  radius={[0, 6, 6, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </CW>
        </motion.div>

        <motion.div 
          whileHover={{ borderColor: 'rgba(99,102,241,0.3)' }}
          transition={{ duration: 0.2 }}
        >
          <CW title="📈 Semester Risk Trend" height={280}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
                <XAxis dataKey="semester" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<SafeTip />} />
                <Line 
                  type="monotone" 
                  dataKey="avgDropoutScore" 
                  name="Avg Risk" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#f43f5e', r: 4 }}
                  activeDot={{ r: 6, fill: '#f43f5e' }}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgCgpa" 
                  name="Avg CGPA" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6, fill: '#6366f1' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CW>
        </motion.div>
      </motion.div>

      {/* ROI Card */}
      {roi && (
        <motion.div 
          variants={itemVariants}
          className="chart-container mb-6 flex items-center gap-7 flex-wrap"
          style={{ borderLeft: '3px solid #10b981' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Intervention AI ROI</p>
            <p className="text-4xl font-extrabold" style={{ color: '#10b981', fontFamily: "'Space Grotesk',sans-serif" }}>{roi.roiPercent}%</p>
            <p className="text-xs" style={{ color: '#64748b' }}>Return on AI usage</p>
          </div>
          <div className="flex-1 flex gap-6 flex-wrap">
            {[
              { label: 'Students saved', value: roi.studentsRescued, unit: '', color: '#10b981' },
              { label: 'Revenue protected', value: roi.revenueProtected ? `₹${(roi.revenueProtected / 1e6).toFixed(1)}M` : '--', unit: '', color: '#6366f1' },
              { label: 'Interventions', value: roi.interventionCount, unit: '', color: '#f59e0b' },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <p className="text-2xl font-extrabold" style={{ color: item.color, fontFamily: "'Space Grotesk',sans-serif" }}>{item.value}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top at-risk students */}
      <motion.div variants={itemVariants} className="chart-container">
        <div className="section-header">
          <div className="chart-title">🚨 Top At-Risk Students</div>
          <Link href="/admin/interventions" style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>Manage interventions →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dept</th>
                <th>Risk Tier</th>
                <th>CGPA</th>
                <th>Attendance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {atRisk.slice(0, 8).map((s, i) => {
                const tc = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f43f5e', CRITICAL: '#dc2626' }[s.dropoutTier];
                return (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: '#64748b' }}>{s.department}</td>
                    <td>
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        style={{ 
                          padding: '2px 10px', 
                          borderRadius: 999, 
                          fontSize: 10.5, 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          background: `${tc}18`, 
                          color: tc,
                          border: `1px solid ${tc}33`
                        }}
                      >
                        {s.dropoutTier}
                      </motion.span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{s.cgpa?.toFixed(2)}</td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{s.avgAttendance}%</td>
                    <td>
                      <Link href={`/faculty/student/${s.studentId}`} style={{ color: '#818cf8', fontSize: 12, textDecoration: 'none' }}>
                        View →
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
