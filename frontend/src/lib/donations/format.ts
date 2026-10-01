import type { DonationPrice, DonationTracker } from './types';

const gbp = (n: number, decimals = 0) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
const num = (n: number) => new Intl.NumberFormat('en-GB').format(n);

/** Progress from 0 to 1 (capped). */
export const trackerProgress = (t: DonationTracker) => Math.min(1, t.current / t.target);

export const isComplete = (t: DonationTracker) => t.current >= t.target;

/** Percentage with one decimal when below 10%, whole numbers otherwise. */
export const formatPercent = (t: DonationTracker) => {
  const p = trackerProgress(t) * 100;
  return `${p > 0 && p < 10 ? p.toFixed(1) : Math.round(p)}%`;
};

/** The line under the bar, according to the tracker's display mode. */
export function trackerLabel(t: DonationTracker): string {
  if (t.label) return t.label;
  switch (t.display) {
    case 'amount':
      return `${gbp(t.current)} raised of ${gbp(t.target)}`;
    case 'percent':
      return `${formatPercent(t)} funded`;
    case 'donors':
      return `${num(t.current)} of ${num(t.target)} donor${t.target === 1 ? '' : 's'}`;
  }
}

/** e.g. "£20.00 / month", "£10.00 / week", "£50.00". */
export function formatPrice(p: DonationPrice): string {
  return p.period === 'once' ? gbp(p.amount, 2) : `${gbp(p.amount, 2)} / ${p.period}`;
}
