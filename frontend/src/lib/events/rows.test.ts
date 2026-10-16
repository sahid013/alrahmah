import { describe, expect, it } from 'vitest';
import { eventToRow, rowToEvent, type EventRow } from './rows';

const row: EventRow = {
  id: 'seerah-of-muhammad',
  title: 'Seerah of Muhammad ﷺ',
  category: 'course',
  schedule: { kind: 'weekly', weekday: 'Friday', time: 'After Asr', exceptDates: ['2026-12-25'] },
  schedule_label: 'Every Friday After Asr',
  summary: 'Learn about the life of the Prophet ﷺ.',
  description: null,
  speaker: 'Ustadh Umar Muqaddam',
  location: null,
  image: { src: '/images/events/seerah.webp', alt: 'Poster', width: 1000, height: 1412 },
  href: null,
  status: 'published',
  sort_order: 0,
};

describe('event rows', () => {
  it('become website events, leaving empty fields out', () => {
    const e = rowToEvent(row);
    expect(e).toMatchObject({ id: 'seerah-of-muhammad', scheduleLabel: 'Every Friday After Asr' });
    expect(e).not.toHaveProperty('description');
    expect(e).not.toHaveProperty('location');
  });

  it('round-trip, with blank text stored as null', () => {
    const back = eventToRow({ ...rowToEvent(row), location: '  ' }, 'draft', 4);
    expect(back).toMatchObject({ ...row, status: 'draft', sort_order: 4, location: null });
  });

  it('reject bad schedules and slugs', () => {
    expect(() => rowToEvent({ ...row, schedule: { kind: 'weekly', weekday: 'Funday' } })).toThrow();
    expect(() => rowToEvent({ ...row, id: 'Not A Slug' })).toThrow();
  });
});
