import { describe, expect, it } from 'vitest';
import { readConsent } from '@/lib/consent/consent';
import { visitFrom, visitMetadata } from '@/lib/giving/visit';
import {
  cookieValue,
  fbcFrom,
  gaClientId,
  gaSessionId,
  phoneWithCountryCode,
  sha256,
  userData,
} from './user-data';

describe('Meta user_data', () => {
  it('adds the country code to phone numbers', () => {
    expect(phoneWithCountryCode('07700 900133', 'GB')).toBe('447700900133');
    expect(phoneWithCountryCode('+44 7700 900133', 'GB')).toBe('447700900133');
    expect(phoneWithCountryCode('0044 7700 900133', 'GB')).toBe('447700900133');
    expect(phoneWithCountryCode('+1 (555) 010-0000', 'US')).toBe('15550100000');
  });

  it('normalises and hashes personal fields, leaves browser fields as they are', () => {
    const data = userData(
      {
        email: ' Aisha@Example.com ',
        phone: '07700 900133',
        firstName: 'Aisha',
        lastName: 'Khan',
        city: 'Leeds',
        postcode: 'LS7 1AB',
        country: 'GB',
        externalId: 'cus_123',
      },
      { fbp: 'fb.1.1700000000000.123', ip: '203.0.113.9', userAgent: 'Mozilla/5.0' },
    );
    expect(data).toEqual({
      em: [sha256('aisha@example.com')],
      ph: [sha256('447700900133')],
      fn: [sha256('aisha')],
      ln: [sha256('khan')],
      ct: [sha256('leeds')],
      zp: [sha256('ls71ab')],
      country: [sha256('gb')],
      external_id: [sha256('cus_123')],
      fbp: 'fb.1.1700000000000.123',
      client_ip_address: '203.0.113.9',
      client_user_agent: 'Mozilla/5.0',
    });
  });

  it('sends only IP address and user agent for donors who declined cookies', () => {
    expect(
      userData(
        { email: 'aisha@example.com', phone: '07700 900133', firstName: 'Aisha' },
        { fbp: 'fb.1.1.99', ip: '203.0.113.9', userAgent: 'Mozilla/5.0' },
        false,
      ),
    ).toEqual({ client_ip_address: '203.0.113.9', client_user_agent: 'Mozilla/5.0' });
  });

  it('reads the GA ids from their cookies', () => {
    expect(gaClientId('GA1.1.1234567890.1700000000')).toBe('1234567890.1700000000');
    expect(gaSessionId('GS1.1.1700000000.3.1.1700000100.0.0.0')).toBe('1700000000');
    expect(gaSessionId('GS2.1.s1700000000$o3$g1$t1700000100$j60$l0$h0')).toBe('1700000000');
    expect(gaClientId(undefined)).toBeUndefined();
  });

  it('uses the _fbc cookie, else builds fbc from the landing page fbclid', () => {
    expect(fbcFrom('fb.1.1.abc', 'xyz', 5)).toBe('fb.1.1.abc');
    expect(fbcFrom(undefined, 'IwAR0abc', 1700000000000)).toBe('fb.1.1700000000000.IwAR0abc');
    expect(fbcFrom(undefined, undefined, undefined)).toBeUndefined();
  });
});

describe('visit', () => {
  const consentCookie = (marketing: boolean) =>
    `alrahmah_consent=${encodeURIComponent(
      JSON.stringify({ v: 2, source: true, analytics: true, marketing, at: '2026-10-27' }),
    )}`;
  const headers = (marketing: boolean) =>
    new Headers({
      cookie: `${consentCookie(marketing)}; _fbp=fb.1.1.99; _ga=GA1.1.11.22; _ga_ABC123=GS1.1.1700000000.1.0.0.0.0.0`,
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
      'user-agent': 'Mozilla/5.0',
    });

  it('keeps fbp/fbc only with Marketing consent; IP and user agent either way', () => {
    expect(readConsent(consentCookie(true))?.marketing).toBe(true);
    const yes = visitMetadata(visitFrom(headers(true)), undefined, 'https://x/donate/a');
    expect(yes).toMatchObject({
      consent_status: 'yes',
      fbp: 'fb.1.1.99',
      client_ip_address: '203.0.113.9',
      client_user_agent: 'Mozilla/5.0',
      ga_client_id: '11.22',
      ga_session_id: '1700000000',
    });
    const no = visitMetadata(visitFrom(headers(false)), undefined, 'https://x/donate/a');
    expect(no).toMatchObject({
      consent_status: 'no',
      fbp: '',
      client_ip_address: '203.0.113.9',
      client_user_agent: 'Mozilla/5.0',
    });
  });

  it('reads cookies by name', () => {
    expect(cookieValue('a=1; _fbc=fb.1.2.x; b=2', '_fbc')).toBe('fb.1.2.x');
  });
});
