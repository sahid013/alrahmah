'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ACCEPT_ALL, REJECT_ALL } from '@/lib/consent/consent';
import { useConsent } from './consent-provider';

/**
 * First-visit cookie notice, fixed to the bottom of the screen above the prayer badge. "Accept
 * all" and "Reject all" look the same (equal prominence, as the ICO requires); nothing optional
 * runs until one is chosen. It doesn't block the page or take focus.
 */
export function CookieBanner() {
  const { save, openPreferences } = useConsent();

  return (
    <section
      aria-labelledby="cookie-banner-title"
      className="animate-fade fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white text-neutral-600"
    >
      <Container className="flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-6">
        <div className="max-w-3xl">
          <h2
            id="cookie-banner-title"
            className="font-label text-sm font-bold tracking-[0.15em] text-secondary-700 uppercase"
          >
            Cookies on this site
          </h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base">
            We use cookies that the site needs to work. With your permission we&apos;d also like to
            remember how you found us when you donate, and load the map from Google Maps. Read our{' '}
            <Link
              href="/cookies"
              className="text-primary-500 underline underline-offset-4 hover:text-secondary-700"
            >
              cookie policy
            </Link>
            .
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
          <Button size="sm" onClick={() => save(ACCEPT_ALL)}>
            Accept all
          </Button>
          <Button size="sm" onClick={() => save(REJECT_ALL)}>
            Reject all
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openPreferences}
            className="col-span-2 sm:col-span-1"
          >
            Manage cookies
          </Button>
        </div>
      </Container>
    </section>
  );
}
