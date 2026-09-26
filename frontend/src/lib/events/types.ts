import { z } from 'zod';

/**
 * Event contract. This is the shape the future dashboard / backend API must return
 * (`GET /api/v1/events` → `EventItem[]`). Everything is validated at the data boundary
 * (see `repository.ts`), so bad data fails loudly instead of breaking the UI.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm (24h)');

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
export const weekdaySchema = z.enum(WEEKDAYS);

/** Time of day: a human label ("After Asr", "12pm") and optional clock times for sorting/display. */
const timeFields = {
  /** Shown when no clock times are set, e.g. "After Asr". */
  time: z.string().min(1).optional(),
  startTime: clockTime.optional(),
  endTime: clockTime.optional(),
};

export const eventScheduleSchema = z.discriminatedUnion('kind', [
  /** A single date (masjid local). */
  z.object({ kind: z.literal('once'), date: isoDate, ...timeFields }),
  /** A weekly class, optionally bounded by a term and with skipped dates. */
  z.object({
    kind: z.literal('weekly'),
    weekday: weekdaySchema,
    /** First date the class runs (defaults to always). */
    from: isoDate.optional(),
    /** Last date the class runs (defaults to open-ended). */
    until: isoDate.optional(),
    /** Individual dates when the class does not run. */
    exceptDates: z.array(isoDate).optional(),
    ...timeFields,
  }),
]);

export const EVENT_CATEGORIES = {
  course: 'Courses',
  community: 'Community',
  youth: 'Youth',
  sisters: 'Sisters',
} as const;
export type EventCategory = keyof typeof EVENT_CATEGORIES;

export const eventSchema = z.object({
  /** URL slug, e.g. "seerah-of-muhammad". */
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  category: z.enum(Object.keys(EVENT_CATEGORIES) as [EventCategory, ...EventCategory[]]),
  schedule: eventScheduleSchema,
  /** Exact schedule wording to display (falls back to a formatted `schedule`). */
  scheduleLabel: z.string().optional(),
  /** One or two sentences shown on cards. */
  summary: z.string().min(1),
  /** Longer text for the event page (falls back to `summary`). */
  description: z.string().optional(),
  speaker: z.string().optional(),
  location: z.string().optional(),
  /** Poster with its intrinsic size (cards keep the poster's natural height). */
  image: z
    .object({
      src: z.string().min(1),
      alt: z.string().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  /** Optional external link; by default "Learn more" goes to the event's own page. */
  href: z.string().optional(),
});

export type Weekday = z.infer<typeof weekdaySchema>;
export type EventSchedule = z.infer<typeof eventScheduleSchema>;
export type EventItem = z.infer<typeof eventSchema>;

/** One dated appearance of an event on the calendar. */
export interface EventOccurrence {
  event: EventItem;
  /** YYYY-MM-DD */
  date: string;
}
