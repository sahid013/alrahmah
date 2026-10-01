import type { DonorSummary } from './queries';
import type { Campaign, Donation } from './types';

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

export const donationColumns = (campaigns: Campaign[]): CsvColumn<Donation>[] => {
  const title = new Map(campaigns.map((c) => [c.id, c.title]));
  return [
    { header: 'Date', value: (d) => d.createdAt.slice(0, 10) },
    { header: 'Time', value: (d) => d.createdAt.slice(11, 16) },
    { header: 'First name', value: (d) => d.donor.firstName },
    { header: 'Last name', value: (d) => d.donor.lastName },
    { header: 'Email', value: (d) => d.donor.email },
    { header: 'Postcode', value: (d) => d.donor.postcode },
    { header: 'Campaign', value: (d) => title.get(d.campaignId) ?? d.campaignId },
    {
      header: 'Type',
      value: (d) => (d.type === 'recurring' ? `Recurring (${d.frequency})` : 'One-off'),
    },
    { header: 'Amount (GBP)', value: (d) => money(d.amount) },
    { header: 'Gift Aid', value: (d) => (d.giftAid ? 'Yes' : 'No') },
    { header: 'Status', value: (d) => d.status },
    { header: 'Payment reference', value: (d) => d.paymentRef },
  ];
};

export const donorColumns: CsvColumn<DonorSummary>[] = [
  { header: 'Name', value: (d) => d.name },
  { header: 'Email', value: (d) => d.email },
  { header: 'Postcode', value: (d) => d.postcode },
  { header: 'Donations', value: (d) => d.donations },
  { header: 'Total (GBP)', value: (d) => money(d.total) },
  { header: 'First gift', value: (d) => d.firstGift },
  { header: 'Last gift', value: (d) => d.lastGift },
  { header: 'Recurring', value: (d) => (d.recurring ? 'Yes' : 'No') },
  { header: 'Gift Aid declared', value: (d) => (d.giftAid ? 'Yes' : 'No') },
];

/** Columns of HMRC's Gift Aid schedule (one row per eligible donation). */
export const giftAidColumns: CsvColumn<Donation>[] = [
  { header: 'Title', value: (d) => d.donor.title },
  { header: 'First name or initial', value: (d) => d.donor.firstName },
  { header: 'Last name', value: (d) => d.donor.lastName },
  { header: 'House name or number', value: (d) => d.donor.houseNameOrNumber },
  { header: 'Postcode', value: (d) => d.donor.postcode },
  { header: 'Aggregated donations', value: () => '' },
  { header: 'Sponsored event', value: () => 'No' },
  {
    header: 'Donation date',
    value: (d) => d.createdAt.slice(0, 10).split('-').reverse().join('/'),
  },
  { header: 'Amount', value: (d) => money(d.amount) },
];
