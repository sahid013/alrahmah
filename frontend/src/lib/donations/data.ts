import { checkoutHref } from '@/lib/giving/links';
import type { z } from 'zod';
import type { donationsDataSchema } from './types';

/**
 * Local seed data, read by `repository.ts` until the dashboard exists.
 *
 * TODO before launch:
 *  - Donate buttons go to the on-site donation page (`/donate/<id>`), which takes no payment until
 *    Stripe is connected (see lib/giving/payments.ts).
 *  - TRACKER FIGURES ARE SAMPLES to show the design. Replace with real numbers (or remove the
 *    `tracker` / `overview`) — never publish made-up totals.
 */

/** Input shape: defaults (e.g. `giving: regular`) are applied when it's parsed. */
export const seedDonations: z.input<typeof donationsDataSchema> = {
  overview: {
    title: 'Masjid running costs',
    description:
      'The share of the masjid’s ongoing bills — electricity, water, heating, internet and upkeep — covered by regular donors.',
    tracker: { display: 'percent', current: 20.1, target: 100 },
  },
  /**
   * The causes on /donate ("Select your cause"), each with its own form (client's list, October
   * 2026). TODO: confirm with the masjid: the Fitrana amount per person (£5 for now) and the
   * first night/day of each daily cause after moonsighting (dates below follow the Umm al-Qura
   * calendar: Ramadan 1448 starts 8 Feb 2027; 1 Dhul Hijjah 1448 is 7 May 2027).
   */
  programs: [
    {
      id: 'masjid-expansion',
      title: 'Masjid Expansion',
      summary:
        'Help us move to a larger home through the Make Space for Rahmah appeal. Give once, weekly or monthly.',
      cta: { label: 'Donate', href: checkoutHref('masjid-expansion') },
      giving: { kind: 'regular' },
      icon: 'mosque',
    },
    {
      id: 'jumuah-giving',
      title: 'Jumu’ah Giving',
      summary:
        'Give every Friday, the best day of the week. A small weekly gift that supports the masjid all year round.',
      cta: { label: 'Donate', href: checkoutHref('jumuah-giving') },
      // Taken each Friday before Jumu'ah, until the donor cancels.
      giving: { kind: 'jumuah', chargeTime: '12:00', presets: [5, 10, 20] },
      icon: 'calendar',
    },
    {
      id: 'fitrana',
      title: 'Fitrana',
      summary: 'Zakat al-Fitr, paid for each member of your household before the Eid prayer.',
      cta: { label: 'Donate', href: checkoutHref('fitrana') },
      giving: { kind: 'per-person', unitAmount: 5, maxPeople: 20 },
      icon: 'people',
    },
    {
      id: 'last-10-nights',
      title: 'Last 10 Nights',
      summary:
        'Give every night of the last ten nights of Ramadan, so your charity reaches Laylatul Qadr.',
      cta: { label: 'Donate', href: checkoutHref('last-10-nights') },
      giving: {
        kind: 'daily',
        // Night 21 of Ramadan 1448 begins on the evening of 27 Feb 2027.
        firstDate: '2027-02-27',
        count: 10,
        unit: 'night',
        chargeTime: '21:00',
        periodLabel: 'the last 10 nights of Ramadan',
        presets: [1, 5, 10, 20],
      },
      icon: 'moon',
    },
    {
      id: 'ramadan-daily',
      title: 'Ramadan Daily',
      summary: 'Give every night of Ramadan, from the first night to the last.',
      cta: { label: 'Donate', href: checkoutHref('ramadan-daily') },
      giving: {
        kind: 'daily',
        // Night 1 of Ramadan 1448 begins on the evening of 7 Feb 2027 (30 nights to 8 Mar).
        firstDate: '2027-02-07',
        count: 30,
        unit: 'night',
        chargeTime: '21:00',
        periodLabel: 'the 30 nights of Ramadan',
        presets: [1, 5, 10, 20],
      },
      icon: 'moon',
    },
    {
      id: 'first-10-days-dhul-hijjah',
      title: 'First 10 Days of Dhul Hijjah',
      summary:
        'The best days of the year: give every day from 1 to 10 Dhul Hijjah, up to the day of Eid.',
      cta: { label: 'Donate', href: checkoutHref('first-10-days-dhul-hijjah') },
      giving: {
        kind: 'daily',
        firstDate: '2027-05-07',
        count: 10,
        unit: 'day',
        chargeTime: '09:00',
        periodLabel: 'the first 10 days of Dhul Hijjah',
        presets: [1, 5, 10, 20],
      },
      icon: 'sun',
    },
  ],
};
