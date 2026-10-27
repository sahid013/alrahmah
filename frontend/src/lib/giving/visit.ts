import { readConsent } from '@/lib/consent/consent';
import {
  cookieValue,
  fbcFrom,
  gaClientId,
  gaSessionCookie,
  gaSessionId,
  type Browser,
} from '@/lib/meta/user-data';
import type { DonationSource } from './types';

/**
 * What the Meta server events need from the donor's visit, saved with the donation (Stripe
 * metadata) because those events can be sent days or months later (Direct Debit, renewals).
 * Read from the request that starts the payment: first-party cookies, IP address, user agent.
 *
 * `consent_status` is the visitor's Marketing cookie choice. Server events are sent either way
 * (Irfan's decision, October 2026), but without consent only the IP address and user agent go
 * with them: no fbp/fbc and no hashed email, phone or other details (`userData(…, false)`).
 * The GA ids are kept with Analytics consent.
 */
export interface Visit {
  consent: boolean;
  analytics: boolean;
  browser: Browser;
  gaClientId?: string;
  gaSessionId?: string;
}

const clip = (v: string | undefined, n = 500) => v?.slice(0, n);

export function visitFrom(headers: Headers, source?: DonationSource): Visit {
  const cookies = headers.get('cookie') ?? '';
  const choice = readConsent(cookies);
  const consent = !!choice?.marketing;
  const analytics = !!choice?.analytics;
  return {
    consent,
    analytics,
    browser: {
      ...(consent && {
        fbp: cookieValue(cookies, '_fbp'),
        fbc: fbcFrom(cookieValue(cookies, '_fbc'), source?.fbclid, source?.fbclidAt),
      }),
      ip:
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        undefined,
      userAgent: clip(headers.get('user-agent') ?? undefined),
    },
    ...(analytics && {
      gaClientId: gaClientId(cookieValue(cookies, '_ga')),
      gaSessionId: gaSessionId(gaSessionCookie(cookies)),
    }),
  };
}

/** The visit as Stripe metadata (empty values are skipped by Stripe's 500-character rule too). */
export function visitMetadata(
  visit: Visit,
  source: DonationSource | undefined,
  eventSourceUrl: string,
): Record<string, string> {
  const b = visit.browser;
  return {
    consent_status: visit.consent ? 'yes' : 'no',
    event_source_url: clip(eventSourceUrl) ?? '',
    fbp: clip(b.fbp) ?? '',
    fbc: clip(b.fbc) ?? '',
    client_ip_address: b.ip ?? '',
    client_user_agent: b.userAgent ?? '',
    ga_client_id: visit.gaClientId ?? '',
    ga_session_id: visit.gaSessionId ?? '',
    utm_content: source?.utmContent ?? '',
    gclid: source?.gclid ?? '',
    gbraid: source?.gbraid ?? '',
    wbraid: source?.wbraid ?? '',
  };
}

/** The saved visit back from Stripe metadata. */
export function browserFromMetadata(m: Record<string, string>): Browser {
  return {
    fbp: m.fbp || undefined,
    fbc: m.fbc || undefined,
    ip: m.client_ip_address || undefined,
    userAgent: m.client_user_agent || undefined,
  };
}
