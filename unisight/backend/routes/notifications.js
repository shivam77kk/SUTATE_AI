import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
const router = express.Router();
router.get('/', authenticate, getNotifications);
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;
    const PushSubscription = (await import('../models/PushSubscription.js')).default;
    await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      { userId: req.user.userId, subscription, updatedAt: new Date() },
      { upsert: true }
    );
    res.status(201).json({ message: 'Subscribed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markRead);
export default router;
