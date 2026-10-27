import { sourceSchema, type DonationSource } from './types';

/**
 * Where a visitor came from (UTM tags, ad click ids, referring site, landing page), kept for the
 * browser session so it can be sent with a donation: these only appear on the page the donor lands
 * on. Arriving with UTM tags or a click id replaces what was stored;
 * otherwise the first page of the visit is kept. Storage can be unavailable (private mode):
 * everything here then quietly does nothing.
 */
const KEY = 'alrahmah.source';

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
    const source = sourceSchema.parse({
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

export function readSource(): DonationSource | undefined {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? sourceSchema.parse(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}
