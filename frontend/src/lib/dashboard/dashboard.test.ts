import { describe, expect, it } from 'vitest';
import { checkoutHref, moveId, prepareCampaign, raisedByCampaign, slugify } from './campaigns';
import { emailToolColumns, mailingColumns, toCsv } from './csv';
import { contactsFromDonations, filterContacts } from './mailing-list';
import { mailingContactSchema } from '@/lib/mailing-list/types';
import { timetableDay, copyDayTo, isFriday, sameTimes, validateDay } from './prayer';
import {
  donationTotals,
  filterDonations,
  monthlyValue,
  summariseDonors,
  summariseRegularGifts,
  taxYear,
} from './queries';
import { sampleCampaigns, sampleDonations } from './sample-data';
import { campaignSchema, donationSchema, prayerDaySchema } from './types';

const today = new Date('2026-10-01T12:00:00Z');
const donations = sampleDonations(today);

describe('dashboard sample data', () => {
  it('matches the contracts', () => {
    expect(() => donationSchema.array().parse(donations)).not.toThrow();
    expect(() => campaignSchema.array().parse(sampleCampaigns())).not.toThrow();
  });
  it('is deterministic', () => {
    expect(sampleDonations(today)).toEqual(donations);
  });
});

describe('donation queries', () => {
  it('filters by date, type and search', () => {
    const r = filterDonations(donations, {
      from: '2026-09-01',
      to: '2026-09-30',
      type: 'recurring',
    });
    expect(r.length).toBeGreaterThan(0);
    for (const d of r) {
      expect(
        d.createdAt.slice(0, 10) >= '2026-09-01' && d.createdAt.slice(0, 10) <= '2026-09-30',
      ).toBe(true);
      expect(d.type).toBe('recurring');
    }
    const one = donations[0]!;
    expect(
      filterDonations(donations, { search: one.donor.email.toUpperCase() }).every(
        (d) => d.donor.email === one.donor.email,
      ),
    ).toBe(true);
  });
  it('summarises donors and totals from succeeded donations only', () => {
    const ok = donations.filter((d) => d.status === 'succeeded');
    const total = ok.reduce((n, d) => n + d.amount, 0);
    expect(donationTotals(donations).total).toBe(total);
    expect(summariseDonors(donations).reduce((n, d) => n + d.total, 0)).toBe(total);
  });
});

describe('csv', () => {
  it('escapes quotes, commas and spreadsheet formulas', () => {
    const csv = toCsv(
      [{ a: 'x, "y"', b: '=SUM(A1)' }],
      [
        { header: 'A', value: (r) => r.a },
        { header: 'B', value: (r) => r.b },
      ],
    );
    expect(csv).toBe('A,B\r\n"x, ""y""",\'=SUM(A1)');
  });
});

describe('prayer helpers', () => {
  it('builds a valid calculated day and copies it', () => {
    const day = timetableDay('2026-10-02');
    expect(prayerDaySchema.safeParse(day).success).toBe(true);
    const copy = copyDayTo(day, '2026-10-03');
    expect(copy.date).toBe('2026-10-03');
    expect(sameTimes(day, copy)).toBe(true);
    expect(isFriday('2026-10-02')).toBe(true);
  });

  it("validates order and jama'ah times", () => {
    const day = timetableDay('2026-09-30');
    expect(validateDay(day)).toEqual({});
    day.times.asr = { adhan: day.times.dhuhr.adhan, jamaah: '00:01' };
    const errors = validateDay(day);
    expect(errors['asr.adhan']).toMatch(/after Dhuhr/);
    expect(errors['asr.jamaah']).toBeDefined();
  });
});

