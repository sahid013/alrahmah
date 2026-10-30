import type { DailyPlan } from './schedule';
import type { Frequency } from './types';

/**
 * What the thank-you page confirms for a finished donation, whether the donor stayed on the form
 * (step 4) or came back from a redirect method (`/donate/complete`).
 */
export interface DonationConfirmation {
  firstName?: string;
  email?: string;
  /** Per payment (daily causes: each night/day). */
  amount: number;
  frequency: Frequency;
  /** Per-person causes (Fitrana). */
  people?: number;
  reference: string;
  /** Daily causes: the payments that were scheduled. */
  plan?: DailyPlan;
  /** Weekly / monthly: when the next payment is taken. */
  nextPayment?: Date;
  /** The donor added Gift Aid. */
  giftAid?: boolean;
}

/** UK calendar date parts of an instant. */
function londonDate(at: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * The next weekly / monthly payment after one taken at `from` (Stripe bills on the same weekday,
 * or the same day of the month, the last day when the month is shorter: 31 Jan → 28 Feb).
 * Returned as noon UTC on that date, so formatting it in UK time never shifts the day.
 */
export function nextPaymentDate(frequency: Frequency, from: Date): Date | undefined {
  if (frequency !== 'weekly' && frequency !== 'monthly') return undefined;
  const { year, month, day } = londonDate(from);
  if (frequency === 'weekly') return new Date(Date.UTC(year, month - 1, day + 7, 12));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay), 12));
}

/** "Saturday 27 November 2026". */
export const formatLongDate = (at: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  })
    .format(at)
    .replace(',', '');

/**
 * The cause's donation page, tagged so visits from donors' WhatsApp shares show up as such in
 * the dashboard's sources and in analytics.
 */
export const shareLink = (siteUrl: string, campaignId: string) =>
  `${siteUrl}/donate/${campaignId}?utm_source=whatsapp&utm_medium=social&utm_campaign=donor_share`;

/** WhatsApp's share link with a pre-written message (the amount is never included). */
export function whatsappShareUrl(siteUrl: string, campaignId: string, causeTitle: string) {
  const text = `I've just donated to ${causeTitle} at Al-Rahmah Masjid in Leeds. Will you join me? ${shareLink(siteUrl, campaignId)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
