import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old donate URL → the donations page (the appeal lives at /appeal).
      { source: '/donate', destination: '/donations', permanent: true },
    ];
  },
};

export default nextConfig;
