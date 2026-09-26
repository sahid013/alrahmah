import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';
import { siteConfig } from '@/config/site';

/**
 * Prayer times for the masjid, calculated astronomically. This module is the only place that
 * knows how times are produced — swap the internals for the masjid's published timetable
 * (e.g. `api.get('/prayer-times?date=...')`) without touching any component.
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
}

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
  return {
    date: new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day)),
    isFriday: parts.weekday === 'Fri',
  };
}

/** Full timetable (five salah + sunrise) for the masjid's local day containing `instant`. */
export function getDayTimetable(instant: Date): DayTimetable {
  const { date, isFriday } = localDay(instant);
  const times = new PrayerTimes(coordinates, date, params);
  return {
    date: times.dhuhr,
    isFriday,
    sunrise: times.sunrise,
    salah: (Object.keys(SALAH_NAMES) as SalahId[]).map((id) => ({
      id,
      name: id === 'dhuhr' && isFriday ? "Jumu'ah" : SALAH_NAMES[id],
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
