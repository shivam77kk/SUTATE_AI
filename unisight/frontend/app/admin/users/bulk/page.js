'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BulkUserPage() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (formData) => api.post('/admin/bulk/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
    onSuccess: (data) => {
      setResults(data);
      qc.invalidateQueries(['admin-users']);
      if (data.created > 0) toast.success(`Successfully imported ${data.created} users`);
      if (data.errors?.length > 0) toast.error(`${data.errors.length} errors found`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to upload file');
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        toast.error('Only CSV files are supported');
        return;
      }
      setFile(selected);
      setResults(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="dashboard-content">
      <PageHeader 
        title="📥 Bulk User Import" 
        subtitle="Upload a CSV file to create multiple student or faculty accounts at once" 
        action={
          <Link href="/admin/users" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
            ← Back to Users
          </Link>
        }
      />

      <div className="grid-2" style={{ gap: 24 }}>
        <div className="chart-container">
          <div className="chart-title">Upload CSV</div>
          
          <div 
            style={{ 
              border: '2px dashed rgba(255,255,255,0.1)', 
              borderRadius: 12, 
              padding: 40, 
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              marginBottom: 20
            }}
          >
            <input 
              type="file" 
              accept=".csv" 
              id="csv-upload" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="csv-upload" 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 12 
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                📄
              </div>
              <div>
                <span style={{ color: '#818cf8', fontWeight: 600 }}>Click to select a CSV file</span>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Maximum file size: 5MB</p>
              </div>
            </label>
            
            {file && (
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: '#34d399', fontSize: 14, fontWeight: 500 }}>
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
            style={{
              width: '100%', padding: 14, borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
              color: 'white', fontWeight: 700, fontSize: 15, cursor: !file ? 'not-allowed' : 'pointer',
              opacity: !file || uploadMutation.isPending ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            {uploadMutation.isPending ? <span className="spinner" /> : '🚀 Import Users'}
          </button>
        </div>

        <div>
          <div className="chart-container" style={{ marginBottom: 24 }}>
            <div className="chart-title">CSV Template Format</div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Your CSV file must include the following headers exactly as shown:
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#a78bfa', overflowX: 'auto', marginBottom: 16 }}>
              name,email,role,department,studentId,semester
            </div>
            <ul style={{ fontSize: 13, color: '#94a3b8', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>name</strong>: Full name of the user</li>
              <li><strong>email</strong>: University email address (used for login)</li>
              <li><strong>role</strong>: Must be 'student' or 'faculty'</li>
              <li><strong>department</strong>: e.g. "Computer Science"</li>
              <li><strong>studentId</strong>: Required for students (e.g. S001)</li>
              <li><strong>semester</strong>: Required for students (number 1-8)</li>
            </ul>
          </div>

          {results && (
            <div className="chart-container" style={{ border: `1px solid ${results.errors?.length > 0 ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
              <div className="chart-title">Import Results</div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                <div style={{ padding: '10px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{results.created || 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Imported</div>
                </div>
                <div style={{ padding: '10px 16px', background: 'rgba(244,63,94,0.1)', borderRadius: 8, flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f43f5e' }}>{results.errors?.length || 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Failed</div>
                </div>
              </div>

              {results.errors?.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f43f5e', marginBottom: 8 }}>Error Details:</div>
                  {results.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#fb7185', padding: '6px 0', borderBottom: '1px solid rgba(244,63,94,0.1)' }}>
                      Row {err.row}: {err.reason || err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
