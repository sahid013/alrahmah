import { checkoutHref } from '@/lib/giving/links';
import type { DonationsData } from './types';

/**
 * Local seed data, read by `repository.ts` until the dashboard exists.
 *
 * TODO before launch:
 *  - Donate buttons go to the on-site donation page (`/donate/<id>`), which takes no payment until
 *    Stripe is connected (see lib/giving/payments.ts).
 *  - TRACKER FIGURES ARE SAMPLES to show the design. Replace with real numbers (or remove the
 *    `tracker` / `overview`) — never publish made-up totals.
 */

export const seedDonations: DonationsData = {
  overview: {
    title: 'Masjid running costs',
    description:
      'The share of the masjid’s ongoing bills — electricity, water, heating, internet and upkeep — covered by regular donors.',
    tracker: { display: 'percent', current: 20.1, target: 100 },
  },
  // The three causes donors can choose from (client's list). Add more here when needed.
  programs: [
    {
      id: 'new-building',
      title: 'New Building',
      summary:
        'Help us secure a permanent home for the masjid through the Make Space for Rahmah appeal.',
      cta: { label: 'Donate', href: checkoutHref('new-building') },
    },
    {
      id: 'masjid-maintenance',
      title: 'Masjid Maintenance',
      summary:
        'Keep the masjid open and cared for: bills, repairs, cleaning and day-to-day upkeep.',
      cta: { label: 'Donate', href: checkoutHref('masjid-maintenance') },
    },
    {
      id: 'zakaat',
      title: 'Zakaat',
      summary: 'Pay your Zakaat through the masjid and fulfil this pillar of Islam.',
      cta: { label: 'Donate', href: checkoutHref('zakaat') },
    },
  ],
};
