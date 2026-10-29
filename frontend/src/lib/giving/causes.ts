import type { Giving } from '@/lib/donations/types';
import { nextFridayCharge, remainingCharges } from './schedule';
import { REGULAR_FREQUENCIES, type DonationRequest } from './types';

/** A donation the server can't accept as sent (shown to the donor). */
export class DonationInputError extends Error {}

/** What to charge, worked out from the cause's rules (never from the browser's total alone). */
export type Charge =
  /** Taken now: `unitAmount` (pounds) × `quantity`. */
  | { kind: 'one-off'; unitAmount: number; quantity: number }
  /** Weekly or monthly until the donor cancels. */
  | { kind: 'recurring'; interval: 'week' | 'month'; amount: number }
  /** `amount` on each of the `charges` (card saved now, nothing taken today). */
  | { kind: 'daily'; amount: number; charges: Date[] }
  /** `amount` every Friday from `firstCharge` until cancelled (card saved now, nothing today). */
  | { kind: 'jumuah'; amount: number; firstCharge: Date };

const cents = (n: number) => Math.round(n * 100);

/** Checks a request against its cause's form and returns what to charge. */
export function chargeFor(r: DonationRequest, giving: Giving, now = new Date()): Charge {
  switch (giving.kind) {
    case 'regular': {
      if (!(REGULAR_FREQUENCIES as readonly string[]).includes(r.frequency))
        throw new DonationInputError('Choose one-off, weekly or monthly.');
      if (r.frequency === 'one-off') return { kind: 'one-off', unitAmount: r.amount, quantity: 1 };
      return {
        kind: 'recurring',
        interval: r.frequency === 'weekly' ? 'week' : 'month',
        amount: r.amount,
      };
    }
    case 'per-person': {
      if (r.frequency !== 'one-off')
        throw new DonationInputError('This donation is a one-off payment.');
      const people = r.people;
      if (!people || people > giving.maxPeople)
        throw new DonationInputError(`Choose between 1 and ${giving.maxPeople} people.`);
      if (cents(r.amount) !== cents(giving.unitAmount) * people)
        throw new DonationInputError('The total doesn’t match the number of people.');
      return { kind: 'one-off', unitAmount: giving.unitAmount, quantity: people };
    }
    case 'daily': {
      if (r.frequency !== 'daily')
        throw new DonationInputError(`This donation is taken once each ${giving.unit}.`);
      const charges = remainingCharges(giving, now);
      if (!charges.length)
        throw new DonationInputError(`Donations for ${giving.periodLabel} have closed.`);
      return { kind: 'daily', amount: r.amount, charges };
    }
    case 'jumuah': {
      if (r.frequency !== 'weekly')
        throw new DonationInputError('This donation is taken every Friday.');
      return { kind: 'jumuah', amount: r.amount, firstCharge: nextFridayCharge(giving, now) };
    }
  }
}
