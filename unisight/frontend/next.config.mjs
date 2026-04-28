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
        // We are hardcoding the Render URL so Netlify never guesses localhost
        destination: 'https://sutate-ai.onrender.com/api/:path*' 
      },
    ];
  },
};

export default withPWA(nextConfig);