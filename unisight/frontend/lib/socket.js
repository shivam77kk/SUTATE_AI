// import { io } from 'socket.io-client';
// let socket;
// export function getSocket() {
//   if (!socket) {
//     socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://sutate-ai.onrender.com', {
//       withCredentials: true,
//       transports: ['websocket'],
//       autoConnect: true,
//     });
//   }
//   return socket;
// }
// export function disconnectSocket() {
//   if (socket) {
//     socket.disconnect();
//     socket = null;
//   }
// }

import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    // 🚀 HARDCODED RENDER URL: Bypassing Netlify's environment variables entirely
    socket = io('https://sutate-ai.onrender.com', {
      withCredentials: true,
      // 🛡️ FALLBACK ADDED: 'polling' guarantees connection even on strict university Wi-Fi
      transports: ['polling', 'websocket'], 
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
