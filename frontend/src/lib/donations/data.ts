import type { DonationsData } from './types';

/**
 * Local seed data, read by `repository.ts` until the dashboard exists.
 *
 * TODO before launch:
 *  - `cta.href`: confirm each programme's real donation link. Only Jummah Giving and My Masjid
 *    links come from the posters; the rest point to the fundraising platform's home page.
 *  - TRACKER FIGURES ARE SAMPLES to show the design. Replace with real numbers (or remove the
 *    `tracker` / `overview`) — never publish made-up totals.
 */
const FUNDRAISING = 'https://fundraising.alrahmah.org.uk/';

export const seedDonations: DonationsData = {
  overview: {
    title: 'Masjid running costs',
    description:
      'The share of the masjid’s ongoing bills — electricity, water, heating, internet and upkeep — covered by regular donors.',
    tracker: { display: 'percent', current: 20.1, target: 100 },
  },
  programs: [
    {
      id: 'masjid-renovations',
      title: 'Masjid Renovations',
      summary: 'Help us maintain and improve the masjid for everyone who prays and learns here.',
      image: {
        src: '/images/donations/masjid-renovations-poster.webp',
        alt: 'Renovation work inside the masjid',
      },
      cta: { label: 'Donate', href: FUNDRAISING },
      tracker: { display: 'amount', current: 3200, target: 10000 },
    },
    {
      id: 'daily-iftar',
      title: 'Daily Masjid Iftar',
      summary:
        'Whoever gives food for a fasting person to break his fast will have a reward like theirs. [Sunan Ibn Majah]',
      image: {
        src: '/images/donations/daily-iftar-poster.webp',
        alt: 'Donate toward Daily Iftar at the Masjid poster',
      },
      cta: { label: 'Donate', href: FUNDRAISING },
      tracker: { display: 'donors', current: 18, target: 30 },
    },
    {
      id: 'jummah-giving',
      title: 'Jummah Giving',
      summary: 'Make a lasting impact every Friday with an automatic weekly donation.',
      image: {
        src: '/images/donations/jummah-giving-poster.webp',
        alt: 'Every Friday with Jummah Giving poster',
      },
      cta: { label: 'Select options', href: 'https://alrahmah.org.uk/jummahgiving' },
    },
    {
      id: 'my-masjid',
      title: 'Support Al-Rahmah Masjid',
      summary: 'The deeds most loved by Allah are those done regularly, even if they are small.',
      image: {
        src: '/images/donations/my-masjid-poster.webp',
        alt: 'My Masjid monthly giving poster',
      },
      price: { amount: 20, period: 'month' },
      cta: { label: 'Sign up now', href: 'https://www.alrahmah.org.uk/mymasjid' },
      tracker: { display: 'donors', current: 64, target: 100 },
    },
    {
      id: 'regular-giving',
      title: 'Regular Giving',
      summary: 'Donate any amount on a monthly basis through our automated subscription option.',
      image: { src: '/images/donations/regular-giving-poster.webp', alt: 'Regular Giving poster' },
      price: { amount: 10, period: 'month' },
      cta: { label: 'Sign up now', href: FUNDRAISING },
    },
    {
      id: 'general-sadaqah',
      title: 'General Sadaqah',
      summary: '“Give the Sadaqah without delay, for it stands in the way of calamity.” [Tirmidhi]',
      image: {
        src: '/images/donations/general-sadaqah-poster.webp',
        alt: 'General Sadaqah poster',
      },
      cta: { label: 'Donate', href: FUNDRAISING },
    },
    {
      id: 'zakaah',
      title: 'Zakaah',
      summary: 'Pay your Zakaah through the masjid and fulfil this pillar of Islam.',
      image: { src: '/images/donations/zakaah-poster.webp', alt: 'Pay your Zakaah poster' },
      cta: { label: 'Donate', href: FUNDRAISING },
    },
  ],
};
