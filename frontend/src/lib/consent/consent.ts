import { z } from 'zod';

/**
 * Cookie consent (UK GDPR / PECR). Strictly necessary storage (the consent cookie itself, the
 * Stripe payment form, dashboard sign-in) needs no consent. Everything else is off until the
 * visitor opts in, and can be changed at any time from "Cookie settings" in the footer.
 *
 * Bump CONSENT_VERSION when a category is added or its purpose changes: everyone is asked again.
 */
export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE = 'alrahmah_consent';
/** Six months, then ask again. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/** Optional categories. Necessary storage is always on and isn't stored. */
export const CONSENT_CATEGORIES = {
  analytics: {
    title: 'Donation source',
    description:
      'Remembers how you found the site (for example a link in a newsletter or social post) for this visit, and sends it with any donation, so we know which appeals reach people. Nothing is shared with other companies.',
  },
  media: {
    title: 'External media',
    description:
      'Loads the khutbah videos from YouTube and the map from Google Maps. Google may set cookies and use them to recognise you across other sites.',
  },
} as const;
export type ConsentCategory = keyof typeof CONSENT_CATEGORIES;
export const CONSENT_CATEGORY_IDS = Object.keys(CONSENT_CATEGORIES) as ConsentCategory[];

export type ConsentChoices = Record<ConsentCategory, boolean>;

const storedSchema = z.object({
  v: z.literal(CONSENT_VERSION),
  analytics: z.boolean(),
  media: z.boolean(),
  /** When the choice was made (ISO), as a record of consent. */
  at: z.string(),
});
export type StoredConsent = z.infer<typeof storedSchema>;

export const ACCEPT_ALL: ConsentChoices = { analytics: true, media: true };
export const REJECT_ALL: ConsentChoices = { analytics: false, media: false };

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
