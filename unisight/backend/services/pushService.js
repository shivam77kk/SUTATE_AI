import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import dotenv from 'dotenv';
dotenv.config();

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const sendNotification = async (userId, title, body, url = '/') => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    const notifications = subscriptions.map(sub => {
      const payload = JSON.stringify({ title, body, url });
      return webpush.sendNotification(sub.subscription, payload)
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expired or no longer valid
            await PushSubscription.deleteOne({ _id: sub._id });
          }
        });
    });
    await Promise.all(notifications);
  } catch (err) {
    console.error('[PushService] Error:', err);
  }
};

export const broadcastToClass = async (classId, title, body, url) => {
  // Implementation for broadcasting (needs mapping of users to classes)
  // This is a placeholder for now
};
