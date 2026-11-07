import { siteConfig } from '@/config/site';

/**
 * The privacy notice (`/privacy`, November 2026), written from what the website actually does.
 * Drafted by the developer; the centre (and its data protection adviser) should check the
 * lawful bases, retention periods and transfers before relying on it. Keep it in step with
 * the code: a new service that receives personal data needs a row in `PRIVACY_PROVIDERS`, and
 * anything stored in the browser goes on `/cookies` (`lib/consent/cookie-list.ts`).
 */
export const PRIVACY_UPDATED = '4 November 2026';

export interface PrivacySection {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
}

const name = siteConfig.name;

/** What we collect and why, by what people do on the site. */
export const PRIVACY_USES: PrivacySection[] = [
  {
    id: 'donations',
    title: 'When you donate',
    paragraphs: [
      'We collect your name, email address, phone number, postal address, country, whether you give as an individual or for an organisation, the amount, cause and how often you give. We use these to take your donation, send your receipt, look after regular gifts (for example if a payment fails or you ask to cancel) and keep the financial records a charity must keep.',
      'Your card or bank details go straight to Stripe, our payment provider. We never see or store them.',
      'Lawful basis: taking and recording your donation is necessary for the donation you asked us to process (contract), and keeping financial records is a legal obligation.',
    ],
  },
  {
    id: 'gift-aid',
    title: 'Gift Aid',
    paragraphs: [
      'If you add Gift Aid, we keep your declaration (its exact wording and the date you made it) with your name, home address and donations, and send the details HMRC needs to claim the tax back.',
      'Lawful basis: legal obligation. HMRC requires charities to keep Gift Aid records, so we keep them for at least six years after the claim.',
    ],
  },
  {
    id: 'updates',
    title: 'Email updates',
    paragraphs: [
      `If you tick "Keep me updated" when you donate, we add your name, email address, town and country to our mailing list, with a record of when and how you agreed, and email you about ${name} news, events and appeals.`,
      'Lawful basis: your consent. You can unsubscribe at any time by replying to one of our emails or writing to us, and we keep a record that you did.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact forms',
    paragraphs: [
      'When you send a message through the website (general enquiries and funerals), we keep your name, email address and message, and email it to the right team so they can reply.',
      'Lawful basis: our legitimate interest in answering you.',
    ],
  },
  {
    id: 'source',
    title: 'How you found us',
    paragraphs: [
      'When you donate, we record how you reached the site: the campaign tags in the link you arrived with (for example from one of our adverts, newsletters or WhatsApp messages), the website you came from and the first page you visited. This is saved with your donation, so we know which appeals reach people. Without your consent to "Donation source" cookies nothing is stored in your browser; the tags are only read from the page you arrive on.',
      'Lawful basis: our legitimate interest in knowing which appeals work.',
    ],
  },
  {
    id: 'advertising',
    title: 'Measuring our adverts',
    paragraphs: [
      'We tell Meta (Facebook, Instagram) when a donation is started and made, with the amount and cause, so we can see whether our adverts lead to donations. If you accept Marketing cookies, this includes your email address, phone number, name, town, postcode and country, scrambled (hashed) before they are sent, and Meta’s cookie identifiers, so Meta can match the donation to an advert. If you decline, only your IP address and browser type go with it.',
      'Google Analytics and Google Ads run only with your consent (see our cookie policy).',
      'Lawful basis: your consent for the identifying details and cookies; our legitimate interest in measuring our adverts for the rest.',
    ],
  },
  {
    id: 'security',
    title: 'Keeping the site secure',
    paragraphs: [
      'To stop automated attacks on the donation form, we use Cloudflare Turnstile at the payment step and limit how many payment attempts can be made. We also limit how many messages can be sent through the contact forms. For these limits we keep a scrambled (hashed) version of your IP address, never the address itself: payment attempts for seven days.',
      'Lawful basis: our legitimate interest in protecting donors and the charity from fraud.',
    ],
  },
];

export interface PrivacyProvider {
  service: string;
  provider: string;
  purpose: string;
  data: string;
}

/** Who receives personal data from the website (shown as the table on `/privacy`). */
export const PRIVACY_PROVIDERS: PrivacyProvider[] = [
  {
    service: 'Payments',
    provider: 'Stripe',
    purpose: 'Takes donations and regular payments, and checks payments for fraud.',
    data: 'Name, email, address, card or bank details, amount, IP address and device details.',
  },
  {
    service: 'CAPTCHA (bot check)',
    provider: 'Cloudflare (Turnstile)',
    purpose:
      'Checks you are a person, not an automated attack, at the payment step of the donation form. Sets no tracking cookies and is not used for advertising.',
    data: 'IP address and information about your browser and device.',
  },
  {
    service: 'Database',
    provider: 'Supabase',
    purpose:
      'Stores donation records, Gift Aid declarations, the mailing list and contact messages.',
    data: 'The details you give us on the donation and contact forms.',
  },
  {
    service: 'Website hosting',
    provider: 'Vercel',
    purpose: 'Runs the website.',
    data: 'IP address and browser details, in short-lived server logs.',
  },
  {
    service: 'Email',
    provider: 'Resend',
    purpose: 'Sends donation receipts and delivers contact form messages to our inbox.',
    data: 'Name, email address and the content of the email.',
  },
  {
    service: 'Advert measurement',
    provider: 'Meta',
    purpose: 'Shows whether our adverts lead to donations.',
    data: 'Amount and cause; with your consent, hashed contact details and cookie identifiers; without, only IP address and browser type.',
  },
  {
    service: 'Analytics and ads',
    provider: 'Google',
    purpose: 'Counts visits and measures our adverts, only with your consent.',
    data: 'Cookie identifiers, pages visited, IP address.',
  },
  {
    service: 'Video and map',
    provider: 'Google (YouTube, Maps)',
    purpose: 'Plays the weekly khutbah and shows our location on the contact page.',
    data: 'IP address and browser details when the player or map loads.',
  },
  {
    service: 'Gift Aid claims',
    provider: 'HMRC',
    purpose: 'Pays the Gift Aid we claim on your donations.',
    data: 'Name, house name or number, postcode, donation dates and amounts.',
  },
];

export const PRIVACY_RIGHTS = [
  'see the personal data we hold about you and get a copy of it;',
  'have it corrected if it is wrong;',
  'have it deleted, unless we must keep it (for example Gift Aid records);',
  'object to, or ask us to limit, how we use it;',
  'withdraw your consent at any time, for email updates or cookies;',
  'receive the data you gave us in a format you can pass on.',
];
