import { z } from 'zod';
import { COUNTRY_CODES, UK } from './countries';

/**
 * Public donation form contract. The browser sends a `DonationRequest` to the backend, which
 * creates the Stripe PaymentIntent (one-off) or Subscription (weekly/monthly) for the campaign's
 * Stripe product and returns a client secret for the on-page Stripe Payment Element.
 */
export const FREQUENCIES = ['one-off', 'weekly', 'monthly'] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  'one-off': 'One-off',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export const PRESET_AMOUNTS = [10, 25, 50, 100] as const;
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

/** Gift Aid uses the donor's address (HMRC needs house name/number and postcode). */
export const giftAidSchema = z.object({ declared: z.boolean() });

const detailsShape = {
  donor: donorSchema,
  giftAid: giftAidSchema,
  /** Opt-in to email updates (unticked by default, separate from the donation). */
  marketingConsent: z.boolean(),
};

/** Gift Aid is for individual UK taxpayers only, not companies or groups. */
const checkGiftAid = (
  r: { donor: { type: DonorType }; giftAid: { declared: boolean } },
  ctx: z.RefinementCtx,
) => {
  if (r.giftAid.declared && r.donor.type !== 'personal')
    ctx.addIssue({
      code: 'custom',
      path: ['giftAid', 'declared'],
      message: 'Gift Aid can only be added to personal donations',
    });
};

/** Step 2 (Details) on its own. */
export const detailsSchema = z.object(detailsShape).superRefine(checkGiftAid);

export const donationRequestSchema = amountSchema.extend(detailsShape).superRefine(checkGiftAid);
export type DonationRequest = z.infer<typeof donationRequestSchema>;
export type AmountStep = z.infer<typeof amountSchema>;

/** "House name or number" for the HMRC Gift Aid schedule: the first part of the address. */
export function houseFromAddress(address: string): string {
  const first = address.split(/[\n,]/)[0]!.trim();
  // "6 Sheepscar Way" → "6", "12A High St" → "12A"; otherwise it's a house name ("Rose Cottage").
  return first.match(/^\d+[a-z]?\b/i)?.[0] ?? first.slice(0, 40);
}

/** Gift Aid adds 25p for every £1 (basic-rate tax reclaimed from HMRC). */
export const giftAidBonus = (amount: number) => Math.round(amount * 25) / 100;

export const formatGbp = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);

/** "£50", "£50 a week", "£50 a month". */
export const amountWithFrequency = (amount: number, frequency: Frequency) =>
  frequency === 'one-off'
    ? formatGbp(amount)
    : `${formatGbp(amount)} a ${frequency === 'weekly' ? 'week' : 'month'}`;

/** Field errors keyed by path ("donor.email", "giftAid.postcode"). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join('.')] ??= issue.message;
  return out;
}
