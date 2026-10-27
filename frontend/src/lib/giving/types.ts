import { z } from 'zod';
import { COUNTRY_CODES, UK } from './countries';

/**
 * Public donation form contract. The browser sends a `DonationRequest` to the backend, which
 * creates the Stripe PaymentIntent (one-off) or Subscription (weekly/monthly) for the campaign's
 * Stripe product and returns a client secret for the on-page Stripe Payment Element.
 */
/** The choices on a `regular` cause's form (e.g. Masjid Expansion). */
export const REGULAR_FREQUENCIES = ['one-off', 'weekly', 'monthly'] as const;
/** `daily`: one payment on each night/day of a daily cause (see `lib/giving/schedule.ts`). */
export const FREQUENCIES = [...REGULAR_FREQUENCIES, 'daily'] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  'one-off': 'One-off',
  weekly: 'Weekly',
  monthly: 'Monthly',
  daily: 'Daily',
};
export const MAX_PEOPLE = 50;

export const PRESET_AMOUNTS = [10, 25, 50, 100] as const;
/** Pre-selected on regular causes without a suggested amount (Masjid Expansion: the ads' "£50 from 4,000 people"). */
export const DEFAULT_AMOUNT = 50;
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 25_000;

/** Full UK postcode, e.g. "LS7 3JB" (any spacing/case). */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
export const normalisePostcode = (value: string) => {
  const compact = value.replace(/\s+/g, '').toUpperCase();
  return compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
};

export const amountSchema = z.object({
  campaignId: z.string().min(1, 'Choose where your donation goes'),
  frequency: z.enum(FREQUENCIES),
  amount: z
    .number({ error: 'Enter an amount' })
    .min(MIN_AMOUNT, `The minimum donation is £${MIN_AMOUNT}`)
    .max(MAX_AMOUNT, `For gifts over £${MAX_AMOUNT.toLocaleString('en-GB')}, please contact us`)
    .refine(
      (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6,
      'Use pounds and pence, e.g. 12.50',
    ),
  /** Per-person causes (Fitrana): how many people the donor is paying for. */
  people: z
    .number()
    .int('Enter a whole number of people')
    .min(1, 'Pay for at least 1 person')
    .max(MAX_PEOPLE, `For more than ${MAX_PEOPLE} people, please contact us`)
    .optional(),
});

export const DONOR_TYPES = ['personal', 'organisation'] as const;
export type DonorType = (typeof DONOR_TYPES)[number];
export const DONOR_TYPE_LABELS: Record<DonorType, string> = {
  personal: 'Personal',
  organisation: 'Corporate / Group',
};

/** Donor fields as collected by the donation form (also the dashboard's donor record). */
export const donorFields = z.object({
  type: z.enum(DONOR_TYPES),
  /** Company, mosque committee, school or group name (Corporate / Group only). */
  organisation: z.string().trim().max(100).optional(),
  firstName: z.string().trim().min(1, 'Enter your first name').max(60),
  lastName: z.string().trim().min(1, 'Enter your last name').max(60),
  address: z.string().trim().min(1, 'Enter your address').max(300),
  /** ISO 3166-1 alpha-2 code, e.g. GB. */
  country: z.string().refine((c) => COUNTRY_CODES.has(c), 'Choose your country'),
  postcode: z.string().trim().min(1, 'Enter your postcode').max(12),
  city: z.string().trim().min(1, 'Enter your town or city').max(60),
  /** County (UK, optional) or state / province (elsewhere). */
  region: z.string().trim().max(60).optional(),
  email: z.email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number'),
});

export const donorSchema = donorFields.superRefine((d, ctx) => {
  if (d.type === 'organisation' && !d.organisation)
    ctx.addIssue({
      code: 'custom',
      path: ['organisation'],
      message: 'Enter the organisation name',
    });
  if (d.country === UK && !UK_POSTCODE.test(d.postcode))
    ctx.addIssue({ code: 'custom', path: ['postcode'], message: 'Enter a full UK postcode' });
});
export type Donor = z.infer<typeof donorSchema>;

/**
 * Where the donor came from, captured when they first arrive on the site (UTM tags, ad click ids,
 * referring site, landing page) and sent with the donation, so the dashboard can report sources
 * and the Meta server events can be matched to the ad click (`fbclid`).
 */
export const sourceSchema = z.object({
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  fbclid: z.string().max(400).optional(),
  /** When the fbclid arrived (ms), for building `fbc` if the _fbc cookie is missing. */
  fbclidAt: z.number().int().positive().optional(),
  gclid: z.string().max(200).optional(),
  gbraid: z.string().max(200).optional(),
  wbraid: z.string().max(200).optional(),
  referrer: z.string().max(300).optional(),
  landingPage: z.string().max(300).optional(),
});
export type DonationSource = z.infer<typeof sourceSchema>;

const detailsShape = {
  donor: donorSchema,
  /** Opt-in to email updates (unticked by default, separate from the donation). */
  marketingConsent: z.boolean(),
  source: sourceSchema.optional(),
};

/** Step 2 (Details) on its own. */
export const detailsSchema = z.object(detailsShape);

export const donationRequestSchema = amountSchema.extend(detailsShape);
export type DonationRequest = z.infer<typeof donationRequestSchema>;
export type AmountStep = z.infer<typeof amountSchema>;

export const formatGbp = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);

const PER: Record<Exclude<Frequency, 'one-off'>, string> = {
  weekly: 'week',
  monthly: 'month',
  daily: 'day',
};

/** "£50", "£50 a week", "£50 a month", "£5 a night" (`unit` names a daily cause's payment). */
export const amountWithFrequency = (
  amount: number,
  frequency: Frequency,
  unit?: 'night' | 'day',
) =>
  frequency === 'one-off'
    ? formatGbp(amount)
    : `${formatGbp(amount)} a ${frequency === 'daily' && unit ? unit : PER[frequency]}`;

/** Field errors keyed by path ("donor.email", "people"). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join('.')] ??= issue.message;
  return out;
}
