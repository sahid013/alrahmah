import { describe, expect, it } from 'vitest';
import { formatLongDate, nextPaymentDate, shareLink, whatsappShareUrl } from './confirmation';

describe('nextPaymentDate', () => {
  const at = (iso: string) => new Date(iso);

  it('is a week or a month on, in UK dates', () => {
    expect(formatLongDate(nextPaymentDate('weekly', at('2026-10-27T10:00:00Z'))!)).toBe(
      'Tuesday 3 November 2026',
    );
    expect(formatLongDate(nextPaymentDate('monthly', at('2026-10-27T10:00:00Z'))!)).toBe(
      'Friday 27 November 2026',
    );
  });

  it('uses the last day of a shorter month, and the UK date late at night', () => {
    expect(formatLongDate(nextPaymentDate('monthly', at('2027-01-31T12:00:00Z'))!)).toBe(
      'Sunday 28 February 2027',
    );
    // 23:30 UK time on 30 June (BST) is still 30 June.
    expect(formatLongDate(nextPaymentDate('monthly', at('2026-06-30T22:30:00Z'))!)).toBe(
      'Thursday 30 July 2026',
    );
  });

  it('is undefined for one-off and daily gifts', () => {
    expect(nextPaymentDate('one-off', new Date())).toBeUndefined();
    expect(nextPaymentDate('daily', new Date())).toBeUndefined();
  });
});

describe('WhatsApp share', () => {
  it('links to the cause with share tags, without the amount', () => {
    const link = shareLink('https://www.alrahmahmasjid.co.uk', 'masjid-expansion');
    expect(link).toBe(
      'https://www.alrahmahmasjid.co.uk/donate/masjid-expansion?utm_source=whatsapp&utm_medium=social&utm_campaign=donor_share',
    );
    const url = whatsappShareUrl(
      'https://www.alrahmahmasjid.co.uk',
      'masjid-expansion',
      'Masjid Expansion',
    );
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length));
    expect(text).toContain('Masjid Expansion');
    expect(text).toContain(link);
    expect(text).not.toContain('£');
  });
});
