import { describe, expect, it } from 'vitest';
import { formatSalahTime, getDayTimetable, getNextSalah, type SalahId } from './prayer-times';

/** Times of a day as "HH:mm" strings: [start, jama'ah] per salah, plus sunrise. */
function times(isoNoon: string) {
  const day = getDayTimetable(new Date(isoNoon));
  const bySalah = Object.fromEntries(
    day.salah.map((s) => [
      s.id,
      [formatSalahTime(s.time), s.jamaah ? formatSalahTime(s.jamaah) : undefined],
    ]),
  ) as Record<SalahId, [string, string | undefined]>;
  return {
    ...bySalah,
    source: day.source,
    sunrise: formatSalahTime(day.sunrise),
    names: day.salah.map((s) => s.name),
  };
}

describe('published 2026 timetable (WEBSITE 2026.xlsx, Sheet1)', () => {
  it('uses the sheet row for 1 January', () => {
    const t = times('2026-01-01T12:00:00Z');
    expect(t.source).toBe('published');
    expect(t.sunrise).toBe('08:24');
    expect(t.fajr).toEqual(['06:33', '07:00']);
    expect(t.dhuhr).toEqual(['12:09', '13:20']);
    expect(t.asr).toEqual(['13:40', '13:40']);
    expect(t.maghrib).toEqual(['15:56', undefined]);
    expect(t.isha).toEqual(['17:25', '19:00']);
  });

  it('applies British Summer Time from 29 March (clock times stay as published)', () => {
    const day = getDayTimetable(new Date('2026-03-29T12:00:00Z'));
    const fajr = day.salah[0]!.time;
    expect(formatSalahTime(fajr)).toBe('05:04');
    expect(fajr.toISOString()).toBe('2026-03-29T04:04:00.000Z'); // 05:04 BST = 04:04 UTC
    expect(formatSalahTime(day.sunrise)).toBe('06:46');
  });

  it('is back on GMT from 25 October', () => {
    const day = getDayTimetable(new Date('2026-10-25T12:00:00Z'));
    expect(day.sunrise.toISOString()).toBe('2026-10-25T06:53:00.000Z');
    expect(formatSalahTime(day.salah[3]!.time)).toBe('16:47');
  });

  it("sets Jumu'ah at 12:45 on 2026 Fridays, and nowhere else", () => {
    const fridays = ['2026-01-02', '2026-03-27', '2026-10-30', '2026-12-25'];
    for (const date of fridays) {
      const day = getDayTimetable(new Date(`${date}T12:00:00Z`));
      expect(day.jumuah?.map(formatSalahTime)).toEqual(['12:45']);
      expect(formatSalahTime(day.salah[1]!.jamaah!)).toBe('12:45');
    }
    // British Summer Time: Dhuhr begins after 12:45, so the published times stay.
    const summer = getDayTimetable(new Date('2026-06-26T12:00:00Z'));
    expect(summer.jumuah).toBeUndefined();
    expect(formatSalahTime(summer.salah[1]!.time)).toBe('13:09');
    expect(formatSalahTime(summer.salah[1]!.jamaah!)).toBe('13:30');
    expect(getDayTimetable(new Date('2026-10-29T12:00:00Z')).jumuah).toBeUndefined(); // Thursday
    expect(getDayTimetable(new Date('2027-01-01T12:00:00Z')).jumuah).toBeUndefined(); // 2027
  });

  it("names Dhuhr Jumu'ah on Fridays", () => {
    expect(times('2026-01-02T12:00:00Z').names[1]).toBe("Jumu'ah"); // Friday
    expect(times('2026-01-03T12:00:00Z').names[1]).toBe('Dhuhr');
  });

  it('rolls over to the next published Fajr after Isha', () => {
    const next = getNextSalah(new Date('2026-01-01T22:00:00Z'));
    expect(next.id).toBe('fajr');
    expect(formatSalahTime(next.time)).toBe('06:33');
  });

  it('falls back to calculated times for years without a published timetable', () => {
    expect(times('2027-01-01T12:00:00Z').source).toBe('calculated');
    expect(times('2027-01-01T12:00:00Z').fajr[1]).toBeUndefined();
  });
});
