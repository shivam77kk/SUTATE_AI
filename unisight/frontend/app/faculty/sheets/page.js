'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';
import { Download, FileSpreadsheet, Calendar, RefreshCw, Link as LinkIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SheetsPage() {
  const [showSetup, setShowSetup] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [classId, setClassId] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const qc = useQueryClient();

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['sheets-config'],
    queryFn: () => api.get('/sheets').then(r => r.data),
  });

  const config = configData?.config;

  const setupMutation = useMutation({
    mutationFn: (data) => api.post('/sheets', data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries(['sheets-config']);
      setShowSetup(false);
      setSheetUrl('');
      setClassId('');
      setDepartment('');
      setSemester('');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Setup failed'),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post('/sheets/sync-now'),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries(['sheets-config']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Sync failed'),
  });

  const removeMutation = useMutation({
    mutationFn: () => api.delete('/sheets'),
    onSuccess: () => {
      toast.success('Auto-sync disabled');
      qc.invalidateQueries(['sheets-config']);
    },
    onError: () => toast.error('Failed to remove config'),
  });

  const handleSetup = () => {
    if (!sheetUrl || !classId || !department || !semester) {
      toast.error('All fields are required');
      return;
    }
    setupMutation.mutate({ sheetUrl, classId, department, semester: parseInt(semester) });
  };

  const getStatusColor = (status) => {
    if (status === 'success') return '#10b981';
    if (status === 'failed') return '#f43f5e';
    return '#64748b';
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 size={16} />;
    if (status === 'failed') return <XCircle size={16} />;
    return <Clock size={16} />;
  };

  return (
    <div className="dashboard-content">
      <PageHeader 
        title="📊 Google Sheets Sync" 
        subtitle="Connect your Google Sheet for automatic data sync"
        action={
          !config?.isActive && (
            <button
              onClick={() => setShowSetup(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <LinkIcon size={16} />
              Connect Sheet
            </button>
          )
        }
      />

      {configLoading ? (
        <CardSkel height={300} />
      ) : !config?.isActive ? (
        <div className="empty-state">
          <FileSpreadsheet size={48} color="var(--text-faint)" />
          <p style={{ fontWeight: 600, fontSize: 15, marginTop: 12 }}>No Google Sheet connected</p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>Connect a Google Sheet to automatically sync student data</p>
          <button
            onClick={() => setShowSetup(true)}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <LinkIcon size={16} />
            Connect Google Sheet
          </button>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 24 }}>
          {/* Config Card */}
          <div className="chart-container" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 3, 
              background: 'linear-gradient(90deg, #10b981, transparent)' 
            }} />
            
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LinkIcon size={18} color="#10b981" />
              Connected Sheet
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Sheet URL</div>
                <a 
                  href={config.sheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    fontSize: 13, 
                    color: '#10b981', 
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                    display: 'block',
                  }}
                  onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.target.style.textDecoration = 'none'}
                >
                  {config.sheetUrl}
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Class ID</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{config.classId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Department</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{config.department}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Semester</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{config.semester}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: 13 }}
                >
                  {syncMutation.isPending ? (
                    <><span className="spinner" />Syncing...</>
                  ) : (
                    <><RefreshCw size={14} />Sync Now</>
                  )}
                </button>
                <button
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  className="btn-danger"
                  style={{ fontSize: 13 }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="chart-container">
            <div className="chart-title">Sync Status</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                padding: '14px 16px',
                background: `${getStatusColor(config.lastSyncStatus)}12`,
                border: `1px solid ${getStatusColor(config.lastSyncStatus)}30`,
                borderRadius: 12,
              }}>
                <div style={{ color: getStatusColor(config.lastSyncStatus) }}>
                  {getStatusIcon(config.lastSyncStatus)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {config.lastSyncStatus === 'success' ? 'Last sync successful' : 
                     config.lastSyncStatus === 'failed' ? 'Last sync failed' : 
                     'Never synced'}
                  </div>
                  {config.lastSyncedAt && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(config.lastSyncedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {config.lastSyncError && (
                <div style={{ 
                  padding: '12px 14px', 
                  background: 'rgba(244,63,94,0.08)', 
                  border: '1px solid rgba(244,63,94,0.2)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#fb7185',
                  lineHeight: 1.5,
                }}>
                  <strong>Error:</strong> {config.lastSyncError}
                </div>
              )}

              <div style={{ 
                padding: '12px 14px', 
                background: 'rgba(99,102,241,0.08)', 
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}>
                <strong style={{ color: '#818cf8' }}>Auto-sync:</strong> Runs every Sunday at midnight. Click "Sync Now" to manually trigger a sync.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Modal */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowSetup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 520 }}
            >
              <h2 style={{ 
                fontFamily: "'Space Grotesk', sans-serif", 
                fontSize: 22, 
                fontWeight: 700, 
                marginBottom: 8,
                color: 'var(--text-primary)',
              }}>
                Connect Google Sheet
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                Make sure your Google Sheet is public (Anyone with the link can view). The sheet will auto-sync every Sunday.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>GOOGLE SHEET URL</label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>CLASS ID</label>
                    <input
                      type="text"
                      value={classId}
                      onChange={e => setClassId(e.target.value)}
                      placeholder="CSE_SEM4_2024"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>DEPT</label>
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="CSE"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>SEM</label>
                    <input
                      type="number"
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                      placeholder="4"
                      className="input-field"
                      min="1"
                      max="8"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => setShowSetup(false)}
                  className="btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetup}
                  disabled={setupMutation.isPending}
                  className="btn-primary"
                  style={{ flex: 2 }}
                >
                  {setupMutation.isPending ? <><span className="spinner" />Connecting...</> : 'Connect Sheet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
