'use client';
import Sidebar from '@/components/shared/Sidebar';
import StudentThreeBackground from '@/components/shared/StudentThreeBackground';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';

export default function StudentLayout({ children }) {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        if (data.user.isFirstLogin) {
          router.replace('/change-password');
        } else if (data.user.role !== 'student') {
          router.replace(`/${data.user.role}/dashboard`);
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
    <div key={`student-portal-main`} className="dashboard-layout" style={{ position: 'relative' }}>
      <StudentThreeBackground />
      {/* Mesh gradient overlay */}
      <div style={{ 
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse at 20% 15%, rgba(99,102,241,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 75% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)
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
