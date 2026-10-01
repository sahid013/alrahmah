import { countryName, UK } from '@/lib/giving/countries';
import { DONOR_TYPE_LABELS, houseFromAddress } from '@/lib/giving/types';
import { sourceOf, type DonorSummary, type RegularGift } from './queries';
import { SUBSCRIPTION_STATUS_LABELS, type Campaign, type Donation } from './types';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | undefined;
}

/** RFC 4180 CSV with formula-injection protection for spreadsheet apps. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const cell = (v: unknown) => {
    let s = v === undefined || v === null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => cell(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(','));
  return lines.join('\r\n');
}

/** Trigger a browser download (client only). */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const money = (n: number) => n.toFixed(2);
const yesNo = (v: boolean) => (v ? 'Yes' : 'No');
/** DD/MM/YYYY, as HMRC and UK spreadsheets expect. */
const ukDate = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

export const donationColumns = (campaigns: Campaign[]): CsvColumn<Donation>[] => {
  const title = new Map(campaigns.map((c) => [c.id, c.title]));
  return [
    { header: 'Date', value: (d) => d.createdAt.slice(0, 10) },
    { header: 'Time', value: (d) => d.createdAt.slice(11, 16) },
    { header: 'Donor type', value: (d) => DONOR_TYPE_LABELS[d.donor.type] },
    { header: 'Organisation', value: (d) => d.donor.organisation },
    { header: 'First name', value: (d) => d.donor.firstName },
    { header: 'Last name', value: (d) => d.donor.lastName },
    { header: 'Email', value: (d) => d.donor.email },
    { header: 'Phone', value: (d) => d.donor.phone },
    { header: 'Address', value: (d) => d.donor.address },
    { header: 'Town / City', value: (d) => d.donor.city },
    { header: 'County / State', value: (d) => d.donor.region },
    { header: 'Postcode', value: (d) => d.donor.postcode },
    { header: 'Country', value: (d) => countryName(d.donor.country) },
    { header: 'Campaign', value: (d) => title.get(d.campaignId) ?? d.campaignId },
    {
      header: 'Type',
      value: (d) => (d.type === 'recurring' ? `Recurring (${d.frequency})` : 'One-off'),
    },
    {
      header: 'Regular gift status',
      value: (d) => d.subscription && SUBSCRIPTION_STATUS_LABELS[d.subscription.status],
    },
    { header: 'Amount (GBP)', value: (d) => money(d.amount) },
    { header: 'Gift Aid', value: (d) => yesNo(d.giftAid) },
    { header: 'Gift Aid declared', value: (d) => d.giftAidDeclaredAt?.slice(0, 10) },
    { header: 'Marketing consent', value: (d) => yesNo(d.marketingConsent) },
    { header: 'Source', value: (d) => sourceOf(d) },
    { header: 'Medium', value: (d) => d.source?.utmMedium },
    { header: 'UTM campaign', value: (d) => d.source?.utmCampaign },
    { header: 'Status', value: (d) => d.status },
    { header: 'Payment reference', value: (d) => d.paymentRef },
  ];
};

export const donorColumns: CsvColumn<DonorSummary>[] = [
  { header: 'Name', value: (d) => d.name },
  { header: 'Donor type', value: (d) => DONOR_TYPE_LABELS[d.type] },
  { header: 'Organisation', value: (d) => d.organisation },
  { header: 'Email', value: (d) => d.email },
  { header: 'Phone', value: (d) => d.phone },
  { header: 'Address', value: (d) => d.address },
  { header: 'Town / City', value: (d) => d.city },
  { header: 'County / State', value: (d) => d.region },
  { header: 'Postcode', value: (d) => d.postcode },
  { header: 'Country', value: (d) => countryName(d.country) },
  { header: 'Donations', value: (d) => d.donations },
  { header: 'Total (GBP)', value: (d) => money(d.total) },
  { header: 'First gift', value: (d) => d.firstGift },
  { header: 'Last gift', value: (d) => d.lastGift },
  {
    header: 'Regular giving',
    value: (d) => (d.recurringStatus ? SUBSCRIPTION_STATUS_LABELS[d.recurringStatus] : 'No'),
  },
  { header: 'Gift Aid declared', value: (d) => yesNo(d.giftAid) },
  { header: 'Marketing consent', value: (d) => yesNo(d.marketingConsent) },
  { header: 'First source', value: (d) => d.firstSource },
];

/** Donors who opted in to email updates (latest consent), for the mailing list. */
export const contactColumns: CsvColumn<DonorSummary>[] = [
  { header: 'First name', value: (d) => d.name.split(' ')[0] },
  { header: 'Last name', value: (d) => d.name.split(' ').slice(1).join(' ') },
  { header: 'Email', value: (d) => d.email },
  { header: 'Organisation', value: (d) => d.organisation },
  { header: 'Town / City', value: (d) => d.city },
  { header: 'Consent given (last donation)', value: (d) => d.lastGift },
];

export const regularGiftColumns = (campaigns: Campaign[]): CsvColumn<RegularGift>[] => {
  const title = new Map(campaigns.map((c) => [c.id, c.title]));
  return [
    { header: 'Donor', value: (g) => g.donorName },
    { header: 'Organisation', value: (g) => g.organisation },
    { header: 'Email', value: (g) => g.email },
    { header: 'Campaign', value: (g) => title.get(g.campaignId) ?? g.campaignId },
    { header: 'Amount (GBP)', value: (g) => money(g.amount) },
    { header: 'Frequency', value: (g) => g.frequency },
    { header: 'Status', value: (g) => SUBSCRIPTION_STATUS_LABELS[g.status] },
    { header: 'Started', value: (g) => g.startedAt },
    { header: 'Last payment', value: (g) => g.lastPaymentAt },
    { header: 'Payments', value: (g) => g.payments },
    { header: 'Total (GBP)', value: (g) => money(g.total) },
    { header: 'Gift Aid', value: (g) => yesNo(g.giftAid) },
  ];
};

/** Donations HMRC will accept: succeeded, Gift Aid declared, given by an individual. */
export const isGiftAidClaimable = (d: Donation) =>
  d.status === 'succeeded' && d.giftAid && d.donor.type === 'personal';

/** Columns of HMRC's Gift Aid schedule (one row per claimable donation). */
export const giftAidColumns: CsvColumn<Donation>[] = [
  { header: 'Title', value: () => '' },
  { header: 'First name or initial', value: (d) => d.donor.firstName },
  { header: 'Last name', value: (d) => d.donor.lastName },
  { header: 'House name or number', value: (d) => houseFromAddress(d.donor.address) },
  // HMRC: overseas donors use "X" as the postcode.
  { header: 'Postcode', value: (d) => (d.donor.country === UK ? d.donor.postcode : 'X') },
  { header: 'Aggregated donations', value: () => '' },
  { header: 'Sponsored event', value: () => 'No' },
  { header: 'Donation date', value: (d) => ukDate(d.createdAt) },
  { header: 'Amount', value: (d) => money(d.amount) },
];
