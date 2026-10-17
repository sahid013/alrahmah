import { describe, expect, it } from 'vitest';
import type { EventItem } from '@/lib/events';
import { breadcrumbJsonLd, eventJsonLd, siteJsonLd } from './structured-data';

const make = (schedule: EventItem['schedule']): EventItem => ({
  id: 'test-event',
  title: 'Test event',
  category: 'course',
  summary: 'A test event.',
  schedule,
});

describe('eventJsonLd', () => {
  it('uses the next weekly occurrence with the UK summer offset', () => {
    const data = eventJsonLd(
      make({ kind: 'weekly', weekday: 'Friday', startTime: '19:00', endTime: '20:30' }),
      '2026-10-17', // a Saturday
    );
    expect(data?.startDate).toBe('2026-10-23T19:00:00+01:00');
    expect(data?.endDate).toBe('2026-10-23T20:30:00+01:00');
  });

  it('switches to GMT after the clocks go back', () => {
    const data = eventJsonLd(
      make({ kind: 'once', date: '2026-11-06', startTime: '18:00' }),
      '2026-10-17',
    );
    expect(data?.startDate).toBe('2026-11-06T18:00:00+00:00');
  });

  it('gives a date only when the event has no clock time ("After Asr")', () => {
    const data = eventJsonLd(
      make({ kind: 'weekly', weekday: 'Friday', time: 'After Asr' }),
      '2026-10-17',
    );
    expect(data?.startDate).toBe('2026-10-23');
    expect(data?.endDate).toBeUndefined();
  });

  it('keeps a past one-off event on its own date and drops a finished weekly class', () => {
    expect(eventJsonLd(make({ kind: 'once', date: '2026-01-04' }), '2026-10-17')?.startDate).toBe(
      '2026-01-04',
    );
    expect(
      eventJsonLd(make({ kind: 'weekly', weekday: 'Monday', until: '2026-06-01' }), '2026-10-17'),
    ).toBeNull();
  });
});

describe('site structured data', () => {
  it('leaves placeholder social links out of sameAs', () => {
    const mosque = siteJsonLd()['@graph'][0]!;
    expect(mosque.sameAs).not.toContain('https://www.instagram.com/');
    expect(mosque.sameAs).toContain('https://www.facebook.com/alrahmahleeds/');
    expect(mosque.telephone).toBe('+44 7508 044680');
  });

  it('starts every breadcrumb trail at Home', () => {
    const { itemListElement } = breadcrumbJsonLd([{ name: 'Events', path: '/events' }]);
    expect(itemListElement.map((c) => [c.position, c.name])).toEqual([
      [1, 'Home'],
      [2, 'Events'],
    ]);
  });
});
