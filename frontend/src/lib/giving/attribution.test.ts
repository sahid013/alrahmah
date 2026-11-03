import { describe, expect, it, vi } from 'vitest';

// No consent: session storage stays empty.
const store = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
});

const { captureSource, readSource, rememberArrival } = await import('./attribution');

const at = (url: string) => new URL(url) as unknown as Location;

describe('rememberArrival (no "Donation source" consent)', () => {
  it("sends the arrival page's campaign tags, referrer and landing page, without storing them", () => {
    rememberArrival(
      at(
        'https://www.alrahmahmasjid.co.uk/donate/masjid-expansion?utm_source=facebook&utm_medium=paid&utm_campaign=expansion&utm_content=video1&fbclid=abc&gclid=xyz',
      ),
      'https://l.facebook.com/',
    );
    // A later page of the same visit doesn't replace it.
    rememberArrival(at('https://www.alrahmahmasjid.co.uk/donate'), '');
    expect(readSource()).toEqual({
      utmSource: 'facebook',
      utmMedium: 'paid',
      utmCampaign: 'expansion',
      utmContent: 'video1',
      referrer: 'https://l.facebook.com/',
      landingPage: '/donate/masjid-expansion',
    });
    expect(store.size).toBe(0);
  });

  it('prefers the stored source once the visitor consents', () => {
    captureSource(at('https://www.alrahmahmasjid.co.uk/?utm_source=newsletter'), '');
    expect(readSource()).toMatchObject({ utmSource: 'newsletter', landingPage: '/' });
  });
});
