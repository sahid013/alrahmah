import type { Donation, DonationQuery } from './types';

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
      if (search) {
        const hay =
          `${d.donor.firstName} ${d.donor.lastName} ${d.donor.email} ${d.paymentRef ?? ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface DonorSummary {
  id: string;
  name: string;
  email: string;
  postcode?: string;
  donations: number;
  total: number;
  firstGift: string;
  lastGift: string;
  recurring: boolean;
  giftAid: boolean;
}

/** One row per donor across the given (succeeded) donations, highest total first. */
export function summariseDonors(list: Donation[]): DonorSummary[] {
  const map = new Map<string, DonorSummary>();
  for (const d of list) {
    if (d.status !== 'succeeded') continue;
    const day = d.createdAt.slice(0, 10);
    const s = map.get(d.donor.id) ?? {
      id: d.donor.id,
      name: `${d.donor.firstName} ${d.donor.lastName}`,
      email: d.donor.email,
      postcode: d.donor.postcode,
      donations: 0,
      total: 0,
      firstGift: day,
      lastGift: day,
      recurring: false,
      giftAid: false,
    };
    s.donations += 1;
    s.total += d.amount;
    if (day < s.firstGift) s.firstGift = day;
    if (day > s.lastGift) s.lastGift = day;
    s.recurring ||= d.type === 'recurring';
    s.giftAid ||= d.giftAid;
    map.set(d.donor.id, s);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface DonationTotals {
  total: number;
  count: number;
  recurring: number;
  giftAidEligible: number;
  /** 25% Gift Aid on eligible donations. */
  giftAidValue: number;
}

export function donationTotals(list: Donation[]): DonationTotals {
  const ok = list.filter((d) => d.status === 'succeeded');
  const eligible = ok.filter((d) => d.giftAid).reduce((n, d) => n + d.amount, 0);
  return {
    total: ok.reduce((n, d) => n + d.amount, 0),
    count: ok.length,
    recurring: ok.filter((d) => d.type === 'recurring').length,
    giftAidEligible: eligible,
    giftAidValue: eligible * 0.25,
  };
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
