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
    // 🚀 FLEXIBLE URL: Bypassing hardcoded URLs when env vars are present
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                     process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                     'https://sutate-ai.onrender.com';

    socket = io(socketUrl, {
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
