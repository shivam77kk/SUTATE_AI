'use client';
import { Award, Star, Zap, Target } from 'lucide-react';

export default function AchievementBadges({ badges = [] }) {
  const displayBadges = badges.length ? badges : [
    { id: 1, name: 'Attendance Pro', icon: <Star size={20}/>, color: '#f59e0b', desc: '100% attendance in 3 subjects' },
    { id: 2, name: 'Comeback Kid', icon: <Zap size={20}/>, color: '#10b981', desc: 'Improved CGPA by 0.5 points' },
    { id: 3, name: 'Goal Crusher', icon: <Target size={20}/>, color: '#6366f1', desc: 'Met last semester target' },
  ];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Award size={20} style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Achievements</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayBadges.map(badge => (
          <div key={badge.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${badge.color}20`, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {badge.icon || <Award size={20}/>}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>{badge.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{badge.desc}</div>
            </div>
          </div>
        ))}
        {displayBadges.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            No badges unlocked yet. Keep studying!
          </div>
        )}
      </div>
    </div>
  );
}
