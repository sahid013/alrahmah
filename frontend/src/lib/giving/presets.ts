import type { DonationProgram } from '@/lib/donations/types';
import { REGULAR_PRESETS, type REGULAR_FREQUENCIES } from './types';

/** Amount tiles for regular causes (one-off / weekly / monthly): see `REGULAR_PRESETS`. */
export type RegularFrequency = (typeof REGULAR_FREQUENCIES)[number];

export const frequencyOfPeriod = (period: 'once' | 'week' | 'month'): RegularFrequency =>
  period === 'week' ? 'weekly' : period === 'month' ? 'monthly' : 'one-off';

/** The campaign's suggested amount, if it's for this frequency. */
export const suggested = (program: DonationProgram, frequency: RegularFrequency) =>
  program.price && frequencyOfPeriod(program.price.period) === frequency
    ? program.price.amount
    : undefined;

/**
 * A regular cause's tiles for a frequency: the standard ones, with the campaign's suggested
 * amount (if it's for this frequency) taking the place of the nearest.
 */
export function presetsFor(program: DonationProgram, frequency: RegularFrequency): number[] {
  const { amounts } = REGULAR_PRESETS[frequency];
  const price = suggested(program, frequency);
  if (price === undefined || amounts.includes(price)) return [...amounts];
  const nearest = amounts.reduce((a, b) => (Math.abs(b - price) < Math.abs(a - price) ? b : a));
  return [...amounts.filter((a) => a !== nearest), price].sort((a, b) => a - b);
}

/**
 * The amount after switching frequency: the new frequency's pre-selected tile (or the campaign's
 * suggested amount), unless the donor typed their own amount, which is kept.
 */
export function amountAfterSwitch(
  program: DonationProgram,
  from: RegularFrequency,
  to: RegularFrequency,
  amountText: string,
): string {
  const typed = amountText !== '' && !presetsFor(program, from).includes(Number(amountText));
  if (typed) return amountText;
  return String(suggested(program, to) ?? REGULAR_PRESETS[to].preselected);
}
