import { formatSalahTime, getDayTimetable } from '@/lib/prayer-times';
import { PRAYER_LABELS, PRAYERS, type PrayerDay, type PrayerKey } from './types';

/** Calculated timetable for an ISO date (masjid time zone), used when no override is stored. */
export function calculatedDay(date: string): PrayerDay {
  const t = getDayTimetable(new Date(`${date}T12:00:00Z`));
  const at = (id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') =>
    formatSalahTime(t.salah.find((s) => s.id === id)!.time);
  return {
    date,
    times: {
      fajr: { adhan: at('fajr') },
      sunrise: { adhan: formatSalahTime(t.sunrise) },
      dhuhr: { adhan: at('dhuhr') },
      asr: { adhan: at('asr') },
      maghrib: { adhan: at('maghrib') },
      isha: { adhan: at('isha') },
    },
  };
}

/** Copy a day's times onto another date (bulk scheduling). */
export const copyDayTo = (day: PrayerDay, date: string): PrayerDay => ({
  ...structuredClone(day),
  date,
});

/** True when two timetables publish the same times (ignores date and metadata). */
export function sameTimes(a: PrayerDay, b: PrayerDay): boolean {
  const ja = JSON.stringify([PRAYERS.map((p) => a.times[p]), a.jumuah ?? [], a.note ?? '']);
  const jb = JSON.stringify([PRAYERS.map((p) => b.times[p]), b.jumuah ?? [], b.note ?? '']);
  return ja === jb;
}

export const isFriday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() === 5;

/** Field id for validation messages, e.g. "asr.jamaah", "jumuah.0" or "fajr.adhan". */
export type PrayerField = string;

/**
 * Checks a timetable before saving: adhan times must run in order through the day, and each
 * jama'ah must be at or after its adhan. Returns field → message (empty when valid).
 */
export function validateDay(day: PrayerDay): Record<PrayerField, string> {
  const errors: Record<PrayerField, string> = {};
  let previous: { key: string; time: string } | undefined;
  for (const key of PRAYERS) {
    const { adhan } = day.times[key];
    if (!adhan) {
      errors[`${key}.adhan`] = 'Required';
      continue;
    }
    if (previous && adhan <= previous.time) {
      errors[`${key}.adhan`] = `Must be after ${PRAYER_LABELS[previous.key as PrayerKey]}`;
    }
    previous = { key, time: adhan };
    const jamaah =
      'jamaah' in day.times[key] ? (day.times[key] as { jamaah?: string }).jamaah : undefined;
    if (jamaah && jamaah < adhan) errors[`${key}.jamaah`] = 'Must be at or after the adhan';
  }
  day.jumuah?.forEach((t, i) => {
    if (!t) errors[`jumuah.${i}`] = 'Enter a time or remove this row';
  });
  return errors;
}
