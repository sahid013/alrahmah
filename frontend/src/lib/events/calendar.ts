import { siteConfig } from '@/config/site';
import { addDaysIso } from './schedule';

/** Month-grid maths for the events calendar (weeks start on Monday). */

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Today's date (YYYY-MM-DD) at the masjid, whatever the visitor's time zone. */
export function todayAtMasjid(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: siteConfig.prayer.timeZone }).format(now);
}

/** A valid "YYYY-MM" month from user input, falling back to the current month. */
export function parseMonth(input: string | undefined, today: string): string {
  return input && MONTH_RE.test(input) ? input : today.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T12:00:00Z`));
}

/** Weeks (Mon–Sun) covering the month, including leading/trailing days from adjacent months. */
export function monthGrid(month: string, today: string): CalendarDay[][] {
  const first = `${month}-01`;
  const mondayOffset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  let cursor = addDaysIso(first, -mondayOffset);
  const weeks: CalendarDay[][] = [];
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: cursor,
        day: Number(cursor.slice(8)),
        inMonth: cursor.startsWith(month),
        isToday: cursor === today,
      });
      cursor = addDaysIso(cursor, 1);
    }
    weeks.push(week);
  } while (cursor.startsWith(month));
  return weeks;
}

export const monthBounds = (month: string) => {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, '0')}` };
};

export type CalendarView = 'month' | 'list';

export interface CalendarState {
  month: string;
  view: CalendarView;
  q?: string;
  category?: string;
}

/** URL for a calendar state. Keeps state in the query string so views are shareable and crawlable. */
export function calendarHref({ month, view, q, category }: CalendarState, hash?: string): string {
  const params = new URLSearchParams({ month });
  if (view !== 'month') params.set('view', view);
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  return `/events?${params.toString()}${hash ? `#${hash}` : ''}`;
}
