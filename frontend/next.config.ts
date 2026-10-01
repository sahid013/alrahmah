import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The donation flow moved from /give to /donate.
      { source: '/give', destination: '/donate', permanent: true },
      { source: '/give/:path*', destination: '/donate/:path*', permanent: true },
      // Causes were reduced to three (New Building, Masjid Maintenance, Zakaat).
      { source: '/donate/zakaah', destination: '/donate/zakaat', permanent: false },
      {
        source: '/donate/masjid-renovations',
        destination: '/donate/masjid-maintenance',
        permanent: false,
      },
      {
        source: '/donate/:old(daily-iftar|jummah-giving|my-masjid|regular-giving|general-sadaqah)',
        destination: '/donate',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
