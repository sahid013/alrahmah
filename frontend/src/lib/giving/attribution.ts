import { SOURCE_LIMITS } from './source-limits';
import type { DonationSource } from './types';

/**
 * Where a visitor came from (UTM tags, ad click ids, referring site, landing page), kept for the
 * browser session so it can be sent with a donation: these only appear on the page the donor lands
 * on. Arriving with UTM tags or a click id replaces what was stored;
 * otherwise the first page of the visit is kept. Storage can be unavailable (private mode):
 * everything here then quietly does nothing.
 */
const KEY = 'alrahmah.source';
const SOURCE_KEYS = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'fbclid',
  'fbclidAt',
  'gclid',
  'gbraid',
  'wbraid',
  'referrer',
  'landingPage',
] as const satisfies readonly (keyof DonationSource)[];

/**
 * The same rules as the server's source schema, checked by hand: this runs on every page, and
 * zod would add about 85 KiB to each one. The server validates again.
 */
function toSource(value: unknown): DonationSource {
  if (typeof value !== 'object' || value === null) throw new Error('Not a source');
  const input = value as Record<string, unknown>;
  const source: DonationSource = {};
  // Same key order as the schema, so the stored JSON is identical.
  for (const key of SOURCE_KEYS) {
    const v = input[key];
    if (v === undefined) continue;
    if (key === 'fbclidAt') {
      if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) throw new Error('Bad fbclidAt');
      source.fbclidAt = v;
    } else {
      if (typeof v !== 'string' || v.length > SOURCE_LIMITS[key]) throw new Error(`Bad ${key}`);
      source[key] = v;
    }
  }
  return source;
}

/** The page the visitor arrived on, without consent: kept in memory only (never stored). */
let arrival: DonationSource | undefined;

/**
 * Without "Donation source" consent (marketing team, November 2026: most visitors decline, so most
 * donations from the ads arrived in Stripe with no source): the campaign tags of the link the
 * visitor arrived on, the referring site and that landing page, read from the URL when the site
 * first loads and kept in this page's memory, nothing saved in the browser. Moving between pages
 * keeps it (client-side navigation); a reload or a new tab starts again. No ad click ids
 * (fbclid, gclid…), so no fbc for these donors.
 */
export function rememberArrival(location: Location, referrer: string) {
  if (arrival) return;
  try {
    const params = new URLSearchParams(location.search);
    const get = (name: string) => params.get(name) || undefined;
    const external = referrer && new URL(referrer).host !== location.host ? referrer : undefined;
    arrival = toSource({
      utmSource: get('utm_source'),
      utmMedium: get('utm_medium'),
      utmCampaign: get('utm_campaign'),
      utmContent: get('utm_content'),
      referrer: external?.slice(0, 300),
      landingPage: location.pathname.slice(0, 300),
    });
  } catch {
    /* odd values: no source */
  }
}

export function captureSource(location: Location, referrer: string, now = Date.now()) {
  try {
    const params = new URLSearchParams(location.search);
    const get = (name: string) => params.get(name) || undefined;
    const fbclid = get('fbclid');
    const utm = {
      utmSource: get('utm_source'),
      utmMedium: get('utm_medium'),
      utmCampaign: get('utm_campaign'),
      utmContent: get('utm_content'),
      fbclid,
      fbclidAt: fbclid ? now : undefined,
      gclid: get('gclid'),
      gbraid: get('gbraid'),
      wbraid: get('wbraid'),
    };
    const hasUtm = Object.values(utm).some(Boolean);
    if (!hasUtm && sessionStorage.getItem(KEY)) return;
    // Only other sites count as referrers (not moving between our own pages).
    const external = referrer && new URL(referrer).host !== location.host ? referrer : undefined;
    const source = toSource({
      ...utm,
      referrer: external?.slice(0, 300),
      landingPage: location.pathname.slice(0, 300),
    });
    sessionStorage.setItem(KEY, JSON.stringify(source));
  } catch {
    /* storage unavailable or odd values: no source */
  }
}

/** Forgets the stored source (when the visitor turns "Donation source" cookies off). */
export function clearSource() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: nothing stored */
  }
}

/** The source to send with a donation: the stored one (with consent), else the arrival page's. */
export function readSource(): DonationSource | undefined {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return toSource(JSON.parse(raw));
  } catch {
    /* storage unavailable or odd values */
  }
  return arrival;
}
