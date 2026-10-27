'use client';

import { useEffect } from 'react';
import { track, type TrackingEvent } from '@/lib/giving/tracking';

/** Pushes one Tag Manager event when shown (once per tab per event_id, so reloads don't repeat it). */
export function TrackEvent({ event }: { event: TrackingEvent }) {
  useEffect(() => track(event, { once: true }), [event]);
  return null;
}
