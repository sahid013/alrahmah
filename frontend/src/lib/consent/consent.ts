import { z } from 'zod';

/**
 * Cookie consent (UK GDPR / PECR). Strictly necessary storage (the consent cookie itself, the
 * Stripe payment form, dashboard sign-in) needs no consent. Everything else is off until the
 * visitor opts in, and can be changed at any time from "Cookie settings" in the footer.
 *
 * Bump CONSENT_VERSION when a category is added or its purpose changes: everyone is asked again.
 */
export const CONSENT_VERSION = 2;
export const CONSENT_COOKIE = 'alrahmah_consent';
/** Six months, then ask again. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/**
 * Optional categories. Necessary storage is always on and isn't stored. `analytics` and
 * `marketing` load Google Tag Manager (`components/consent/google-tag-manager.tsx`).
 */
export const CONSENT_CATEGORIES = {
  source: {
    title: 'Donation source',
    description:
      'Remembers how you found the site (for example a link in a newsletter or social post) for this visit, and sends it with any donation, so we know which appeals reach people. Nothing is shared with other companies.',
  },
  analytics: {
    title: 'Analytics',
    description:
      'Google Analytics counts visits and shows which pages are used, so we can improve the site. Google sets cookies to tell visits apart.',
  },
  marketing: {
    title: 'Marketing',
    description:
      'Lets Meta (Facebook, Instagram) and Google measure whether our adverts lead to visits and donations, and show our appeals to people who have visited. They set cookies and may recognise you across other sites.',
  },
} as const;
export type ConsentCategory = keyof typeof CONSENT_CATEGORIES;
export const CONSENT_CATEGORY_IDS = Object.keys(CONSENT_CATEGORIES) as ConsentCategory[];

export type ConsentChoices = Record<ConsentCategory, boolean>;

const storedSchema = z.object({
  v: z.literal(CONSENT_VERSION),
  source: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  /** When the choice was made (ISO), as a record of consent. */
  at: z.string(),
});
export type StoredConsent = z.infer<typeof storedSchema>;

export const ACCEPT_ALL: ConsentChoices = { source: true, analytics: true, marketing: true };
export const REJECT_ALL: ConsentChoices = { source: false, analytics: false, marketing: false };

/**
 * Google Consent Mode v2 signals for a choice: Tag Manager's tags read these to decide what
 * may run and store.
 */
export function googleConsent(choices: ConsentChoices) {
  const state = (on: boolean) => (on ? 'granted' : 'denied');
  return {
    analytics_storage: state(choices.analytics),
    ad_storage: state(choices.marketing),
    ad_user_data: state(choices.marketing),
    ad_personalization: state(choices.marketing),
  } as const;
}

/** Cookies Google Analytics, Google Ads and the Meta pixel set, cleared when consent is withdrawn. */
export const isTrackingCookie = (name: string) =>
  /^(_ga|_ga_.+|_gid|_gat.*|_gcl_.+|_fbp|_fbc)$/.test(name);

/** The visitor's saved choice from a `document.cookie` string, or null if they haven't chosen (or it's out of date). */
export function readConsent(cookieHeader: string): StoredConsent | null {
  const raw = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const parsed = storedSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The `document.cookie` assignment that saves a choice. */
export function consentCookie(choices: ConsentChoices, now: Date, secure: boolean): string {
  const value: StoredConsent = { v: CONSENT_VERSION, ...choices, at: now.toISOString() };
  return [
    `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SECONDS}`,
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}
