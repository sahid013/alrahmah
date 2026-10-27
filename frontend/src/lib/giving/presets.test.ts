import { describe, expect, it } from 'vitest';
import type { DonationProgram } from '@/lib/donations/types';
import { amountAfterSwitch, presetsFor } from './presets';
import { REGULAR_PRESETS } from './types';

const expansion = {
  id: 'masjid-expansion',
  title: 'Masjid Expansion',
  cta: { label: 'Donate', href: '/donate/masjid-expansion' },
  giving: { kind: 'regular' },
} as DonationProgram;

describe('regular presets', () => {
  it('uses the launch tiles and pre-selected amounts', () => {
    expect(presetsFor(expansion, 'one-off')).toEqual([25, 50, 100, 250]);
    expect(presetsFor(expansion, 'monthly')).toEqual([10, 20, 50, 100]);
    expect(REGULAR_PRESETS['one-off'].preselected).toBe(50);
    expect(REGULAR_PRESETS.monthly.preselected).toBe(20);
  });

  it('moves to the pre-selected tile when switching frequency', () => {
    expect(amountAfterSwitch(expansion, 'one-off', 'monthly', '50')).toBe('20');
    expect(amountAfterSwitch(expansion, 'monthly', 'one-off', '100')).toBe('50');
  });

  it('keeps an amount the donor typed', () => {
    expect(amountAfterSwitch(expansion, 'one-off', 'monthly', '35')).toBe('35');
    expect(amountAfterSwitch(expansion, 'one-off', 'monthly', '')).toBe('20');
  });

  it("puts a campaign's suggested amount in place of the nearest tile", () => {
    const suggested = { ...expansion, price: { amount: 30, period: 'month' } } as DonationProgram;
    expect(presetsFor(suggested, 'monthly')).toEqual([10, 30, 50, 100]);
    expect(presetsFor(suggested, 'one-off')).toEqual([25, 50, 100, 250]);
    expect(amountAfterSwitch(suggested, 'one-off', 'monthly', '50')).toBe('30');
  });
});
