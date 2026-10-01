import { describe, expect, it } from 'vitest';
import {
  amountSchema,
  amountWithFrequency,
  donationRequestSchema,
  fieldErrors,
  giftAidBonus,
  normalisePostcode,
} from './types';

const valid = {
  campaignId: 'zakaah',
  frequency: 'one-off' as const,
  amount: 50,
  donor: { firstName: 'Aisha', lastName: 'Rahman', email: 'aisha@example.com' },
  giftAid: { declared: false },
};

describe('donation request', () => {
  it('accepts a simple one-off donation', () => {
    expect(donationRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('requires address details only when Gift Aid is declared', () => {
    const r = donationRequestSchema.safeParse({ ...valid, giftAid: { declared: true } });
    expect(r.success).toBe(false);
    expect(Object.keys(fieldErrors(r.error!))).toEqual([
      'giftAid.houseNameOrNumber',
      'giftAid.postcode',
    ]);
    const ok = donationRequestSchema.safeParse({
      ...valid,
      giftAid: { declared: true, houseNameOrNumber: '6', postcode: 'ls73jb' },
    });
    expect(ok.success).toBe(true);
  });

  it('validates amounts', () => {
    const errors = (amount: number) =>
      fieldErrors(amountSchema.safeParse({ ...valid, amount }).error!).amount;
    expect(errors(0.5)).toMatch(/minimum/);
    expect(errors(30_000)).toMatch(/contact us/);
    expect(errors(10.555)).toMatch(/pence/);
    expect(amountSchema.safeParse({ ...valid, amount: 12.5 }).success).toBe(true);
  });
});

describe('giving helpers', () => {
  it('works out Gift Aid at 25%', () => {
    expect(giftAidBonus(50)).toBe(12.5);
    expect(giftAidBonus(10.1)).toBe(2.53);
  });
  it('formats amounts with frequency', () => {
    expect(amountWithFrequency(50, 'one-off')).toBe('£50');
    expect(amountWithFrequency(12.5, 'monthly')).toBe('£12.50 a month');
    expect(amountWithFrequency(5, 'weekly')).toBe('£5 a week');
  });
  it('normalises postcodes', () => {
    expect(normalisePostcode(' ls73jb ')).toBe('LS7 3JB');
    expect(normalisePostcode('sw1a 1aa')).toBe('SW1A 1AA');
  });
});
