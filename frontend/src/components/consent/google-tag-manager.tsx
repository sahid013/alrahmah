'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { env } from '@/config/env';
import { REJECT_ALL, googleConsent, isTrackingCookie } from '@/lib/consent/consent';
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

/** Deletes Google Analytics / Ads and Meta pixel cookies on this host and its parent domains. */
function clearTrackingCookies() {
  const parts = window.location.hostname.split('.');
  const domains = [
    '',
    ...parts.slice(0, -1).map((_, i) => `; domain=.${parts.slice(i).join('.')}`),
  ];
  for (const pair of document.cookie.split(';')) {
    const name = pair.split('=')[0]!.trim();
    if (!isTrackingCookie(name)) continue;
    for (const domain of domains) document.cookie = `${name}=; Path=/; Max-Age=0${domain}`;
  }
}

/**
 * Google Tag Manager (container `NEXT_PUBLIC_GTM_ID`), loaded only once the visitor allows
 * Analytics or Marketing. Before the container loads, Consent Mode defaults to everything denied
 * and is then updated to the visitor's choice, so tags in the container only do what was allowed
 * (each tag must have its consent settings set in Tag Manager, e.g. the Meta pixel needs
 * `ad_storage`). Changing the choice updates Consent Mode; withdrawing both clears the tracking
 * cookies and reloads the page so the container is gone. No <noscript> fallback: without
 * JavaScript nobody can give consent.
 */
export function GoogleTagManager() {
  const { ready, choices } = useConsent();
  const [load, setLoad] = useState(false);
  const started = useRef(false);
  const allowed = !!choices && (choices.analytics || choices.marketing);

  useEffect(() => {
    if (!ready || !env.gtmId) return;
    if (allowed && choices) {
      if (!started.current) {
        started.current = true;
        gtag('consent', 'default', { ...googleConsent(REJECT_ALL), wait_for_update: 500 });
        gtag('consent', 'update', googleConsent(choices));
        window.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        setLoad(true);
      } else {
        gtag('consent', 'update', googleConsent(choices));
      }
    } else if (started.current) {
      // Both withdrawn after the container loaded: stop it storing anything, forget it, reload.
      gtag('consent', 'update', googleConsent(REJECT_ALL));
      clearTrackingCookies();
      window.location.reload();
    } else {
      clearTrackingCookies();
    }
  }, [ready, allowed, choices]);

  if (!load || !env.gtmId) return null;
  return (
    <Script
      id="google-tag-manager"
      src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(env.gtmId)}`}
      strategy="afterInteractive"
    />
  );
}
