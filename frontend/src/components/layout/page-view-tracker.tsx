'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { newId, track } from '@/lib/giving/tracking';

/**
 * PageView in the dataLayer on every public page: the first load and each in-app navigation
 * (Next.js changes pages without reloading, so GTM's own page load fires only once).
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track({
      event: 'PageView',
      event_id: `PageView-${newId()}`,
      page_path: pathname,
      page_location: window.location.href,
    });
  }, [pathname]);
  return null;
}
