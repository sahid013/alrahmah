import { describe, expect, it } from 'vitest';
import { CONSENT_COOKIE, consentCookie } from './consent';
import { gtmHeadScript, gtmNoscriptSrc } from './gtm';

/** Runs the <head> snippet against a fake page; returns what it pushed and the script it added. */
function run(pathname: string, cookie = '') {
  const inserted: { src?: string; async?: boolean }[] = [];
  const win: { location: { pathname: string }; dataLayer?: unknown[] } = { location: { pathname } };
  const doc = {
    cookie,
    createElement: () => ({}),
    getElementsByTagName: () => [
      { parentNode: { insertBefore: (el: object) => inserted.push(el) } },
    ],
  };
  new Function('window', 'document', gtmHeadScript('GTM-W6PTLMMS'))(win, doc);
  const pushed = (win.dataLayer ?? []).map((x) =>
    typeof x === 'object' && x && 'length' in x ? Array.from(x as ArrayLike<unknown>) : x,
  );
  return { pushed, inserted };
}

const denied = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
};
const saved = (analytics: boolean, marketing: boolean) =>
  consentCookie({ source: false, analytics, marketing }, new Date(), true).split('; ')[0]!;

describe('Google Tag Manager head snippet', () => {
  it('sets every consent default to denied before loading the container', () => {
    const { pushed, inserted } = run('/');
    expect(pushed[0]).toEqual(['consent', 'default', { ...denied, wait_for_update: 500 }]);
    expect(pushed[1]).toMatchObject({ event: 'gtm.js' });
    expect(inserted).toEqual([
      { async: true, src: 'https://www.googletagmanager.com/gtm.js?id=GTM-W6PTLMMS' },
    ]);
  });

  it("applies a returning visitor's saved choice before the container loads", () => {
    const { pushed } = run('/events', `other=1; ${saved(true, false)}`);
    expect(pushed[1]).toEqual(['consent', 'update', { ...denied, analytics_storage: 'granted' }]);
    expect(pushed[2]).toMatchObject({ event: 'gtm.js' });
  });

  it('ignores a broken or out-of-date consent cookie', () => {
    expect(run('/', `${CONSENT_COOKIE}=not-json`).pushed).toHaveLength(2);
    const v1 = encodeURIComponent(JSON.stringify({ v: 1, analytics: true, at: 'x' }));
    expect(run('/', `${CONSENT_COOKIE}=${v1}`).pushed).toHaveLength(2);
  });

  it('never runs on the staff dashboard', () => {
    const { pushed, inserted } = run('/dashboard/donations', saved(true, true));
    expect(pushed).toEqual([]);
    expect(inserted).toEqual([]);
  });

  it('builds the noscript iframe address', () => {
    expect(gtmNoscriptSrc('GTM-W6PTLMMS')).toBe(
      'https://www.googletagmanager.com/ns.html?id=GTM-W6PTLMMS',
    );
  });
});
