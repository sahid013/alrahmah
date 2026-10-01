import { describe, expect, it } from 'vitest';
import { seedDonations } from './data';
import { formatPrice, isComplete, trackerLabel, trackerProgress } from './format';
import { donationsDataSchema } from './types';

describe('donations', () => {
  it('seed data passes the API contract', () => {
    expect(() => donationsDataSchema.parse(seedDonations)).not.toThrow();
  });

  it('formats each tracker display mode', () => {
    expect(trackerLabel({ display: 'amount', current: 2400, target: 5000 })).toBe(
      '£2,400 raised of £5,000',
    );
    expect(trackerLabel({ display: 'percent', current: 20.1, target: 100 })).toBe('20% funded');
    expect(trackerLabel({ display: 'percent', current: 4.25, target: 100 })).toBe('4.3% funded');
    expect(trackerLabel({ display: 'donors', current: 1, target: 1 })).toBe('1 of 1 donor');
    expect(trackerLabel({ display: 'donors', current: 3, target: 40, label: 'Custom' })).toBe(
      'Custom',
    );
  });

  it('caps progress and detects completion', () => {
    expect(trackerProgress({ display: 'amount', current: 7000, target: 5000 })).toBe(1);
    expect(isComplete({ display: 'donors', current: 1, target: 1 })).toBe(true);
  });

  it('formats prices', () => {
    expect(formatPrice({ amount: 20, period: 'month' })).toBe('£20.00 / month');
    expect(formatPrice({ amount: 50, period: 'once' })).toBe('£50.00');
  });
});
