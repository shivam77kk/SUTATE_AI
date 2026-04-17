import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/status', (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
  res.json({ hasSubmittedThisWeek: false, weekNumber });
});

router.get('/history', (req, res) => {
 
  res.json({ 
    history: [],
    avgMood: 0,
    streak: 0
  });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Check-in saved', flagged: false });
});

export default router;
