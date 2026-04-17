'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export function Providers({ children }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
    },
  }));

  useEffect(() => {
    const socket = getSocket();
    const handleRefresh = () => {
      qc.invalidateQueries();
    };
    
    // Listen for global data updates
    socket.on('dashboard:refresh', handleRefresh);
    
    return () => {
      socket.off('dashboard:refresh', handleRefresh);
    };
  }, [qc]);

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
