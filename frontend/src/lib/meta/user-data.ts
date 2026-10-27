import { createHash } from 'node:crypto';

/**
 * Pure helpers for Meta Conversions API `user_data`, as Meta's customer-information rules ask:
 * personal fields are normalised (trimmed, lowercase, no spaces or punctuation where Meta says so)
 * and SHA-256 hashed; fbp, fbc, IP address and user agent are sent as they are.
 */
export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const lower = (v: string | undefined) => v?.trim().toLowerCase() || undefined;
/** Letters and digits only (Meta's rule for city and postcode). */
const compact = (v: string | undefined) => lower(v)?.replace(/[^\p{L}\p{N}]/gu, '') || undefined;

/** Country calling codes for numbers written without one (e.g. UK "07700 900133"). */
const CALLING_CODES: Record<string, string> = { GB: '44', IE: '353' };

/** A phone number as digits with its country code, e.g. "07700 900133" (GB) → "447700900133". */
export function phoneWithCountryCode(phone: string, country: string): string | undefined {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return undefined;
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  const code = CALLING_CODES[country.toUpperCase()];
  if (code && digits.startsWith('0')) return code + digits.slice(1);
  return digits;
}

export interface Person {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  postcode?: string;
  /** ISO 3166 alpha-2, e.g. GB. */
  country?: string;
  /** Donor id or Stripe Customer id. */
  externalId?: string;
}

export interface Browser {
  fbp?: string;
  fbc?: string;
  ip?: string;
  userAgent?: string;
}

/** `user_data` for one event; fields that are missing are left out. */
export function userData(person: Person, browser: Browser): Record<string, string | string[]> {
  const hashed = (v: string | undefined) => (v ? [sha256(v)] : undefined);
  const phone = person.phone && phoneWithCountryCode(person.phone, person.country ?? 'GB');
  const fields = {
    em: hashed(lower(person.email)),
    ph: hashed(phone),
    fn: hashed(lower(person.firstName)),
    ln: hashed(lower(person.lastName)),
    ct: hashed(compact(person.city)),
    zp: hashed(compact(person.postcode)),
    country: hashed(lower(person.country)),
    external_id: hashed(lower(person.externalId)),
    fbp: browser.fbp,
    fbc: browser.fbc,
    client_ip_address: browser.ip,
    client_user_agent: browser.userAgent,
  };
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v)) as Record<
    string,
    string | string[]
  >;
}

/** One cookie's value from a Cookie header. */
export function cookieValue(header: string, name: string): string | undefined {
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('=')) || undefined;
  }
  return undefined;
}

/** The first GA4 session cookie (`_ga_<measurement id>`) in a Cookie header. */
export function gaSessionCookie(header: string): string | undefined {
  const part = header
    .split(';')
    .map((p) => p.trim())
    .find((p) => /^_ga_[A-Z0-9]+=/.test(p));
  return part ? part.slice(part.indexOf('=') + 1) : undefined;
}

/** `_ga` cookie "GA1.1.1234567890.1700000000" → client id "1234567890.1700000000". */
export function gaClientId(cookie: string | undefined): string | undefined {
  const parts = cookie?.split('.');
  return parts && parts.length >= 4 ? parts.slice(-2).join('.') : undefined;
}

/** `_ga_<id>` cookie → session id: "GS1.1.1700000000.3…" or "GS2.1.s1700000000$o3…". */
export function gaSessionId(cookie: string | undefined): string | undefined {
  if (!cookie) return undefined;
  const v2 = cookie.match(/^GS2\.\d+\.s(\d+)/);
  if (v2) return v2[1];
  const v1 = cookie.match(/^GS1\.\d+\.(\d+)\./);
  return v1?.[1];
}

/** The _fbc cookie, or one built from the landing page's fbclid: fb.1.{ms}.{fbclid}. */
export function fbcFrom(
  cookie: string | undefined,
  fbclid: string | undefined,
  at: number | undefined,
): string | undefined {
  if (cookie) return cookie;
  return fbclid && at ? `fb.1.${at}.${fbclid}` : undefined;
}
