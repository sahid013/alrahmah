import { describe, expect, it } from 'vitest';
import {
  formatMonth,
  monthBounds,
  monthGrid,
  parseMonth,
  shiftMonth,
  todayAtMasjid,
} from './calendar';
import { seedEvents } from './data';
import { listEvents } from './repository';
import {
  formatSchedule,
  formatTime,
  nextOccurrence,
  occurrencesInRange,
  occursOn,
} from './schedule';
import { eventSchema, type EventItem, type EventSchedule } from './types';

const make = (overrides: Partial<EventItem>): EventItem => ({
  id: 'test-event',
  title: 'Test',
  category: 'course',
  summary: 'Summary',
  schedule: { kind: 'weekly', weekday: 'Friday', time: 'After Asr' },
  ...overrides,
});

describe('event data', () => {
  it('seed data passes the API contract', () => {
    expect(() => eventSchema.array().parse(seedEvents)).not.toThrow();
  });

  it('rejects malformed events', () => {
    expect(
      eventSchema.safeParse(make({ schedule: { kind: 'once', date: '10/05/2026' } })).success,
    ).toBe(false);
    expect(eventSchema.safeParse(make({ id: 'Bad Id' })).success).toBe(false);
  });

  it('filters by search and category', async () => {
    expect((await listEvents({ search: 'allaah' })).map((e) => e.id)).toEqual(['names-of-allaah']);
    expect((await listEvents({ category: 'community' })).map((e) => e.id)).toEqual([
      'your-masjid-our-community',
    ]);
    expect(await listEvents({ limit: 2 })).toHaveLength(2);
  });
});

describe('schedules', () => {
  it('weekly classes respect weekday, term dates and skipped dates', () => {
    const s: EventSchedule = {
      kind: 'weekly',
      weekday: 'Friday',
      from: '2026-09-04',
      until: '2026-09-25',
      exceptDates: ['2026-09-18'],
    };
    expect(occursOn(s, '2026-09-04')).toBe(true);
    expect(occursOn(s, '2026-09-05')).toBe(false); // Saturday
    expect(occursOn(s, '2026-08-28')).toBe(false); // before term
    expect(occursOn(s, '2026-09-18')).toBe(false); // skipped
    expect(occursOn(s, '2026-10-02')).toBe(false); // after term
  });

  it('expands and sorts occurrences by date then start time', () => {
    const late = make({
      id: 'late',
      title: 'Late',
      schedule: { kind: 'once', date: '2026-09-04', startTime: '20:00' },
    });
    const early = make({
      id: 'early',
      title: 'Early',
      schedule: { kind: 'once', date: '2026-09-04', startTime: '07:00' },
    });
    const weekly = make({ id: 'weekly' });
    const result = occurrencesInRange([late, weekly, early], '2026-09-01', '2026-09-11');
    expect(result.map((o) => `${o.date}:${o.event.id}`)).toEqual([
      '2026-09-04:early',
      '2026-09-04:late',
      '2026-09-04:weekly', // untimed sorts after timed
      '2026-09-11:weekly',
    ]);
  });

  it('finds the next occurrence', () => {
    expect(nextOccurrence({ kind: 'weekly', weekday: 'Monday', time: 'x' }, '2026-09-26')).toBe(
      '2026-09-28',
    );
    expect(nextOccurrence({ kind: 'once', date: '2026-05-10' }, '2026-09-26')).toBeNull();
  });

  it('formats times and schedules', () => {
    expect(
      formatTime({ kind: 'once', date: '2026-09-04', startTime: '19:00', endTime: '20:30' }),
    ).toBe('7pm – 8:30pm');
    expect(formatSchedule({ kind: 'weekly', weekday: 'Friday', time: 'After Asr' })).toBe(
      'Every Friday · After Asr',
    );
    expect(formatSchedule({ kind: 'once', date: '2026-05-10', time: '12pm' })).toBe(
      'Sunday 10 May 2026 · 12pm',
    );
  });
});

describe('calendar', () => {
  it('builds Monday-first weeks covering the month', () => {
    const weeks = monthGrid('2026-09', '2026-09-26');
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]!.date).toBe('2026-08-31'); // Monday before 1 Sep (a Tuesday)
    expect(weeks.at(-1)!.at(-1)!.date).toBe('2026-10-04');
    expect(
      weeks
        .flat()
        .filter((d) => d.isToday)
        .map((d) => d.date),
    ).toEqual(['2026-09-26']);
  });

  it('handles month input safely', () => {
    expect(parseMonth('2026-02', '2026-09-26')).toBe('2026-02');
    expect(parseMonth('garbage', '2026-09-26')).toBe('2026-09');
    expect(parseMonth('2026-13', '2026-09-26')).toBe('2026-09');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthBounds('2028-02').end).toBe('2028-02-29'); // leap year
    expect(formatMonth('2026-09')).toBe('September 2026');
  });

  it("uses the masjid's time zone for today", () => {
    // 00:30 in Dhaka on the 27th is still the 26th in London.
    expect(todayAtMasjid(new Date('2026-09-26T18:30:00Z'))).toBe('2026-09-26');
  });
});
