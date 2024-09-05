import withPWA from 'next-pwa';

const nextConfig = {
  images: {
    domains: ['ywevkpnljnlzknydqyld.supabase.co'],
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

export default pwaConfig(nextConfig);