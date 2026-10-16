import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';
import { siteConfig } from '@/config/site';
import { PRAYER_TIMETABLE_2026 } from './prayer-timetable-2026';

/**
 * Prayer times for the masjid. Uses the masjid's **published timetable** (start + jama'ah times)
 * for years that have one, and falls back to an astronomical calculation otherwise. This module is
 * the only place that knows how times are produced; components never change.
 *
 * Adding next year: run scripts/import-prayer-timetable.py on the new spreadsheet and add the
 * generated table to `PUBLISHED` below.
 */

export type SalahId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface Salah {
  id: SalahId;
  /** Display name, e.g. "Asr" or "Jumu'ah" on Fridays. */
  name: string;
  /** Start (adhan) time. */
  time: Date;
  /** Congregation time, when the masjid publishes one. */
  jamaah?: Date;
}

export interface DayTimetable {
  /** Noon of the masjid's local day, handy for formatting. */
  date: Date;
  isFriday: boolean;
  salah: Salah[];
  sunrise: Date;
  /** `published` = the masjid's own timetable; `calculated` = astronomical fallback. */
  source: 'published' | 'calculated';
}

/** Published timetables by year: "MM-DD" → space-separated UK clock times (see the generator). */
const PUBLISHED: Record<number, Record<string, string>> = { 2026: PRAYER_TIMETABLE_2026 };

const { latitude, longitude, timeZone, method, madhab } = siteConfig.prayer;
const coordinates = new Coordinates(latitude, longitude);

const params = CalculationMethod[method]();
params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);

const SALAH_NAMES: Record<SalahId, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const DAY_MS = 24 * 60 * 60 * 1000;

const dateParts = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
});

/** The masjid's local calendar date for an instant, regardless of the visitor's time zone. */
function localDay(instant: Date) {
  const parts = Object.fromEntries(dateParts.formatToParts(instant).map((p) => [p.type, p.value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return {
    date: new Date(year, month - 1, day),
    year,
    month,
    day,
    isFriday: parts.weekday === 'Fri',
  };
}

const offsetParts = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

/** Minutes the masjid's clock is ahead of UTC at `instant` (0 in winter, 60 in BST). */
function utcOffsetMinutes(instant: number): number {
  const p = Object.fromEntries(
    offsetParts.formatToParts(new Date(instant)).map((x) => [x.type, Number(x.value)]),
  );
  return (Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!) - instant) / 60_000;
}

/** The instant when the masjid's clock shows `hhmm` on the given local date (DST-aware). */
export function atLocalTime(year: number, month: number, day: number, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, h, m);
  const guess = wall - utcOffsetMinutes(wall) * 60_000;
  // Re-check with the offset at the guessed instant (matters only near a clock change).
  return new Date(wall - utcOffsetMinutes(guess) * 60_000);
}

const named = (id: SalahId, isFriday: boolean) =>
  id === 'dhuhr' && isFriday ? "Jumu'ah" : SALAH_NAMES[id];

/** The published timetable for a local day, if the masjid has published that year. */
function publishedDay(day: ReturnType<typeof localDay>): DayTimetable | undefined {
  const key = `${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
  const row = PUBLISHED[day.year]?.[key];
  if (!row) return undefined;
  const at = (hhmm: string) => atLocalTime(day.year, day.month, day.day, hhmm);
  const [fajr, fajrJ, sunrise, dhuhr, dhuhrJ, asr, asrJ, maghrib, isha, ishaJ] = row
    .split(' ')
    .map(at);
  const salah = (id: SalahId, time: Date, jamaah?: Date): Salah => ({
    id,
    name: named(id, day.isFriday),
    time,
    ...(jamaah && { jamaah }),
  });
  return {
    date: dhuhr!,
    isFriday: day.isFriday,
    sunrise: sunrise!,
    source: 'published',
    salah: [
      salah('fajr', fajr!, fajrJ),
      salah('dhuhr', dhuhr!, dhuhrJ),
      salah('asr', asr!, asrJ),
      salah('maghrib', maghrib!),
      salah('isha', isha!, ishaJ),
    ],
  };
}

/** Full timetable (five salah + sunrise) for the masjid's local day containing `instant`. */
export function getDayTimetable(instant: Date): DayTimetable {
  const day = localDay(instant);
  const published = publishedDay(day);
  if (published) return published;

  const times = new PrayerTimes(coordinates, day.date, params);
  return {
    date: times.dhuhr,
    isFriday: day.isFriday,
    sunrise: times.sunrise,
    source: 'calculated',
    salah: (Object.keys(SALAH_NAMES) as SalahId[]).map((id) => ({
      id,
      name: named(id, day.isFriday),
      time: times[id],
    })),
  };
}

/** The five daily salah for the masjid's local day containing `instant`. */
export const getDailySalah = (instant: Date): Salah[] => getDayTimetable(instant).salah;

/** The next salah after `now` (rolls over to tomorrow's Fajr after Isha). */
export function getNextSalah(now: Date): Salah {
  const upcoming = getDailySalah(now).find((salah) => salah.time > now);
  return upcoming ?? getDailySalah(new Date(now.getTime() + DAY_MS))[0]!;
}

/** Shift an instant by whole days (used for day-by-day timetable navigation). */
export const addDays = (instant: Date, days: number) => new Date(instant.getTime() + days * DAY_MS);

/** Timetable for the next Friday after `instant` (today if it's Friday and Jumu'ah hasn't begun). */
export function getNextFriday(instant: Date): DayTimetable {
  for (let i = 0; i < 8; i++) {
    const day = getDayTimetable(addDays(instant, i));
    if (day.isFriday && day.salah[1]!.time > instant) return day;
  }
  return getDayTimetable(addDays(instant, 7));
}

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  hour: '2-digit',
  minute: '2-digit',
});
const longDateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const hijriFormat = new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', {
  timeZone,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** e.g. "16:42", in the masjid's time zone. */
export const formatSalahTime = (time: Date) => timeFormat.format(time);
/** e.g. "Saturday 26 September 2026". */
export const formatLongDate = (date: Date) => longDateFormat.format(date);
/** e.g. "Friday 2 October". */
export const formatShortDate = (date: Date) => shortDateFormat.format(date);
/** e.g. "15 Rabiʻ II 1448 AH". */
export const formatHijriDate = (date: Date) => hijriFormat.format(date);

/** True when both instants fall on the same local day at the masjid. */
export const isSameLocalDay = (a: Date, b: Date) =>
  localDay(a).date.getTime() === localDay(b).date.getTime();
