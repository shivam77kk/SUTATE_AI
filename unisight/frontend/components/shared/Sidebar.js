'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = {
  student: [
    { href: '/student/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/student/journey',   icon: '🧭', label: 'Academic Journey' },
    { href: '/student/chat',      icon: '🤖', label: 'AI Advisor' },
    { href: '/student/study-plan',icon: '📖', label: 'Study Plan' },
    { href: '/student/goals',     icon: '🎯', label: 'My Goals' },
    { href: '/student/quiz',      icon: '🧠', label: 'Practice Quiz' },
    { href: '/student/profile',   icon: '👤', label: 'Profile' },
    { href: '/student/help',      icon: '🙋', label: 'Help' },
    { href: '/student/checkin',   icon: '💚', label: 'Check-in' },
  ],
  faculty: [
    { href: '/faculty/dashboard',             icon: '🏠', label: 'Dashboard' },
    { href: '/faculty/upload',                icon: '📤', label: 'Upload CSV' },
    { href: '/faculty/sheets',                icon: '🔗', label: 'Google Sheets' },
    { href: '/faculty/classes',               icon: '🏫', label: 'My Classes' },
    { href: '/faculty/effectiveness',         icon: '🎖️', label: 'Effectiveness' },
    { href: '/faculty/polls',                 icon: '📊', label: 'Polls' },
    { href: '/faculty/feedback',              icon: '💬', label: 'Feedback' },
    { href: '/faculty/help-queue',            icon: '🙋', label: 'Help Queue' },
  ],
  admin: [
    { href: '/admin/overview',               icon: '🌐', label: 'Overview' },
    { href: '/admin/ask',                    icon: '💬', label: 'AI Query' },
    { href: '/admin/voice',                  icon: '🎙️', label: 'Voice Assistant' },
    { href: '/admin/curriculum',             icon: '📚', label: 'Curriculum' },
    { href: '/admin/cohort',                 icon: '👥', label: 'Cohorts' },
    { href: '/admin/faculty-effectiveness',  icon: '⭐', label: 'Faculty Stars' },
    { href: '/admin/dept',                   icon: '🏛️', label: 'Departments' },
    { href: '/admin/interventions',          icon: '🎯', label: 'Interventions' },
    { href: '/admin/report',                 icon: '📄', label: 'Reports' },
    { href: '/admin/users',                  icon: '👥', label: 'Users' },
    { href: '/admin/system',                 icon: '⚙️', label: 'System Health' },
    { href: '/admin/logs',                   icon: '📋', label: 'Audit Logs' },
  ],
};

const THEME = {
  student: { accent: '#6366f1', glow: 'rgba(99,102,241,0.2)',  label: 'Student Portal', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  faculty: { accent: '#10b981', glow: 'rgba(16,185,129,0.2)', label: 'Faculty Portal', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  admin:   { accent: '#f59e0b', glow: 'rgba(245,158,11,0.2)', label: 'Admin Portal', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'student';
  const nav = NAV_ITEMS[role] || NAV_ITEMS.student;
  const theme = THEME[role] || THEME.student;

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post('/auth/logout'); } catch {}
    clearUser();
    router.push('/login');
  };

  return (
    <motion.aside 
      className="sidebar" 
      animate={{ width: collapsed ? 68 : 244 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ flexShrink: 0 }}
    >
      {/* Logo */}
      <div style={{ padding: '8px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: theme.gradient,
              boxShadow: `0 4px 18px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'white',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >S</motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-0.01em' }}>SUTATE AI</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {user ? theme.label : 'Connecting...'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User info */}
      <AnimatePresence>
        {!collapsed && user && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: 14, marginBottom: 14,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <motion.div 
                whileHover={{ scale: 1.1 }}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: theme.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                  boxShadow: `0 2px 10px ${theme.glow}`,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </motion.div>
              <NotificationBell userId={user.id || user._id} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            {user.studentId && (
              <div style={{ fontSize: 10, marginTop: 6, padding: '3px 10px', borderRadius: 6, background: `${theme.accent}18`, color: theme.accent, display: 'inline-block', fontWeight: 600, border: `1px solid ${theme.accent}30` }}>
                {user.studentId}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {nav.map((item, idx) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <motion.div 
                className="nav-link" 
                initial={false}
                animate={{
                  backgroundColor: isActive ? `${theme.accent}12` : 'transparent',
                  color: isActive ? theme.accent : '#64748b',
                }}
                whileHover={{ 
                  backgroundColor: isActive ? `${theme.accent}18` : 'rgba(255,255,255,0.05)',
                  x: 3,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  borderLeft: isActive ? `3px solid ${theme.accent}` : '3px solid transparent',
                  paddingLeft: collapsed ? 10 : 12,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-glow"
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 40,
                      background: `radial-gradient(circle at left, ${theme.accent}15, transparent)`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <span style={{ fontSize: 16, flexShrink: 0, position: 'relative', zIndex: 1 }}>{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }} 
                      animate={{ opacity: 1, width: 'auto' }} 
                      exit={{ opacity: 0, width: 0 }}
                      style={{ position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 10 }}>
        <motion.button 
          onClick={() => setCollapsed(!collapsed)} 
          className="nav-link"
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', background: 'none', minHeight: 44 }}
        >
          {collapsed ? <ChevronRight size={16} color="#64748b" /> : <ChevronLeft size={16} color="#64748b" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <motion.button 
          onClick={handleLogout} 
          disabled={loggingOut} 
          className="nav-link"
          whileHover={{ backgroundColor: 'rgba(244,63,94,0.08)' }}
          style={{ width: '100%', color: '#f87171', justifyContent: collapsed ? 'center' : 'flex-start', background: 'none', minHeight: 44 }}
        >
          <LogOut size={16} color="#f87171" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {loggingOut ? 'Logging out…' : 'Logout'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
