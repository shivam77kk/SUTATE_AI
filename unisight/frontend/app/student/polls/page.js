'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkel } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function PollsPage() {
  const [selectedRating, setSelectedRating] = useState(null);
  const [voted, setVoted] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['student-polls'],
    queryFn: () => api.get('/polls/active').then(r => r.data),
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, rating }) => api.post(`/polls/${pollId}/respond`, { rating }),
    onSuccess: () => {
      qc.invalidateQueries(['student-polls']);
      toast.success('Vote submitted! Thank you for your feedback!');
      setVoted(true);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to submit vote';
      toast.error(msg);
    },
  });

  const activePoll = data?.activePoll;

  const handleVote = () => {
    if (!activePoll || !selectedRating) return;
    voteMutation.mutate({ pollId: activePoll.pollId, rating: selectedRating });
  };

  const ratingEmojis = { 1: '😞', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' };
  const ratingLabels = { 1: 'Very Bad', 2: 'Poor', 3: 'Okay', 4: 'Good', 5: 'Excellent' };
  const ratingColors = { 1: '#f43f5e', 2: '#f97316', 3: '#f59e0b', 4: '#10b981', 5: '#6366f1' };

  return (
    <div className="dashboard-content">
      <PageHeader 
        title="📊 Class Poll" 
        subtitle="Rate this week's class session"
      />

      {isLoading ? (
        <CardSkel height={300} />
      ) : !activePoll || voted ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>{voted ? '✅' : '📊'}</div>
          <p style={{ fontWeight: 600, fontSize: 15, color: '#f1f5f9', marginBottom: 8 }}>
            {voted ? 'Thanks for your feedback!' : 'No active polls right now'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {voted ? 'Your response was recorded.' : 'Check back later for new polls from your faculty'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="chart-container"
          style={{ maxWidth: 480, margin: '0 auto' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Live Poll · {activePoll.facultyName || 'Your Faculty'}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4 }}>
              {activePoll.question}
            </h3>
          </div>

          {/* Rating buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map(r => (
              <motion.button
                key={r}
                onClick={() => setSelectedRating(r)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: 14,
                  background: selectedRating === r ? `${ratingColors[r]}18` : 'rgba(255,255,255,0.03)',
                  border: selectedRating === r ? `2px solid ${ratingColors[r]}` : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: 8,
                  transition: 'all 0.2s',
                  minHeight: 70,
                }}
              >
                <span style={{ fontSize: 28 }}>{ratingEmojis[r]}</span>
                <span style={{ fontSize: 9, color: selectedRating === r ? ratingColors[r] : '#64748b', fontWeight: 600 }}>
                  {r}
                </span>
              </motion.button>
            ))}
          </div>

          {selectedRating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', marginBottom: 20 }}
            >
              <span style={{ 
                fontSize: 14, 
                color: ratingColors[selectedRating], 
                fontWeight: 600 
              }}>
                {ratingEmojis[selectedRating]} {ratingLabels[selectedRating]}
              </span>
            </motion.div>
          )}

          <button
            onClick={handleVote}
            disabled={!selectedRating || voteMutation.isPending}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: !selectedRating ? 'not-allowed' : 'pointer',
              background: selectedRating 
                ? `linear-gradient(135deg, ${ratingColors[selectedRating]}, ${ratingColors[selectedRating]}cc)` 
                : 'rgba(255,255,255,0.04)',
              color: selectedRating ? 'white' : '#64748b',
              opacity: !selectedRating ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 48,
              transition: 'all 0.2s',
            }}
          >
            {voteMutation.isPending ? <><span className="spinner" />Submitting...</> : 'Submit Rating →'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
