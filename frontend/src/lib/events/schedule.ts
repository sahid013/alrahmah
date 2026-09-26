import { WEEKDAYS, type EventItem, type EventOccurrence, type EventSchedule } from './types';

/** Pure schedule helpers — safe for server and client components. */

export const EVENTS_PAGE = '/events';

/** Where "Learn more" goes: the event's `href`, or its page at /events/[id]. */
export const getEventHref = (event: EventItem) => event.href ?? `${EVENTS_PAGE}/${event.id}`;

const DAY_MS = 86_400_000;
const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);
export const addDaysIso = (iso: string, days: number) =>
  toIso(new Date(toDate(iso).getTime() + days * DAY_MS));
export const weekdayOf = (iso: string) => WEEKDAYS[toDate(iso).getUTCDay()]!;

/** Whether the event happens on `iso` (YYYY-MM-DD). */
export function occursOn(schedule: EventSchedule, iso: string): boolean {
  if (schedule.kind === 'once') return schedule.date === iso;
  if (schedule.weekday !== weekdayOf(iso)) return false;
  if (schedule.from && iso < schedule.from) return false;
  if (schedule.until && iso > schedule.until) return false;
  return !schedule.exceptDates?.includes(iso);
}

/** Clock-time sort key; events without a start time sort after timed ones, then by title. */
const sortKey = (o: EventOccurrence) =>
  `${o.date} ${o.event.schedule.startTime ?? '99:99'} ${o.event.title}`;

/** All occurrences between `start` and `end` (inclusive, ISO dates), sorted by date and time. */
export function occurrencesInRange(
  events: EventItem[],
  start: string,
  end: string,
): EventOccurrence[] {
  const out: EventOccurrence[] = [];
  for (let iso = start; iso <= end; iso = addDaysIso(iso, 1)) {
    for (const event of events) if (occursOn(event.schedule, iso)) out.push({ event, date: iso });
  }
  return out.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

/** Next date (ISO) the event happens on or after `today`, or null if it never will. */
export function nextOccurrence(schedule: EventSchedule, today: string): string | null {
  if (schedule.kind === 'once') return schedule.date >= today ? schedule.date : null;
  for (let i = 0; i < 400; i++) {
    const iso = addDaysIso(today, i);
    if (schedule.until && iso > schedule.until) return null;
    if (occursOn(schedule, iso)) return iso;
  }
  return null;
}

const formatClock = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
};

/** Time text for an occurrence, e.g. "7pm – 8:30pm", "After Asr", or "". */
export function formatTime(schedule: EventSchedule): string {
  if (schedule.startTime) {
    return schedule.endTime
      ? `${formatClock(schedule.startTime)} – ${formatClock(schedule.endTime)}`
      : formatClock(schedule.startTime);
  }
  return schedule.time ?? '';
}

const longDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** e.g. "Every Friday · After Asr" or "Sunday 10 May 2026 · 12pm". */
export function formatSchedule(schedule: EventSchedule): string {
  const time = formatTime(schedule);
  const when =
    schedule.kind === 'weekly'
      ? `Every ${schedule.weekday}`
      : longDate.format(toDate(schedule.date)).replace(',', '');
  return time ? `${when} · ${time}` : when;
}

/** Schedule text to show for an event: its exact label, or the formatted schedule. */
export const eventScheduleText = (event: EventItem) =>
  event.scheduleLabel ?? formatSchedule(event.schedule);
