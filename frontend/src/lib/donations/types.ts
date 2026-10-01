import { z } from 'zod';

/**
 * Donation programme contract — the shape the future dashboard / API must return
 * (`GET /api/v1/donations` → `{ overview?, programs: DonationProgram[] }`). Validated at the data
 * boundary (`repository.ts`), so bad data fails loudly instead of breaking the page.
 */

/**
 * Progress tracker. `current` and `target` are always stored; `display` chooses how it reads:
 *  - `amount`  → "£2,400 raised of £5,000"
 *  - `percent` → "48% funded"
 *  - `donors`  → "18 of 40 donors"
 */
export const trackerSchema = z.object({
  display: z.enum(['amount', 'percent', 'donors']),
  current: z.number().nonnegative(),
  target: z.number().positive(),
  /** Optional override for the line under the bar. */
  label: z.string().optional(),
});

export const priceSchema = z.object({
  /** In pounds, e.g. 20 → "£20.00". */
  amount: z.number().positive(),
  period: z.enum(['once', 'week', 'month']),
});

export const donationProgramSchema = z.object({
  /** URL-safe id, also the card's anchor (`/donations#<id>`). */
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  /** One or two sentences under the title. */
  summary: z.string().optional(),
  /** Square poster (cards show it 1:1). */
  image: z.object({
    src: z.string().min(1),
    alt: z.string().min(1),
  }),
  /** Suggested / subscription amount, when the programme has one. */
  price: priceSchema.optional(),
  /** Where the button goes (donation platform, subscription page or an internal page). */
  cta: z.object({
    label: z.string().min(1),
    href: z.string().min(1),
  }),
  tracker: trackerSchema.optional(),
});

/** Optional page-level tracker (e.g. "Running costs covered"). */
export const donationOverviewSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tracker: trackerSchema,
});

export const donationsDataSchema = z.object({
  overview: donationOverviewSchema.optional(),
  programs: z.array(donationProgramSchema),
});

export type DonationTracker = z.infer<typeof trackerSchema>;
export type DonationPrice = z.infer<typeof priceSchema>;
export type DonationProgram = z.infer<typeof donationProgramSchema>;
export type DonationOverview = z.infer<typeof donationOverviewSchema>;
export type DonationsData = z.infer<typeof donationsDataSchema>;
