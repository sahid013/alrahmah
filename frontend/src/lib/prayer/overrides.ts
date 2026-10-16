import 'server-only';
import type { PrayerDay } from '@/lib/dashboard/types';
import { todayAtMasjid } from '@/lib/events/calendar';
import { fromRow, PRAYER_DAY_COLUMNS, type PrayerDayRow } from './rows';

/** Cache tag for prayer times; the dashboard's save revalidates it (`/api/revalidate/prayer-times`). */
export const PRAYER_DAYS_TAG = 'prayer-days';

/**
 * Prayer times the team edited in the dashboard (Supabase `prayer_days`), from a week ago
 * onwards. Read with the publishable key (the table is public-read). Cached and tagged, so a
 * dashboard save shows on the website on the next visit; otherwise refreshed hourly.
 * Returns [] when Supabase isn't configured or can't be reached: the site then shows the
 * published/calculated timetable, so prayer times never disappear.
 */
export async function listPrayerOverrides(): Promise<PrayerDay[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  const from = new Date(`${todayAtMasjid()}T12:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 7);
  const query = new URLSearchParams({
    select: PRAYER_DAY_COLUMNS,
    date: `gte.${from.toISOString().slice(0, 10)}`,
    order: 'date.asc',
    limit: '1000',
  });

  try {
    const res = await fetch(`${url}/rest/v1/prayer_days?${query}`, {
      headers: { apikey: key },
      next: { tags: [PRAYER_DAYS_TAG], revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as PrayerDayRow[];
    // One bad row shouldn't hide the rest.
    return rows.flatMap((row) => {
      try {
        return [fromRow(row)];
      } catch {
        console.error('[prayer] skipped an invalid prayer_days row', row.date);
        return [];
      }
    });
  } catch (error) {
    console.error(
      '[prayer] could not load prayer times from Supabase',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
