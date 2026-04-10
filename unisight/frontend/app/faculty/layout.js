'use client';
import Sidebar from '@/components/shared/Sidebar';
import FacultyThreeBackground from '@/components/shared/FacultyThreeBackground';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';

export default function FacultyLayout({ children }) {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        if (data.user.isFirstLogin) {
          router.replace('/change-password');
        } else if (data.user.role !== 'faculty') {
          router.replace(`/${data.user.role === 'student' ? 'student' : 'admin'}/dashboard`);
        } else {
          setVerified(true);
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, []);

  if (!verified) return null;

  return (
    <div className="dashboard-layout" style={{ position: 'relative' }}>
      <FacultyThreeBackground />
      {/* Mesh gradient overlay */}
      <div style={{ 
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse at 15% 25%, rgba(16,185,129,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 75%, rgba(14,165,233,0.04) 0%, transparent 50%)
        `,
      }} />
      <Sidebar />
      <main style={{ 
        flex: 1, overflowY: 'auto', minHeight: '100vh', 
        background: 'transparent', position: 'relative', zIndex: 1,
      }}>
        {children}
      </main>
    </div>
  );
}
