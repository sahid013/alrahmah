import { eventSchema, type EventItem } from './types';

/**
 * The `events` table (Supabase) ↔ `EventItem` (website) and dashboard events.
 * `status`: published = on the website, draft = staff only.
 */
export interface EventRow {
  id: string;
  title: string;
  category: EventItem['category'];
  schedule: unknown;
  schedule_label: string | null;
  summary: string;
  description: string | null;
  speaker: string | null;
  location: string | null;
  image: unknown;
  href: string | null;
  status: 'published' | 'draft';
  sort_order: number;
  updated_at?: string;
}

export const EVENT_COLUMNS =
  'id,title,category,schedule,schedule_label,summary,description,speaker,location,image,href,status,sort_order,updated_at';

/** Validated event from a row (throws on bad data, so it never reaches the site). */
export const rowToEvent = (row: EventRow): EventItem =>
  eventSchema.parse({
    id: row.id,
    title: row.title,
    category: row.category,
    schedule: row.schedule,
    ...(row.schedule_label && { scheduleLabel: row.schedule_label }),
    summary: row.summary,
    ...(row.description && { description: row.description }),
    ...(row.speaker && { speaker: row.speaker }),
    ...(row.location && { location: row.location }),
    ...(row.image ? { image: row.image } : {}),
    ...(row.href && { href: row.href }),
  });

const blank = (v: string | undefined) => v?.trim() || null;

/** Row to insert/update from an event plus its status and position. */
export const eventToRow = (
  event: EventItem,
  status: EventRow['status'],
  order: number,
): Omit<EventRow, 'updated_at'> => {
  const e = eventSchema.parse(event);
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    schedule: e.schedule,
    schedule_label: blank(e.scheduleLabel),
    summary: e.summary,
    description: blank(e.description),
    speaker: blank(e.speaker),
    location: blank(e.location),
    image: e.image ?? null,
    href: blank(e.href),
    status,
    sort_order: order,
  };
};
