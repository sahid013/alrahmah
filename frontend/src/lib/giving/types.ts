import { z } from 'zod';

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
export const TITLES = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'] as const;

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

export const donorSchema = z.object({
  title: z.enum(TITLES).optional(),
  firstName: z.string().trim().min(1, 'Enter your first name').max(60),
  lastName: z.string().trim().min(1, 'Enter your last name').max(60),
  email: z.email('Enter a valid email address'),
  phone: z.string().trim().max(30).optional(),
});

export const giftAidSchema = z
  .object({
    declared: z.boolean(),
    houseNameOrNumber: z.string().trim().max(60).optional(),
    postcode: z.string().trim().optional(),
  })
  .superRefine((g, ctx) => {
    if (!g.declared) return;
    if (!g.houseNameOrNumber)
      ctx.addIssue({
        code: 'custom',
        path: ['houseNameOrNumber'],
        message: 'Enter your house name or number',
      });
    if (!g.postcode || !UK_POSTCODE.test(g.postcode))
      ctx.addIssue({ code: 'custom', path: ['postcode'], message: 'Enter a full UK postcode' });
  });

export const donationRequestSchema = amountSchema.extend({
  donor: donorSchema,
  giftAid: giftAidSchema,
});
export type DonationRequest = z.infer<typeof donationRequestSchema>;
export type AmountStep = z.infer<typeof amountSchema>;

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
