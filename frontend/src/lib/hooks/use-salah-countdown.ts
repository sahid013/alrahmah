'use client';

import { getNextSalah, type Salah } from '@/lib/prayer-times';
import { useNowSeconds } from './use-now';

const pad = (n: number) => String(n).padStart(2, '0');

export interface SalahCountdown {
  /** Current time, or null during server render / hydration. */
  now: Date | null;
  next: Salah | null;
  /** Zero-padded parts, "--" before the clock is known. */
  hours: string;
  minutes: string;
  seconds: string;
}

/** Live countdown to the next salah, ticking every second. Shared by every prayer widget. */
export function useSalahCountdown(): SalahCountdown {
  const nowSeconds = useNowSeconds();
  if (nowSeconds === null) {
    return { now: null, next: null, hours: '--', minutes: '--', seconds: '--' };
  }
  const now = new Date(nowSeconds * 1000);
  const next = getNextSalah(now);
  const remaining = Math.max(0, Math.floor((next.time.getTime() - now.getTime()) / 1000));
  return {
    now,
    next,
    hours: pad(Math.floor(remaining / 3600)),
    minutes: pad(Math.floor((remaining % 3600) / 60)),
    seconds: pad(remaining % 60),
  };
}
