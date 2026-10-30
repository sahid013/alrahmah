/** Event constants with no zod, so browser code (schedule helpers) stays small. */
export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const EVENT_CATEGORIES = {
  course: 'Courses',
  community: 'Community',
  youth: 'Youth',
  sisters: 'Sisters',
} as const;
