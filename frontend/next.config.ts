import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The appeal page moved from /donate to /appeal; keep old links working.
      { source: '/donate', destination: '/appeal', permanent: true },
    ];
  },
};

export default nextConfig;
