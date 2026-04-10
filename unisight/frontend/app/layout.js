'use client';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>SUTATE AI — Smart University Data Automation</title>
        <meta name="description" content="AI-powered academic performance automation and analytics platform for universities" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body style={{ background: '#030308', color: 'white', fontFamily: 'Inter, sans-serif' }}>
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{ 
            style: { 
              background: 'rgba(17,17,38,0.85)', 
              backdropFilter: 'blur(20px)',
              color: '#fff', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              fontSize: '13px',
              fontWeight: 500,
            } 
          }} />
        </Providers>
      </body>
    </html>
  );
}
