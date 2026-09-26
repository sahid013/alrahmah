import { cache } from 'react';
import { seedEvents } from './data';
import { eventSchema, type EventCategory, type EventItem } from './types';

/**
 * The ONLY place that knows where events come from. Server-side (server components, route
 * handlers, generateStaticParams, sitemap). Client components receive events as props.
 *
 * To connect the dashboard: replace `loadEvents` with the API call, e.g.
 *   const { data } = await api.get<unknown[]>('/events', { next: { tags: ['events'] } });
 * and keep the validation. Nothing else in the frontend needs to change.
 */
const loadEvents = cache(async (): Promise<EventItem[]> => {
  const raw: unknown[] = seedEvents;
  return eventSchema.array().parse(raw);
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
