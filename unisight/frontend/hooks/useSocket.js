'use client';
import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';

/**
 * useSocket — join a Socket.IO room and listen to events
 * @param {string} room - room name e.g. "upload-abc123"
 * @param {{ [event]: callback }} events - map of socket events to handlers
 * @param {string} joinEvent - event to emit when joining e.g. "join-upload"
 * @param {string} joinPayload - payload for the join event
 */
export function useSocket(joinEvent, joinPayload, events = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!joinPayload) return;
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit(joinEvent, joinPayload);

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [joinPayload]);

  return socketRef.current;
}

export default useSocket;
