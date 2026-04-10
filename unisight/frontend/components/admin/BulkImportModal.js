'use client';
import { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BulkImportModal({ isOpen, onClose, onRefresh }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a CSV file');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/admin/bulk/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data);
      if (data.failed === 0) toast.success(`Successfully imported ${data.created} users`);
      else toast.success(`Imported ${data.created} users, but ${data.failed} failed.`);
      if (data.created > 0 && onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', width: '90%', maxWidth: '500px', p: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Bulk Import Users</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '24px' }}>×</button>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Upload a CSV file with the following exact headers:<br/>
            <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px', color: 'var(--primary)' }}>name, email, password, role, department, studentid</code>
          </p>

          <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <Upload size={32} style={{ color: file ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', fontWeight: file ? '600' : '400', color: file ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {file ? file.name : 'Click to select CSV file'}
            </div>
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          </label>

          {result && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Rows</div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>{result.total}</div>
                </div>
                <div style={{ flex: 1, color: '#10b981' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Created</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={16}/> {result.created}</div>
                </div>
                <div style={{ flex: 1, color: '#f43f5e' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Failed</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={16}/> {result.failed}</div>
                </div>
              </div>
              
              {result.errors?.length > 0 && (
                <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)', padding: '12px', borderRadius: '8px' }}>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>Row {e.row}: {e.email} — {e.reason}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleUpload} className="btn-primary" disabled={!file || loading}>
            {loading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
