import { describe, expect, it } from 'vitest';
import type { DailyGiving, Giving, JumuahGiving } from '@/lib/donations/types';
import { chargeFor, DonationInputError } from './causes';
import {
  chargeTimes,
  dailyStatus,
  dateRange,
  formatClock,
  nextFridayCharge,
  remainingCharges,
} from './schedule';
import type { DonationRequest } from './types';

const nights: DailyGiving = {
  kind: 'daily',
  firstDate: '2027-02-27',
  count: 10,
  unit: 'night',
  chargeTime: '21:00',
  periodLabel: 'the last 10 nights of Ramadan',
  presets: [1, 5, 10, 20],
};
const days: DailyGiving = { ...nights, firstDate: '2027-05-07', unit: 'day', chargeTime: '09:00' };

const request = (patch: Partial<DonationRequest>): DonationRequest => ({
  campaignId: 'x',
  frequency: 'one-off',
  amount: 10,
  donor: {
    type: 'personal',
    firstName: 'Aisha',
    lastName: 'Khan',
    address: '6 Sheepscar Way',
    country: 'GB',
    postcode: 'LS7 3JB',
    city: 'Leeds',
    email: 'aisha@example.com',
    phone: '07700 900123',
  },
  marketingConsent: false,
  giftAid: { declared: false },
  ...patch,
});

describe('daily schedule', () => {
  it('takes one payment each night at 9pm UK time (GMT in late February)', () => {
    const times = chargeTimes(nights);
    expect(times).toHaveLength(10);
    expect(times[0]?.toISOString()).toBe('2027-02-27T21:00:00.000Z');
    expect(times[9]?.toISOString()).toBe('2027-03-08T21:00:00.000Z');
  });

  it('uses British Summer Time in May (9am UK = 8am UTC)', () => {
    expect(chargeTimes(days)[0]?.toISOString()).toBe('2027-05-07T08:00:00.000Z');
  });

  it('is upcoming before, running part-way and closed after', () => {
    expect(dailyStatus(nights, new Date('2027-01-01T12:00:00Z'))).toBe('upcoming');
    const midway = new Date('2027-03-03T12:00:00Z');
    expect(dailyStatus(nights, midway)).toBe('running');
    expect(remainingCharges(nights, midway)).toHaveLength(6); // 3–8 March
    expect(dailyStatus(nights, new Date('2027-03-09T00:00:00Z'))).toBe('closed');
  });

  it('skips a payment due within 15 minutes', () => {
    expect(remainingCharges(nights, new Date('2027-02-27T20:50:00Z'))).toHaveLength(9);
  });

  it('formats dates and times for donors', () => {
    expect(dateRange(chargeTimes(nights))).toBe('27 Feb – 8 Mar 2027');
    expect(formatClock('21:00')).toBe('9pm');
    expect(formatClock('09:30')).toBe('9:30am');
  });
});

describe('chargeFor', () => {
  const regular: Giving = { kind: 'regular' };
  const fitrana: Giving = { kind: 'per-person', unitAmount: 5, maxPeople: 20 };

  it('charges a regular cause once, weekly or monthly', () => {
    expect(chargeFor(request({}), regular)).toEqual({
      kind: 'one-off',
      unitAmount: 10,
      quantity: 1,
    });
    expect(chargeFor(request({ frequency: 'monthly' }), regular)).toEqual({
      kind: 'recurring',
      interval: 'month',
      amount: 10,
    });
    expect(() => chargeFor(request({ frequency: 'daily' }), regular)).toThrow(DonationInputError);
  });

  it('charges Fitrana per person and checks the total', () => {
    expect(chargeFor(request({ people: 3, amount: 15 }), fitrana)).toEqual({
      kind: 'one-off',
      unitAmount: 5,
      quantity: 3,
    });
    expect(() => chargeFor(request({ people: 3, amount: 10 }), fitrana)).toThrow(/doesn’t match/);
    expect(() => chargeFor(request({ amount: 5 }), fitrana)).toThrow(/people/);
    expect(() => chargeFor(request({ people: 21, amount: 105 }), fitrana)).toThrow(/people/);
    expect(() =>
      chargeFor(request({ people: 1, amount: 5, frequency: 'monthly' }), fitrana),
    ).toThrow(/one-off/);
  });

  it('schedules only the nights left, and refuses once closed', () => {
    const r = request({ frequency: 'daily', amount: 5 });
    const charge = chargeFor(r, nights, new Date('2027-03-03T12:00:00Z'));
    expect(charge.kind === 'daily' && charge.charges).toHaveLength(6);
    expect(() => chargeFor(r, nights, new Date('2027-03-10T00:00:00Z'))).toThrow(/closed/);
    expect(() => chargeFor(request({ amount: 5 }), nights)).toThrow(DonationInputError);
  });
});

const fridays: JumuahGiving = { kind: 'jumuah', chargeTime: '12:00', presets: [5, 10, 20] };
const ramadan: DailyGiving = {
  ...nights,
  firstDate: '2027-02-07',
  count: 30,
  periodLabel: 'the 30 nights of Ramadan',
};

describe('Ramadan Daily', () => {
  it('takes one payment on each of the 30 nights, 7 Feb – 8 Mar 2027', () => {
    const times = chargeTimes(ramadan);
    expect(times).toHaveLength(30);
    expect(dateRange(times)).toBe('7 Feb – 8 Mar 2027');
    // Night 30 is the same night the Last 10 Nights end.
    expect(times.at(-1)).toEqual(chargeTimes(nights).at(-1));
  });
});

describe("Jumu'ah giving", () => {
  it('first charges the coming Friday at noon UK time', () => {
    // Thursday evening → Friday 12:00 (GMT).
    expect(nextFridayCharge(fridays, new Date('2026-10-29T18:00:00Z')).toISOString()).toBe(
      '2026-10-30T12:00:00.000Z',
    );
    // Friday morning, well before noon → that same Friday.
    expect(nextFridayCharge(fridays, new Date('2026-10-30T08:00:00Z')).toISOString()).toBe(
      '2026-10-30T12:00:00.000Z',
    );
    // Within 15 minutes of noon, or after it → the next Friday.
    expect(nextFridayCharge(fridays, new Date('2026-10-30T11:50:00Z')).toISOString()).toBe(
      '2026-11-06T12:00:00.000Z',
    );
    // British Summer Time: noon UK is 11:00 UTC.
    expect(nextFridayCharge(fridays, new Date('2027-03-30T09:00:00Z')).toISOString()).toBe(
      '2027-04-02T11:00:00.000Z',
    );
  });

  it('is weekly only, with nothing taken until Friday', () => {
    const now = new Date('2026-10-29T18:00:00Z');
    expect(chargeFor(request({ frequency: 'weekly', amount: 10 }), fridays, now)).toEqual({
      kind: 'jumuah',
      amount: 10,
      firstCharge: new Date('2026-10-30T12:00:00Z'),
    });
    expect(() => chargeFor(request({ frequency: 'one-off' }), fridays, now)).toThrow(
      DonationInputError,
    );
    expect(() => chargeFor(request({ frequency: 'monthly' }), fridays, now)).toThrow(
      DonationInputError,
    );
  });
});
