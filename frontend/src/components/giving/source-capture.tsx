'use client';

import { useEffect } from 'react';
import { useConsent } from '@/components/consent/consent-provider';
import { captureSource, clearSource, rememberArrival } from '@/lib/giving/attribution';

/**
 * Records where the visitor came from (see `lib/giving/attribution.ts`): stored for the session
 * only with "Donation source" consent (turning it off forgets it); without, the arrival page's
 * campaign tags are kept in memory.
 */
export function SourceCapture() {
  const { ready, allows } = useConsent();
  const allowed = allows('source');
  useEffect(() => rememberArrival(window.location, document.referrer), []);
  useEffect(() => {
    if (!ready) return;
    if (allowed) captureSource(window.location, document.referrer);
    else clearSource();
  }, [ready, allowed]);
  return null;
}
