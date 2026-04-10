'use client';
import { useState } from 'react';
import api from '@/lib/axios';

export function usePush() {
  const [subscribed, setSubscribed] = useState(false);

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });
      await api.post('/notifications/subscribe', { subscription: sub.toJSON() });
      setSubscribed(true);
    } catch (err) {
      console.error('[Push] Subscription failed:', err);
    }
  }

  return { subscribed, subscribe };
}

export default usePush;
