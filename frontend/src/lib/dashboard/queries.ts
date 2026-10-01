import type { Donation, DonationQuery, SubscriptionStatus } from './types';

/** Source label for a donation: its UTM source, or 'direct'. */
export const sourceOf = (d: Donation) => d.source?.utmSource ?? 'direct';

export const donorName = (d: Donation['donor']) => `${d.firstName} ${d.lastName}`;

/** Pure filter used by the local API now and mirrored by the backend query later. */
export function filterDonations(list: Donation[], q: DonationQuery = {}): Donation[] {
  const search = q.search?.trim().toLowerCase();
  return list
    .filter((d) => {
      const day = d.createdAt.slice(0, 10);
      if (q.from && day < q.from) return false;
      if (q.to && day > q.to) return false;
      if (q.campaignId && d.campaignId !== q.campaignId) return false;
      if (q.type && d.type !== q.type) return false;
      if (q.giftAid !== undefined && d.giftAid !== q.giftAid) return false;
      if (q.status && d.status !== q.status) return false;
      if (q.donorType && d.donor.type !== q.donorType) return false;
      if (q.marketingConsent !== undefined && d.marketingConsent !== q.marketingConsent)
        return false;
      if (q.source && sourceOf(d) !== q.source) return false;
      if (search) {
        const { donor } = d;
        const hay = [
          donorName(donor),
          donor.organisation,
          donor.email,
          donor.phone,
          donor.postcode,
          d.paymentRef,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface DonorSummary {
  id: string;
  name: string;
  type: Donation['donor']['type'];
  organisation?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region?: string;
  postcode: string;
  country: string;
  donations: number;
  total: number;
  firstGift: string;
  lastGift: string;
  /** Has given a recurring gift in the period. */
  recurring: boolean;
  /** Status of their most recent regular gift, if any. */
  recurringStatus?: SubscriptionStatus;
  giftAid: boolean;
  /** Consent given with their most recent donation. */
  marketingConsent: boolean;
  /** Source of their first donation in the period. */
  firstSource: string;
}

/** One row per donor across the given (succeeded) donations, highest total first. */
export function summariseDonors(list: Donation[]): DonorSummary[] {
  const map = new Map<string, DonorSummary>();
  // Oldest first, so "first" and "latest" fields fall out naturally.
  const ordered = list
    .filter((d) => d.status === 'succeeded')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const d of ordered) {
    const day = d.createdAt.slice(0, 10);
    const { donor } = d;
    const s = map.get(donor.id) ?? {
      id: donor.id,
      name: donorName(donor),
      type: donor.type,
      organisation: donor.organisation,
      email: donor.email,
      phone: donor.phone,
      address: donor.address,
      city: donor.city,
      region: donor.region,
      postcode: donor.postcode,
      country: donor.country,
      donations: 0,
      total: 0,
      firstGift: day,
      lastGift: day,
      recurring: false,
      giftAid: false,
      marketingConsent: false,
      firstSource: sourceOf(d),
    };
    s.donations += 1;
    s.total += d.amount;
    s.lastGift = day;
    s.giftAid ||= d.giftAid;
    s.marketingConsent = d.marketingConsent;
    if (d.type === 'recurring') {
      s.recurring = true;
      s.recurringStatus = d.subscription?.status ?? s.recurringStatus;
    }
    map.set(donor.id, s);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface RegularGift {
  id: string;
  donorName: string;
  organisation?: string;
  email: string;
  campaignId: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  status: SubscriptionStatus;
  startedAt: string;
  lastPaymentAt: string;
  payments: number;
  total: number;
  giftAid: boolean;
}

/** One row per regular gift (Stripe subscription), newest payment first. */
export function summariseRegularGifts(list: Donation[]): RegularGift[] {
  const map = new Map<string, RegularGift>();
  const ordered = list
    .filter((d) => d.subscription && d.status === 'succeeded')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const d of ordered) {
    const sub = d.subscription!;
    const day = d.createdAt.slice(0, 10);
    const g = map.get(sub.id) ?? {
      id: sub.id,
      donorName: donorName(d.donor),
      organisation: d.donor.organisation,
      email: d.donor.email,
      campaignId: d.campaignId,
      amount: d.amount,
      frequency: d.frequency ?? 'monthly',
      status: sub.status,
      startedAt: day,
      lastPaymentAt: day,
      payments: 0,
      total: 0,
      giftAid: d.giftAid,
    };
    g.payments += 1;
    g.total += d.amount;
    g.amount = d.amount;
    g.lastPaymentAt = day;
    g.status = sub.status;
    map.set(sub.id, g);
  }
  return [...map.values()].sort((a, b) => b.lastPaymentAt.localeCompare(a.lastPaymentAt));
}

/** A regular gift's value per month (weekly gifts × 52 / 12). */
export const monthlyValue = (g: Pick<RegularGift, 'amount' | 'frequency'>) =>
  g.frequency === 'weekly' ? (g.amount * 52) / 12 : g.amount;

export interface DonationTotals {
  total: number;
  count: number;
  /** Value of recurring payments (£). */
  recurring: number;
  giftAidEligible: number;
  /** 25% Gift Aid on eligible donations. */
  giftAidValue: number;
}

export function donationTotals(list: Donation[]): DonationTotals {
  const ok = list.filter((d) => d.status === 'succeeded');
  const sum = (xs: Donation[]) => xs.reduce((n, d) => n + d.amount, 0);
  const eligible = sum(ok.filter((d) => d.giftAid));
  return {
    total: sum(ok),
    count: ok.length,
    recurring: sum(ok.filter((d) => d.type === 'recurring')),
    giftAidEligible: eligible,
    giftAidValue: eligible * 0.25,
  };
}

/** Succeeded totals grouped by a key (campaign, source…), largest first. */
export function totalsBy(
  list: Donation[],
  key: (d: Donation) => string,
): { key: string; total: number; count: number }[] {
  const map = new Map<string, { key: string; total: number; count: number }>();
  for (const d of list) {
    if (d.status !== 'succeeded') continue;
    const k = key(d);
    const row = map.get(k) ?? { key: k, total: 0, count: 0 };
    row.total += d.amount;
    row.count += 1;
    map.set(k, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** UK tax year (6 April – 5 April) containing `date`, offset by `back` years. */
export function taxYear(date: string, back = 0): { from: string; to: string; label: string } {
  const year = Number(date.slice(0, 4));
  const start = (date.slice(5) >= '04-06' ? year : year - 1) - back;
  return {
    from: `${start}-04-06`,
    to: `${start + 1}-04-05`,
    label: `${start}/${String(start + 1).slice(2)}`,
  };
}
