import { afterEach, describe, expect, it } from 'vitest';
import type { PrayerDay } from '@/lib/dashboard/types';
import { formatSalahTime, getDayTimetable, setPrayerOverrides } from '@/lib/prayer-times';
import { fromRow, toRow } from './rows';

const edited: PrayerDay = {
  date: '2026-10-16',
  times: {
    fajr: { adhan: '05:59', jamaah: '06:45' },
    sunrise: { adhan: '07:36' },
    dhuhr: { adhan: '12:52', jamaah: '13:30' },
    asr: { adhan: '15:30', jamaah: '16:45' },
    maghrib: { adhan: '18:07' },
    isha: { adhan: '19:17', jamaah: '19:20' },
  },
  jumuah: ['13:15', '14:00'],
  note: 'Eid prayer at 8am',
};

const asr = (date: string) => getDayTimetable(new Date(`${date}T12:00:00Z`)).salah[2]!;

describe('prayer overrides from the dashboard', () => {
  afterEach(() => setPrayerOverrides([]));

  it('take precedence over the published timetable for that day only', () => {
    expect(formatSalahTime(asr('2026-10-16').jamaah!)).toBe('16:30');
    setPrayerOverrides([edited]);
    const day = getDayTimetable(new Date('2026-10-16T12:00:00Z'));
    expect(formatSalahTime(asr('2026-10-16').jamaah!)).toBe('16:45');
    expect(day.jumuah?.map(formatSalahTime)).toEqual(['13:15', '14:00']);
    expect(day.note).toBe('Eid prayer at 8am');
    // The next day is untouched.
    expect(formatSalahTime(asr('2026-10-17').jamaah!)).not.toBe('16:45');
  });

  it('round-trips through a database row', () => {
    const row = toRow(edited);
    expect(row).toMatchObject({ date: '2026-10-16', jumuah: ['13:15', '14:00'] });
    expect(fromRow({ ...row, updated_at: '2026-10-16T09:00:00Z' })).toEqual({
      ...edited,
      updatedAt: '2026-10-16T09:00:00Z',
    });
    // Empty values are stored as null and read back as absent.
    const plain = toRow({ ...edited, jumuah: [], note: '  ' });
    expect(plain).toMatchObject({ jumuah: null, note: null });
    expect(fromRow(plain)).not.toHaveProperty('note');
  });

  it('rejects malformed rows', () => {
    expect(() =>
      fromRow({ ...toRow(edited), times: { ...edited.times, asr: { adhan: '3:30pm' } } }),
    ).toThrow();
  });
});
