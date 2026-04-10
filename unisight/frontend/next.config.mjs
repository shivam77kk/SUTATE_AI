import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Proxy API to backend so cookies work (same-origin for auth)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const base = apiUrl.replace(/\/$/, '');
    return [
      { source: '/api-proxy/:path*', destination: `${base}/api/:path*` },
    ];
  },
};

export default withPWA(nextConfig);
