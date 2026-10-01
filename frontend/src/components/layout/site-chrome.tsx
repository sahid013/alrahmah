import type { ReactNode } from 'react';
import { PrayerBadge } from '@/components/prayer/prayer-badge';
import { PrayerTimesProvider } from '@/components/prayer/prayer-times-provider';
import { listEvents } from '@/lib/events/repository';
import { Footer } from './footer';
import { Header } from './header';
import { PreFooter } from './pre-footer';

/**
 * Public-website chrome: skip link, header, main, pre-footer, footer and the prayer badge.
 * Used by the `(site)` route group layout and the global 404 page; the dashboard has its own.
 */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const latestEvents = await listEvents({ limit: 4 });

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:p-2"
      >
        Skip to content
      </a>
      <PrayerTimesProvider>
        <Header latestEvents={latestEvents} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <PreFooter />
        <Footer />
        <PrayerBadge />
      </PrayerTimesProvider>
    </>
  );
}
