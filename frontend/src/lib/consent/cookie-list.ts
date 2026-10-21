/**
 * Every cookie and browser-storage item the website uses, shown on /cookies. Keep it in step
 * with the code: anything new that stores data in the browser is listed here, under the consent
 * category that controls it (`lib/consent/consent.ts`), before it ships.
 */

export interface CookieEntry {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

export interface CookieGroup {
  title: string;
  /** Whether visitors can switch it off. */
  optional: boolean;
  description: string;
  entries: CookieEntry[];
}

export const cookieGroups: CookieGroup[] = [
  {
    title: 'Necessary',
    optional: false,
    description:
      'Needed for the site to work, so they don’t need your consent. They are never used to track you.',
    entries: [
      {
        name: 'alrahmah_consent',
        provider: 'Al-Rahmah Masjid',
        purpose: 'Remembers your cookie choices, so we don’t ask on every page.',
        duration: '6 months',
      },
      {
        name: '__stripe_mid, __stripe_sid',
        provider: 'Stripe',
        purpose:
          'Fraud prevention for payments. Set only once you reach the payment step of the donation form.',
        duration: '1 year; 30 minutes',
      },
      {
        name: 'sb-…-auth-token (local storage)',
        provider: 'Supabase',
        purpose: 'Keeps masjid staff signed in to the website dashboard. Not used for visitors.',
        duration: 'Until the staff member signs out',
      },
    ],
  },
  {
    title: 'Donation source',
    optional: true,
    description: 'Only with your consent.',
    entries: [
      {
        name: 'alrahmah.source (session storage)',
        provider: 'Al-Rahmah Masjid',
        purpose:
          'How you found the site (campaign tags in the link, the site you came from, the first page you visited), sent with any donation you make so we know which appeals reach people.',
        duration: 'Until you close the browser tab',
      },
    ],
  },
  {
    title: 'Analytics',
    optional: true,
    description:
      'Only with your consent. Google Tag Manager loads on every page but sets no cookies itself; until you allow these, Google’s tags run with consent denied, store nothing, and may send only anonymous, cookieless measurements.',
    entries: [
      {
        name: '_ga, _ga_<id>',
        provider: 'Google Analytics',
        purpose: 'Tells visits apart so we can count visitors and see which pages are used.',
        duration: '2 years',
      },
    ],
  },
  {
    title: 'Marketing',
    optional: true,
    description:
      'Only with your consent. Until you allow these, advertising tags run with consent denied and store nothing.',
    entries: [
      {
        name: '_fbp, _fbc',
        provider: 'Meta (Facebook, Instagram)',
        purpose:
          'Measures whether our adverts on Facebook and Instagram lead to visits and donations, and lets us show our appeals to people who have visited.',
        duration: '3 months',
      },
      {
        name: '_gcl_au',
        provider: 'Google Ads',
        purpose: 'Measures whether our Google adverts lead to visits and donations.',
        duration: '3 months',
      },
    ],
  },
  {
    title: 'Video and map',
    optional: false,
    description:
      'The khutbah video on the home page and the map on the contact page load from Google without asking first. Google receives your IP address when they load.',
    entries: [
      {
        name: 'YouTube player',
        provider: 'Google',
        purpose:
          'Plays the weekly khutbah on the home page, in YouTube’s privacy-enhanced mode (youtube-nocookie.com): no cookies until you press play, but the player may use similar browser storage.',
        duration: 'Set by Google',
      },
      {
        name: 'Google Maps',
        provider: 'Google',
        purpose: 'Shows the map to the masjid on the contact page. Google may set cookies.',
        duration: 'Set by Google',
      },
    ],
  },
];
