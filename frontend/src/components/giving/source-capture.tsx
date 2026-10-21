'use client';

import { useEffect } from 'react';
import { useConsent } from '@/components/consent/consent-provider';
import { captureSource, clearSource } from '@/lib/giving/attribution';

/**
 * Records where the visitor came from (see `lib/giving/attribution.ts`), only with "Donation
 * source" consent. Turning it off forgets what was stored.
 */
export function SourceCapture() {
  const { ready, allows } = useConsent();
  const allowed = allows('source');
  useEffect(() => {
    if (!ready) return;
    if (allowed) captureSource(window.location, document.referrer);
    else clearSource();
  }, [ready, allowed]);
  return null;
}
