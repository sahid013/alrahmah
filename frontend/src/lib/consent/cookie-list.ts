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
    title: 'Khutbah video',
    optional: false,
    description:
      'The weekly khutbah on the home page plays in YouTube’s privacy-enhanced mode (youtube-nocookie.com) and loads without asking first.',
    entries: [
      {
        name: 'YouTube player',
        provider: 'Google',
        purpose:
          'Plays the weekly khutbah on the home page. YouTube doesn’t set cookies until you press play, but the player may use similar browser storage, and Google receives your IP address when it loads.',
        duration: 'Set by Google',
      },
    ],
  },
  {
    title: 'External media',
    optional: true,
    description:
      'Only with your consent. Until then the map shows a placeholder with a link to open it on Google Maps instead.',
    entries: [
      {
        name: 'Google Maps',
        provider: 'Google',
        purpose: 'Shows the map to the masjid on the contact page. Google may set cookies.',
        duration: 'Set by Google',
      },
    ],
  },
];
