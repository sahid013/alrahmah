import { z } from 'zod';
import { donationProgramSchema } from '@/lib/donations/types';

/**
 * Dashboard data contracts — shared by the UI and (later) the Supabase / backend API.
 * Every record crossing the `DashboardApi` boundary is validated against these schemas.
 */

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
export const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

/* ---------- Prayer times ---------- */

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYERS)[number];
export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};
/** Sunrise has no congregation. */
export const hasJamaah = (key: PrayerKey) => key !== 'sunrise';

const prayerTimeSchema = z.object({ adhan: clockTime, jamaah: clockTime.optional() });

/**
 * A day's published timetable. Only days the team edits are stored ("overrides"); every other
 * day falls back to the calculated times. `jumuah` holds Friday khutbah/jama'ah start times.
 */
export const prayerDaySchema = z.object({
  date: isoDate,
  times: z.object({
    fajr: prayerTimeSchema,
    sunrise: z.object({ adhan: clockTime }),
    dhuhr: prayerTimeSchema,
    asr: prayerTimeSchema,
    maghrib: prayerTimeSchema,
    isha: prayerTimeSchema,
  }),
  jumuah: z.array(clockTime).optional(),
  note: z.string().max(200).optional(),
  updatedAt: z.string().optional(),
});
export type PrayerDay = z.infer<typeof prayerDaySchema>;

/* ---------- Campaigns ---------- */

export const CAMPAIGN_STATUSES = ['active', 'draft', 'archived'] as const;
export const campaignSchema = donationProgramSchema.extend({
  status: z.enum(CAMPAIGN_STATUSES),
  /** Display order on the public donations page (ascending). */
  order: z.number().int(),
  /**
   * Stripe link, written by the backend only: when a campaign is created it creates a Stripe
   * Product (metadata.campaign_id = id) and keeps its name/image/status in sync on every save.
   */
  stripe: z.object({ productId: z.string(), syncedAt: z.string().optional() }).optional(),
  updatedAt: z.string().optional(),
});
export type Campaign = z.infer<typeof campaignSchema>;

/* ---------- Donations ---------- */

export const donationSchema = z.object({
  id: z.string(),
  /** ISO timestamp. */
  createdAt: z.string(),
  /** In pounds. */
  amount: z.number().positive(),
  currency: z.literal('GBP'),
  type: z.enum(['one-off', 'recurring']),
  frequency: z.enum(['weekly', 'monthly']).optional(),
  campaignId: z.string(),
  status: z.enum(['succeeded', 'refunded']),
  giftAid: z.boolean(),
  donor: z.object({
    id: z.string(),
    title: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.email(),
    phone: z.string().optional(),
    houseNameOrNumber: z.string().optional(),
    postcode: z.string().optional(),
  }),
  /** Stripe PaymentIntent / Invoice id once payments are live. */
  paymentRef: z.string().optional(),
});
export type Donation = z.infer<typeof donationSchema>;
export type DonationType = Donation['type'];

export interface DonationQuery {
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
  campaignId?: string;
  type?: DonationType;
  giftAid?: boolean;
  status?: Donation['status'];
  /** Matches donor name, email or payment reference. */
  search?: string;
}
