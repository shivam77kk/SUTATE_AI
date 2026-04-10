'use client';
import { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { FileText, Download, ShieldCheck, PieChart, School, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NaacExportPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/naac-export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'NAAC-2024-Automation-Export.pdf');
      document.body.appendChild(link);
      link.click();
      toast.success('NAAC Export generated successfully!');
    } catch (err) {
      toast.error('Failed to generate NAAC report. Ensure all data is synced.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-header animate-fadeIn">
        <Link href="/admin/overview" className="back-link">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <h1 className="page-title">📜 NAAC <span className="gradient-text">2024 Compliance</span></h1>
        <p className="page-subtitle">Standardized AQAR evidence exports powered by SUTATE AI</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        {/* Main Export Card */}
        <div className="chart-container animate-slideUp" style={{ background: 'linear-gradient(135deg, #064e3b, #06201a)', border: '1px solid #10b98140' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(16,185,129,0.2)', padding: '16px', borderRadius: '16px' }}>
              <School size={32} color="#34d399" />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9' }}>Criterion 2: AQAR Export</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Teaching-Learning and Evaluation Documentation</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle size={18} color="#10b981" />
              <div style={{ fontSize: '13px', color: '#e2e8f0' }}><strong>2.6.2:</strong> Attainment of Programme Outcomes (POs)</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle size={18} color="#10b981" />
              <div style={{ fontSize: '13px', color: '#e2e8f0' }}><strong>2.6.3:</strong> Pass percentage of Students</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle size={18} color="#10b981" />
              <div style={{ fontSize: '13px', color: '#e2e8f0' }}><strong>2.4.2:</strong> Average annual teaching index</div>
            </div>
          </div>

          <button 
            onClick={handleExport}
            disabled={loading}
            className="btn-primary"
            style={{ 
              width: '100%', 
              height: '56px', 
              fontSize: '16px', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            {loading ? 'Generating Report...' : <><Download size={20} /> Download NAAC 2024 Bundle</>}
          </button>
          
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#059669', marginTop: '16px', fontWeight: '600' }}>
            🔒 Verified by UniSight Blockchain-Integrity Audit
          </p>
        </div>

        {/* Info Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="chart-container">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontWeight: '700', marginBottom: '16px' }}>
              <ShieldCheck size={18} color="#10b981" /> Regulatory Compliance
            </h4>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
              This export is formatted according to the latest NAAC 2024 Revised Accreditation Framework (RAF). It synthesizes real-time data from internal assessments, teacher effectiveness scores, and student retention predictions.
            </div>
          </div>

          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ background: '#3b82f620', padding: '12px', borderRadius: '12px' }}>
              <PieChart size={24} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#f1f5f9' }}>Automated Evidence</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>No manual CSV manipulation required</div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px' }}>
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#d97706', lineHeight: '1.5' }}>
              <strong>Pre-check:</strong> Ensure all faculty members have completed their semester-end data sync before generating the final institutional report.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

function AlertCircle({ size, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}
