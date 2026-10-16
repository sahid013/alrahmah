import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The donation flow moved from /give to /donate.
      { source: '/give', destination: '/donate', permanent: true },
      { source: '/give/:path*', destination: '/donate/:path*', permanent: true },
      // Causes are now Masjid Expansion, Fitrana, Last 10 Nights and First 10 Days of Dhul
      // Hijjah (client, October 2026). The new building appeal became Masjid Expansion; links to
      // removed causes go to "Select your cause".
      { source: '/donate/new-building', destination: '/donate/masjid-expansion', permanent: false },
      {
        source:
          '/donate/:old(masjid-maintenance|masjid-renovations|sadaqah|general-sadaqah|zakaat|zakaah|daily-iftar|jummah-giving|my-masjid|regular-giving)',
        destination: '/donate',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
