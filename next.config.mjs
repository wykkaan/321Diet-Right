import withPWA from 'next-pwa';

const nextConfig = {
  experimental: {
    appDir: true,
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

export default pwaConfig(nextConfig);