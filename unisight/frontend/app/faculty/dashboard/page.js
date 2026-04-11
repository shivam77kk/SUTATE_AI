'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { CardSkel, TableSkel } from '@/components/ui/Skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function FacultyDashboard() {
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['faculty-dashboard'],
    queryFn: () => api.get('/faculty/dashboard').then(r => r.data),
  });

  const { data: effectiveness } = useQuery({
    queryKey: ['faculty-effectiveness'],
    queryFn: () => api.get('/faculty/effectiveness').then(r => r.data),
  });
  
  const { data: classesData } = useQuery({
    queryKey: ['faculty-classes'],
    queryFn: () => api.get('/faculty/classes').then(r => r.data),
  });

  if (isLoading) return (
    <div className="dashboard-content">
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => <CardSkel key={i} height={120} />)}
      </div>
      <TableSkel rows={4} />
    </div>
  );

  const d = dashboard || {};
  const atRisk = d.proactiveAlerts || [];
  const classes = classesData?.classes || [];
  const eff = effectiveness?.overall;

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="dashboard-content"
    >
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Faculty'} 👋`}
        subtitle={user?.department || 'Faculty Portal'}
        action={
          <Link href="/faculty/upload" 
            className="px-5 py-2.5 rounded-lg font-bold text-sm no-rewrite inline-flex items-center gap-2"
            style={{ 
              background: 'linear-gradient(135deg,#10b981,#059669)', 
              color: 'white', 
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              textDecoration: 'none',
              minHeight: '44px'
            }}
          >
            📤 Upload CSV
          </Link>
        }
      />

      {/* Global alert if high risk students */}
      {atRisk.filter(s => s.dropoutTier === 'HIGH' || s.dropoutTier === 'CRITICAL').length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-5 p-3 rounded-xl flex gap-3 items-center"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
        >
          <span className="text-xl">🚨</span>
          <p className="text-sm font-medium" style={{ color: '#fb7185' }}>
            {atRisk.filter(s => s.dropoutTier === 'HIGH' || s.dropoutTier === 'CRITICAL').length} students are at HIGH/CRITICAL dropout risk — immediate attention needed.
          </p>
        </motion.div>
      )}

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid-4 mb-6">
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard label="PROCESSED" value={d.latestUploadKpi?.processed ?? '--'} color="indigo" />
        </motion.div>
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard 
            label="AT-RISK FOUND" 
            value={d.latestUploadKpi?.atRiskFound ?? '--'} 
            color="rose" 
            badge={<span style={{ fontSize: 10.5, color: '#64748b' }}>Needs attention</span>}
          />
        </motion.div>
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard label="RECENT UPLOADS" value={d.recentUploads?.length ?? '0'} color="emerald" />
        </motion.div>
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
          <KPICard 
            label="EFFECTIVENESS" 
            value={eff ? `${eff.score}%` : '--'} 
            color="amber"
            badge={eff && (
              <div style={{ fontSize: 10.5, color: eff.badge === 'Top Performer' ? '#10b981' : '#64748b', fontWeight: 600 }}>
                {eff.badge}
              </div>
            )} 
          />
        </motion.div>
      </motion.div>

      {/* My Classes */}
      <motion.div variants={itemVariants} className="chart-container mb-6">
        <div className="section-header">
          <div className="chart-title">🏫 My Classes</div>
        </div>
        <div className="grid-3">
          {classes.map((cls, i) => (
            <Link href={`/faculty/class/${cls.classId}`} key={i} style={{ textDecoration: 'none' }}>
              <motion.div 
                whileHover={{ y: -4, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                style={{ 
                  padding: '16px 18px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: 12, 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                <p className="font-semibold text-sm mb-1" style={{ color: '#f1f5f9' }}>{cls.classId || cls.className}</p>
                <p className="text-xs mb-2.5" style={{ color: '#64748b' }}>{cls.department} · Sem {cls.semester}</p>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#94a3b8' }}>{cls.studentCount || 0} students</span>
                  <span style={{ color: cls.atRiskCount > 0 ? '#fb7185' : '#10b981', fontWeight: 600 }}>
                    {cls.atRiskCount > 0 ? `⚠ ${cls.atRiskCount} risk` : '✓ All OK'}
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
          <Link href="/faculty/upload" style={{ textDecoration: 'none' }}>
            <motion.div 
              whileHover={{ borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}
              style={{ 
                padding: '16px 18px', 
                background: 'rgba(255,255,255,0.01)', 
                borderRadius: 12, 
                border: '2px dashed rgba(255,255,255,0.07)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                minHeight: 100, 
                color: '#64748b', 
                transition: 'all 0.2s' 
              }}
            >
              <span className="text-2xl mb-1.5">+</span>
              <span className="text-sm font-semibold">Upload New Class</span>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Uploads */}
      {d.recentUploads?.length > 0 && (
        <motion.div variants={itemVariants} className="chart-container mb-6">
          <div className="section-header">
            <div className="chart-title">📤 Recent Uploads</div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Entries</th>
                  <th>Errors</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {d.recentUploads.map((u, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{u.filename}</td>
                    <td>
                      <span 
                        style={{ 
                          padding: '2px 10px', 
                          borderRadius: 999, 
                          fontSize: 10.5, 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          background: u.status === 'COMPLETED' || u.status === 'COMPLETE' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', 
                          color: u.status === 'COMPLETED' || u.status === 'COMPLETE' ? '#10b981' : '#f59e0b' 
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{u.entries}</td>
                    <td style={{ fontFamily: 'monospace', color: u.errors > 0 ? '#f43f5e' : '#94a3b8' }}>{u.errors}</td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{u.date ? new Date(u.date).toLocaleDateString() : '--'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* At-Risk Students */}
      {atRisk.length > 0 && (
        <motion.div variants={itemVariants} className="chart-container">
          <div className="section-header">
            <div className="chart-title">🚨 At-Risk Students</div>
            <Link href="/faculty/alerts" style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Risk Level</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {atRisk.slice(0, 6).map((s, i) => {
                  const tierColor = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f43f5e', CRITICAL: '#dc2626' }[s.riskLevel || s.dropoutTier];
                  return (
                    <motion.tr 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{s.name}</td>
                      <td>
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          style={{ 
                            padding: '2px 10px', 
                            borderRadius: 999, 
                            fontSize: 10.5, 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            background: `${tierColor}18`, 
                            color: tierColor, 
                            border: `1px solid ${tierColor}33` 
                          }}
                        >
                          {s.riskLevel || s.dropoutTier}
                        </motion.span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: 12 }}>{s.riskReason || s.reason || '--'}</td>
                      <td>
                        <Link href={`/faculty/student/${s.studentId}`} style={{ color: '#818cf8', fontSize: 12, textDecoration: 'none' }}>View →</Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
