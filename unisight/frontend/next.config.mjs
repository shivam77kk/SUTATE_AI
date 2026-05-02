import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      { 
        source: '/api-proxy/:path*', 
        destination: (process.env.NEXT_PUBLIC_API_URL || 'https://sutate-ai.onrender.com/api') + '/:path*'
      },

    ];
  },
};

export default withPWA(nextConfig);