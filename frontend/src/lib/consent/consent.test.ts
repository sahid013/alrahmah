import { describe, expect, it } from 'vitest';
import { ACCEPT_ALL, CONSENT_COOKIE, REJECT_ALL, consentCookie, readConsent } from './consent';

const now = new Date('2026-10-17T12:00:00Z');
/** The `name=value` part of a Set-Cookie string, as `document.cookie` would return it. */
const pair = (cookie: string) => cookie.split('; ')[0]!;

describe('consent cookie', () => {
  it('round-trips a choice', () => {
    const header = `other=1; ${pair(consentCookie({ analytics: false, media: true }, now, true))}`;
    expect(readConsent(header)).toEqual({
      v: 1,
      analytics: false,
      media: true,
      at: '2026-10-17T12:00:00.000Z',
    });
  });

  it('treats a missing, broken or old-version cookie as no choice', () => {
    expect(readConsent('')).toBeNull();
    expect(readConsent(`${CONSENT_COOKIE}=not-json`)).toBeNull();
    const old = encodeURIComponent(JSON.stringify({ ...ACCEPT_ALL, v: 0, at: 'x' }));
    expect(readConsent(`${CONSENT_COOKIE}=${old}`)).toBeNull();
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
