'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { TableSkel, CardSkel } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import toast from 'react-hot-toast';
import Link from 'next/link';

const ROLES = ['student', 'faculty', 'admin'];

function UserModal({ user, onClose, onSave, loading, error }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'student',
    department: user?.department || '',
    studentId: user?.studentId || '',
    semester: user?.semester || '',
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const isStudentIdValid = form.role !== 'student' || form.studentId.trim().length > 0;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {[
          { field: 'name', label: 'FULL NAME', placeholder: 'Full name', type: 'text' },
          { field: 'email', label: 'EMAIL', placeholder: 'email@university.edu', type: 'email' },
          { field: 'department', label: 'DEPARTMENT', placeholder: 'e.g. Computer Science', type: 'text' },
        ].map(({ field, label, placeholder, type }) => (
          <div key={field}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: '0.07em' }}>{label}</label>
            <input type={type} value={form[field]} onChange={e => update(field, e.target.value)} placeholder={placeholder} className="input-field" />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: '0.07em' }}>ROLE</label>
          <select value={form.role} onChange={e => update('role', e.target.value)} className="input-field">
            {ROLES.map(r => <option key={r} value={r} style={{ background: '#0d0d1f' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        {form.role === 'student' && (
          <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: '0.07em' }}>STUDENT ID <span style={{ color: '#f43f5e' }}>*</span></label>
              <input value={form.studentId} onChange={e => update('studentId', e.target.value.toUpperCase())}
                placeholder="e.g. CS21001" className="input-field"
                style={{ borderColor: !isStudentIdValid ? 'rgba(244,63,94,0.5)' : '' }} />
              {!isStudentIdValid && <p style={{ fontSize: 11, color: '#fb7185', marginTop: 5 }}>Student ID is required for student accounts</p>}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: '0.07em' }}>SEMESTER</label>
              <input type="number" min={1} max={8} value={form.semester} onChange={e => update('semester', e.target.value)} placeholder="1-8" className="input-field" />
            </div>
          </>
        )}
        {!user && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: '0.07em' }}>PASSWORD</label>
            <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Temporary password" className="input-field" />
            <p style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>User will be asked to change this on first login.</p>
          </div>
        )}
      </div>
      {error && <p style={{ color: '#fb7185', fontSize: 12, marginBottom: 14 }}>{error}</p>}
      <button onClick={() => onSave(form)} disabled={loading || !isStudentIdValid} style={{
        width: '100%', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
        background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: 'white', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? <><span className="spinner" />{user ? 'Saving...' : 'Creating...'}</> : user ? 'Save changes' : 'Create user'}
      </button>
    </div>
  );
}

export default function UsersPage() {
  const [tab, setTab] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [modalError, setModalError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', tab, page, search],
    queryFn: () => api.get('/admin/users', { params: { role: tab === 'all' ? undefined : tab, page, search } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/users', data),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setModalOpen(false); setModalError(''); toast.success('User created ✓'); },
    onError: (err) => setModalError(err.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }) => api.patch(`/admin/users/${userId}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setModalOpen(false); setModalError(''); toast.success('User updated ✓'); },
    onError: (err) => setModalError(err.response?.data?.message || 'Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ userId, active }) => api.patch(`/admin/users/${userId}`, { active }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Account status updated ✓'); },
    onError: () => toast.error('Failed to update'),
  });

  const bulkDeactivate = async () => {
    try {
      await api.post('/admin/users/bulk-deactivate', { userIds: selected });
      qc.invalidateQueries(['admin-users']);
      setSelected([]);
      toast.success(`${selected.length} accounts deactivated`);
    } catch { toast.error('Bulk action failed'); }
  };

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="dashboard-content">
      <PageHeader title="👥 User Management" subtitle="Manage student, faculty, and admin accounts"
        action={
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/admin/users/bulk" style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              📥 Bulk Import
            </Link>
            <button onClick={() => { setEditUser(null); setModalError(''); setModalOpen(true); }} style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
              + Add User
            </button>
          </div>
        } 
      />

      <Tabs tabs={['all', 'student', 'faculty', 'admin'].map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))} active={tab} onChange={t => { setTab(t); setPage(1); }} />

      <div style={{ display: 'flex', gap: 12, margin: '20px 0', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..."
          className="input-field" style={{ maxWidth: 280 }} />
        {selected.length > 0 && (
          <button onClick={bulkDeactivate} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
            Deactivate {selected.length} selected
          </button>
        )}
      </div>

      {isLoading ? <TableSkel rows={6} /> : (
        <div className="chart-container">
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={e => setSelected(e.target.checked ? users.map(u => u._id) : [])} /></th>
                <th>Name</th><th>Email</th><th>Role</th><th>Student ID</th><th>Dept</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td><input type="checkbox" checked={selected.includes(u._id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, u._id] : prev.filter(id => id !== u._id))} /></td>
                  <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{u.email}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', background: { student: 'rgba(99,102,241,0.12)', faculty: 'rgba(16,185,129,0.12)', admin: 'rgba(245,158,11,0.12)' }[u.role], color: { student: '#818cf8', faculty: '#34d399', admin: '#fbbf24' }[u.role] }}>{u.role}</span></td>
                  <td style={{ fontFamily: 'monospace', color: '#64748b', fontSize: 12 }}>{u.studentId || '--'}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{u.department || '--'}</td>
                  <td>
                    <button onClick={() => deactivateMutation.mutate({ userId: u._id, active: !u.active })} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, border: 'none', cursor: 'pointer', background: u.active ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)', color: u.active ? '#10b981' : '#f43f5e', fontWeight: 700, minHeight: 28 }}>
                      {u.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => { setEditUser(u); setModalError(''); setModalOpen(true); }} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', minHeight: 36 }}>Edit</button>
                    <button onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u._id); }} style={{ fontSize: 12, color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', minHeight: 36 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0' }}>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  background: page === i + 1 ? '#6366f1' : 'rgba(255,255,255,0.04)',
                  color: page === i + 1 ? 'white' : '#64748b',
                }}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setModalError(''); }} title={editUser ? 'Edit User' : 'Create New User'} maxWidth={500}>
        <UserModal user={editUser} error={modalError}
          loading={createMutation.isPending || updateMutation.isPending}
          onSave={(form) => {
            if (editUser) updateMutation.mutate({ userId: editUser._id, data: form });
            else createMutation.mutate(form);
          }} />
      </Modal>
    </div>
  );
}
