import type { ReactNode } from 'react';
import { ConsentProvider } from '@/components/consent/consent-provider';
import { ConsentModeSync } from '@/components/consent/consent-mode-sync';
import { SourceCapture } from '@/components/giving/source-capture';
import { PrayerBadge } from '@/components/prayer/prayer-badge';
import { PrayerTimesProvider } from '@/components/prayer/prayer-times-provider';
import { listEvents } from '@/lib/events/repository';
import { listPrayerOverrides } from '@/lib/prayer/overrides';
import { Footer } from './footer';
import { Header } from './header';
import { PageViewTracker } from './page-view-tracker';
import { PreFooter } from './pre-footer';

/**
 * Public-website chrome: skip link, header, main, pre-footer, footer, the prayer badge and cookie
 * consent (banner + preferences; the dashboard only uses necessary storage, so it has none).
 * Used by the `(site)` route group layout and the global 404 page; the dashboard has its own.
 */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const [latestEvents, prayerOverrides] = await Promise.all([
    listEvents({ limit: 4 }),
    listPrayerOverrides(),
  ]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:p-2"
      >
        Skip to content
      </a>
      <ConsentProvider>
        {/* First, so its PageView is pushed before the page's own events (e.g. ViewContent). */}
        <PageViewTracker />
        <PrayerTimesProvider overrides={prayerOverrides}>
          <Header latestEvents={latestEvents} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <PreFooter />
          <Footer />
          <PrayerBadge />
          <SourceCapture />
          <ConsentModeSync />
        </PrayerTimesProvider>
      </ConsentProvider>
    </>
  );
}
