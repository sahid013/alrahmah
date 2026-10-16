import 'server-only';
import { cache } from 'react';
import { seedEvents } from './data';
import { EVENT_COLUMNS, rowToEvent, type EventRow } from './rows';
import { eventSchema, type EventCategory, type EventItem } from './types';

/** Cache tag for events; every dashboard save revalidates it (`/api/revalidate/events`). */
export const EVENTS_TAG = 'events';

/**
 * The ONLY place that knows where events come from (server-side: pages, layout, sitemap,
 * generateStaticParams; client components receive events as props). Published events from
 * Supabase `events` (edited in the dashboard), in dashboard order. Read with the publishable key,
 * cached and tagged (a dashboard save shows on the next visit; otherwise hourly). If Supabase
 * isn't configured or can't be reached, the events in `data.ts` are shown instead.
 */
const loadEvents = cache(async (): Promise<EventItem[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const fallback = () => eventSchema.array().parse(seedEvents);
  if (!url || !key) return fallback();
  try {
    const res = await fetch(
      `${url}/rest/v1/events?select=${EVENT_COLUMNS}&status=eq.published&order=sort_order.asc,title.asc`,
      { headers: { apikey: key }, next: { tags: [EVENTS_TAG], revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as EventRow[];
    // One bad row shouldn't take the events pages down.
    return rows.flatMap((row) => {
      try {
        return [rowToEvent(row)];
      } catch {
        console.error('[events] skipped an invalid event', row.id);
        return [];
      }
    });
  } catch (error) {
    console.error('[events] could not load events', error instanceof Error ? error.message : error);
    return fallback();
  }
});

export interface EventQuery {
  /** Case-insensitive match on title, summary, speaker or location. */
  search?: string;
  category?: EventCategory;
  limit?: number;
}

/** Events in display order, optionally filtered. */
export async function listEvents({ search, category, limit }: EventQuery = {}): Promise<
  EventItem[]
> {
  let events = await loadEvents();
  if (category) events = events.filter((e) => e.category === category);
  const q = search?.trim().toLowerCase();
  if (q) {
    events = events.filter((e) =>
      [e.title, e.summary, e.speaker, e.location].some((v) => v?.toLowerCase().includes(q)),
    );
  }
  return limit ? events.slice(0, limit) : events;
}

export async function getEvent(id: string): Promise<EventItem | undefined> {
  return (await loadEvents()).find((e) => e.id === id);
}
