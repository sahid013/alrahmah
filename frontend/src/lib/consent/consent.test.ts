import { describe, expect, it } from 'vitest';
import {
  ACCEPT_ALL,
  CONSENT_COOKIE,
  REJECT_ALL,
  consentCookie,
  googleConsent,
  isTrackingCookie,
  readConsent,
} from './consent';

const now = new Date('2026-10-17T12:00:00Z');
/** The `name=value` part of a Set-Cookie string, as `document.cookie` would return it. */
const pair = (cookie: string) => cookie.split('; ')[0]!;

describe('consent cookie', () => {
  it('round-trips a choice', () => {
    const choices = { source: true, analytics: false, marketing: true };
    const header = `other=1; ${pair(consentCookie(choices, now, true))}`;
    expect(readConsent(header)).toEqual({ v: 2, ...choices, at: '2026-10-17T12:00:00.000Z' });
  });

  it('treats a missing, broken or old-version cookie as no choice', () => {
    expect(readConsent('')).toBeNull();
    expect(readConsent(`${CONSENT_COOKIE}=not-json`)).toBeNull();
    // Version 1 (before Analytics and Marketing existed): everyone is asked again.
    const v1 = encodeURIComponent(JSON.stringify({ v: 1, analytics: true, media: true, at: 'x' }));
    expect(readConsent(`${CONSENT_COOKIE}=${v1}`)).toBeNull();
  });

  it('lasts six months, is site-wide and only Secure over https', () => {
    const secure = consentCookie(REJECT_ALL, now, true);
    expect(secure).toContain('Path=/');
    expect(secure).toContain(`Max-Age=${60 * 60 * 24 * 182}`);
    expect(secure).toContain('SameSite=Lax');
    expect(secure).toContain('Secure');
    expect(consentCookie(REJECT_ALL, now, false)).not.toContain('Secure');
  });
});

describe('Google Consent Mode', () => {
  it('grants storage only for the categories allowed', () => {
    expect(googleConsent({ source: true, analytics: true, marketing: false })).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    expect(Object.values(googleConsent(ACCEPT_ALL)).every((v) => v === 'granted')).toBe(true);
    expect(Object.values(googleConsent(REJECT_ALL)).every((v) => v === 'denied')).toBe(true);
  });

  it('knows which cookies to clear when consent is withdrawn', () => {
    for (const name of ['_ga', '_ga_ABC123', '_gid', '_gat_UA-1', '_gcl_au', '_fbp', '_fbc'])
      expect(isTrackingCookie(name)).toBe(true);
    for (const name of [CONSENT_COOKIE, '__stripe_mid', 'gallery', '_game'])
      expect(isTrackingCookie(name)).toBe(false);
  });
});
