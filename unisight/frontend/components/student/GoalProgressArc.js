'use client';
import { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function GoalProgressArc() {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newTarget, setNewTarget] = useState(8.5);

  useEffect(() => { loadGoal(); }, []);

  const loadGoal = async () => {
    try {
      const { data } = await api.get('/goals');
      setGoal(data.goal);
    } catch { 
      toast.error('Failed to load goal');
    } finally { setLoading(false); }
  };

  const saveGoal = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/goals', { targetCgpa: newTarget, semester: 4, academicYear: '2024-25' });
      setGoal(data.goal);
      setEditing(false);
      toast.success('Goal updated');
    } catch {
      toast.error('Failed to update goal');
    } finally { setLoading(false); }
  };

  if (loading && !goal) return <div style={{ height: '240px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>;

  const currentCgpa = goal?.currentCgpa || 7.0; // fallback
  const targetCgpa = goal?.targetCgpa || 8.5;
  const progress = Math.min(100, Math.max(0, (currentCgpa / targetCgpa) * 100));
  const onTrack = goal ? goal.onTrack : true;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Semester Goal</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
        ) : (
          <button onClick={saveGoal} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '13px' }}>Save</button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
        <div style={{ width: '140px', height: '140px' }}>
          <CircularProgressbar 
            value={progress} 
            text={`${currentCgpa.toFixed(2)}`}
            circleRatio={0.75}
            styles={buildStyles({
              rotation: 1 / 2 + 1 / 8,
              strokeLinecap: 'round',
              pathTransitionDuration: 0.5,
              pathColor: onTrack ? '#10b981' : '#f59e0b',
              textColor: 'var(--text-main)',
              trailColor: 'rgba(255,255,255,0.05)',
            })} 
          />
        </div>
        
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Target CGPA</div>
          {editing ? (
            <input type="number" step="0.1" max="10" min="0" value={newTarget} onChange={e => setNewTarget(parseFloat(e.target.value))} style={{ width: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '20px', fontWeight: '700' }} />
          ) : (
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>{targetCgpa.toFixed(2)}</div>
          )}
          
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: onTrack ? '#10b981' : '#f59e0b' }}>
            {onTrack ? '🟢 On Track' : '⚠️ Need Focus'}
          </div>
        </div>
      </div>

      {goal?.requiredActions && (
        <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--primary)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong>AI Advice:</strong> {goal.requiredActions}
        </div>
      )}
    </div>
  );
}
