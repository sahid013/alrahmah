import { prayerDaySchema, type PrayerDay } from '@/lib/dashboard/types';

/**
 * The `prayer_days` table (Supabase) ↔ `PrayerDay` (dashboard + website). Times are UK clock
 * times ("HH:mm"); the database checks their format too.
 */
export interface PrayerDayRow {
  date: string;
  times: PrayerDay['times'];
  jumuah: string[] | null;
  note: string | null;
  updated_at?: string;
}

export const PRAYER_DAY_COLUMNS = 'date,times,jumuah,note,updated_at';

/** Validated `PrayerDay` from a row (throws on bad data, so it never reaches the site). */
export const fromRow = (row: PrayerDayRow): PrayerDay =>
  prayerDaySchema.parse({
    date: row.date,
    times: row.times,
    ...(row.jumuah?.length && { jumuah: row.jumuah }),
    ...(row.note && { note: row.note }),
    ...(row.updated_at && { updatedAt: row.updated_at }),
  });

/** Row to insert/update (`updated_at` / `updated_by` are set by the database). */
export const toRow = (day: PrayerDay): Omit<PrayerDayRow, 'updated_at'> => {
  const valid = prayerDaySchema.parse(day);
  return {
    date: valid.date,
    times: valid.times,
    jumuah: valid.jumuah?.length ? valid.jumuah : null,
    note: valid.note?.trim() || null,
  };
};
