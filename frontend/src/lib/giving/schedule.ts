import type { DailyGiving } from '@/lib/donations/types';
import { atLocalTime } from '@/lib/prayer-times';

/**
 * Daily giving (Last 10 Nights, First 10 Days of Dhul Hijjah): one payment on each night/day,
 * at the cause's `chargeTime` in UK time. Pure functions, shared by the form and the server.
 */

/** What a daily donor has signed up for (ISO times; shown on the thank-you screens). */
export interface DailyPlan {
  amount: number;
  count: number;
  firstCharge: string;
  lastCharge: string;
}

const DAY_MS = 86_400_000;
/** A payment needs to be at least this far ahead to still be scheduled. */
const LEAD_MS = 15 * 60_000;

/** Every payment time for the cause, in order. */
export function chargeTimes(giving: DailyGiving): Date[] {
  const [y, m, d] = giving.firstDate.split('-').map(Number) as [number, number, number];
  return Array.from({ length: giving.count }, (_, i) => {
    // Walk calendar days in UTC, then place the wall-clock time in UK time (DST-aware).
    const day = new Date(Date.UTC(y, m - 1, d) + i * DAY_MS);
    return atLocalTime(
      day.getUTCFullYear(),
      day.getUTCMonth() + 1,
      day.getUTCDate(),
      giving.chargeTime,
    );
  });
}

/** Payments still to come (each at least 15 minutes away). */
export const remainingCharges = (giving: DailyGiving, now = new Date()) =>
  chargeTimes(giving).filter((t) => t.getTime() - now.getTime() >= LEAD_MS);

export type DailyStatus = 'upcoming' | 'running' | 'closed';

/** `upcoming` before the first payment, `running` part-way, `closed` once none are left. */
export function dailyStatus(giving: DailyGiving, now = new Date()): DailyStatus {
  const left = remainingCharges(giving, now).length;
  return left === 0 ? 'closed' : left === giving.count ? 'upcoming' : 'running';
}

const dayMonth = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/London',
});
const dayMonthYear = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/London',
});

/** "27 Feb – 8 Mar 2027" for a list of payment times. */
export function dateRange(times: Date[]): string {
  const first = times[0];
  const last = times.at(-1);
  if (!first || !last) return '';
  return first.getTime() === last.getTime()
    ? dayMonthYear.format(first)
    : `${dayMonth.format(first)} – ${dayMonthYear.format(last)}`;
}

/** "21:00" → "9pm", "09:30" → "9:30am". */
export function formatClock(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

/** "night" / "nights", "day" / "days". */
export const unitLabel = (giving: DailyGiving, n: number) => `${giving.unit}${n === 1 ? '' : 's'}`;