describe('campaign helpers', () => {
  it('slugifies titles', () => {
    expect(slugify('  Daily Iftar 2027! ')).toBe('daily-iftar-2027');
    expect(slugify('Café & Qur’an')).toBe('cafe-qur-an');
  });

  it('moves an id to a new position', () => {
    expect(moveId(['a', 'b', 'c', 'd'], 'a', 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveId(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
    expect(moveId(['a', 'b', 'c'], 'b', 99)).toEqual(['a', 'c', 'b']);
    expect(moveId(['a', 'b'], 'x', 0)).toEqual(['a', 'b']);
  });

  it('totals succeeded donations per campaign', () => {
    const map = raisedByCampaign([
      { campaignId: 'a', amount: 10, status: 'succeeded' },
      { campaignId: 'a', amount: 5, status: 'refunded' },
      { campaignId: 'b', amount: 2, status: 'succeeded' },
    ]);
    expect(map.get('a')).toBe(10);
    expect(map.get('b')).toBe(2);
  });
});

describe('taxYear', () => {
  it('starts on 6 April', () => {
    expect(taxYear('2026-10-01')).toEqual({
      from: '2026-04-06',
      to: '2027-04-05',
      label: '2026/27',
    });
    expect(taxYear('2026-04-05').from).toBe('2025-04-06');
    expect(taxYear('2026-04-06', 1).label).toBe('2025/26');
  });
});

describe('prepareCampaign', () => {
  it('points the donate button at the campaign checkout', () => {
    const c = sampleCampaigns()[0]!;
    expect(prepareCampaign(c).cta.href).toBe(checkoutHref(c.id));
    expect(checkoutHref('daily-iftar')).toBe('/donate/daily-iftar');
    expect(campaignSchema.safeParse(prepareCampaign(c)).success).toBe(true);
  });
});

describe('donor data (frontend contract)', () => {
  it('filters by donor type, consent and source', () => {
    const orgs = filterDonations(donations, { donorType: 'organisation' });
    expect(orgs.length).toBeGreaterThan(0);
    expect(orgs.every((d) => d.donor.type === 'organisation')).toBe(true);
    const opted = filterDonations(donations, { marketingConsent: true });
    expect(opted.every((d) => d.marketingConsent)).toBe(true);
    const direct = filterDonations(donations, { source: 'direct' });
    expect(direct.every((d) => !d.source)).toBe(true);
  });

  it('summarises regular gifts with a status and payment history', () => {
    const gifts = summariseRegularGifts(donations);
    expect(gifts.length).toBeGreaterThan(0);
    for (const g of gifts) {
      expect(g.payments).toBeGreaterThan(0);
      expect(g.startedAt <= g.lastPaymentAt).toBe(true);
    }
    expect(new Set(gifts.map((g) => g.status)).size).toBeGreaterThan(1);
    expect(monthlyValue({ amount: 12, frequency: 'weekly' })).toBe(52);
  });

  it('totals recurring income in pounds', () => {
    const totals = donationTotals(donations);
    const recurringSum = donations
      .filter((d) => d.status === 'succeeded' && d.type === 'recurring')
      .reduce((n, d) => n + d.amount, 0);
    expect(totals.recurring).toBe(recurringSum);
  });
});

describe('exports', () => {
  it('produce one complete row per record for every export', async () => {
    const csv = await import('./csv');
    const campaigns = sampleCampaigns();
    const donors = summariseDonors(donations);
    const sets: [string, unknown[], { header: string }[]][] = [
      ['donations', donations, csv.donationColumns(campaigns)],
      ['donors', donors, csv.donorColumns],
      ['contacts', donors.filter((d) => d.marketingConsent), csv.contactColumns],
      ['regular', summariseRegularGifts(donations), csv.regularGiftColumns(campaigns)],
      ['gift aid', csv.giftAidRows(donations), csv.giftAidColumns],
    ];
    for (const [, rows, columns] of sets) {
      const out = csv.toCsv(rows as never[], columns as never);
      expect(out.split('\r\n')).toHaveLength(rows.length + 1);
      expect(out).not.toMatch(/undefined|NaN|\[object/);
    }
  });
});

describe("default Jumu'ah", () => {
  it("gives every 2026 Friday the fixed 12:45 Jumu'ah, also as its Dhuhr jama'ah", () => {
    const friday = timetableDay('2026-11-06');
    expect(isFriday('2026-11-06')).toBe(true);
    expect(friday.jumuah).toEqual(['12:45']);
    expect(friday.times.dhuhr.jamaah).toBe('12:45');
    expect(timetableDay('2026-11-07').jumuah).toBeUndefined();
    expect(validateDay(friday)).toEqual({});
  });

  it("falls back to the Dhuhr time in a year without a fixed Jumu'ah", () => {
    const friday = timetableDay('2027-01-01');
    expect(isFriday('2027-01-01')).toBe(true);
    expect(friday.jumuah).toEqual([friday.times.dhuhr.adhan]);
  });
});

describe('mailing list', () => {
  const contacts = contactsFromDonations(donations);

  it('has one contact per donor who opted in, from their latest opt-in', () => {
    const optedIn = new Set(
      donations.filter((d) => d.marketingConsent).map((d) => d.donor.email.toLowerCase()),
    );
    expect(contacts.map((c) => c.email).sort()).toEqual([...optedIn].sort());
    expect(() => mailingContactSchema.array().parse(contacts)).not.toThrow();
    for (const c of contacts) {
      const latest = donations
        .filter((d) => d.marketingConsent && d.donor.email.toLowerCase() === c.email)
        .reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
      expect(c.consentedAt).toBe(latest.createdAt);
    }
  });

  it('filters by status and search', () => {
    const [first, second] = contacts;
    const list = [first!, { ...second!, subscribed: false }];
    expect(filterContacts(list, 'subscribed')).toEqual([first]);
    expect(filterContacts(list, 'unsubscribed')).toHaveLength(1);
    expect(filterContacts(list, 'all', first!.email.toUpperCase())).toEqual([first]);
  });

  it('exports email-tool columns and the record of consent', () => {
    const [c] = contacts;
    expect(toCsv([c!], emailToolColumns).split('\r\n')[0]).toBe(
      'Email Address,First Name,Last Name',
    );
    const full = toCsv([c!], mailingColumns(sampleCampaigns()));
    expect(full).toContain('Consent wording');
    expect(full).toContain('Keep me updated.');
  });
});

describe('Gift Aid (HMRC schedule)', () => {
  it('lists only succeeded, declared donations by individuals, oldest first', async () => {
    const csv = await import('./csv');
    const rows = csv.giftAidRows(donations);
    expect(rows.length).toBeGreaterThan(0);
    for (const d of rows) {
      expect(d.giftAid).toBe(true);
      expect(d.status).toBe('succeeded');
      expect(d.donor.type).toBe('personal');
    }
    expect(rows.map((d) => d.createdAt)).toEqual([...rows.map((d) => d.createdAt)].sort());
  });

  it("uses HMRC's columns, DD/MM/YY dates and X for overseas postcodes", async () => {
    const csv = await import('./csv');
    const base = donations.find((d) => d.giftAid && d.status === 'succeeded')!;
    const uk = { ...base, createdAt: '2026-11-06T12:00:00.000Z', amount: 50 };
    const abroad = { ...uk, donor: { ...uk.donor, country: 'PK', address: '12A Mall Road' } };
    const lines = csv.toCsv([uk, abroad], csv.giftAidColumns).split('\r\n');
    expect(lines[0]).toBe(
      'Title,First name or initial,Last name,House name or number,Postcode,Aggregated donations,Sponsored event,Donation date,Amount',
    );
    expect(lines[1]).toContain(',06/11/26,50.00');
    expect(lines[2]).toMatch(/,12A,X,,,06\/11\/26,50\.00$/);
  });

  it('works out the Gift Aid to claim at 25%', () => {
    const totals = donationTotals(donations);
    const eligible = donations
      .filter((d) => d.status === 'succeeded' && d.giftAid && d.donor.type === 'personal')
      .reduce((n, d) => n + d.amount, 0);
    expect(totals.giftAidEligible).toBeCloseTo(eligible, 2);
    expect(totals.giftAidValue).toBeCloseTo(eligible * 0.25, 2);
  });
});
