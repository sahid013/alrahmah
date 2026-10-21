'use client';

import { useEffect, useRef } from 'react';
import { env } from '@/config/env';
import {
  REJECT_ALL,
  googleConsent,
  trackingCookieCategory,
  type ConsentChoices,
} from '@/lib/consent/consent';
import { useConsent } from './consent-provider';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Google's `gtag()`: Consent Mode commands must be pushed as an `arguments` object. */
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  // eslint-disable-next-line prefer-rest-params -- Tag Manager only reads `arguments` objects.
  window.dataLayer.push(arguments);
}

/** Deletes the cookies of each switched-off category, on this host and its parent domains. */
function clearTrackingCookies(choices: ConsentChoices) {
  const parts = window.location.hostname.split('.');
  const domains = [
    '',
    ...parts.slice(0, -1).map((_, i) => `; domain=.${parts.slice(i).join('.')}`),
  ];
  for (const pair of document.cookie.split(';')) {
    const name = pair.split('=')[0]!.trim();
    const category = trackingCookieCategory(name);
    if (!category || choices[category]) continue;
    for (const domain of domains) document.cookie = `${name}=; Path=/; Max-Age=0${domain}`;
  }
}

/**
 * Keeps Google Consent Mode in step with the cookie banner. Tag Manager itself is loaded on every
 * page by the root layout (`lib/consent/gtm.ts`), with everything denied until the saved choice
 * is applied. When the visitor makes or changes a choice here, this sends a Consent Mode update
 * plus a `consent_update` event (for tags that should fire as soon as consent is given), and
 * clears the cookies of any category they switched off.
 */
export function ConsentModeSync() {
  const { ready, choices } = useConsent();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !env.gtmId) return;
    const current = choices ?? REJECT_ALL;
    const key = JSON.stringify(googleConsent(current));
    // The first value is what the <head> script already applied from the cookie.
    if (applied.current === null) {
      applied.current = key;
    } else if (applied.current !== key) {
      applied.current = key;
      gtag('consent', 'update', googleConsent(current));
      window.dataLayer!.push({ event: 'consent_update' });
    }
    clearTrackingCookies(current);
  }, [ready, choices]);

  return null;
}
