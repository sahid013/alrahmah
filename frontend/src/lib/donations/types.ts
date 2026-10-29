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

/**
 * How a cause is given to (each has its own form on /donate/<id>):
 *  - `regular`    → one-off, weekly or monthly, any amount (Masjid Expansion).
 *  - `per-person` → one-off; the donor says how many people they're paying for and the total is
 *                   `unitAmount` × people (Fitrana).
 *  - `daily`      → an amount charged once on each of `count` consecutive nights/days starting
 *                   `firstDate` at `chargeTime` (UK time), then it stops by itself (Last 10 Nights,
 *                   First 10 Days of Dhul Hijjah, Ramadan Daily). Donors can sign up in advance;
 *                   joining part-way charges only the nights/days left.
 *  - `jumuah`     → an amount charged every Friday at `chargeTime` (UK time) until the donor
 *                   cancels (Jumu'ah Giving). Nothing is taken at sign-up: the first payment is the
 *                   coming Friday.
 */
export const givingSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('regular') }),
  z.object({
    kind: z.literal('per-person'),
    /** In pounds, per person. */
    unitAmount: z.number().positive(),
    maxPeople: z.number().int().positive().default(20),
  }),
  z.object({
    kind: z.literal('daily'),
    /** UK date of the first night/day (YYYY-MM-DD). For nights: the evening it starts. */
    firstDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    count: z.number().int().min(1).max(30),
    unit: z.enum(['night', 'day']),
    /** UK time each payment is taken (HH:mm). */
    chargeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    /** Shown in sentences: "the last 10 nights of Ramadan". */
    periodLabel: z.string().min(1),
    /** Suggested amounts per night/day, in pounds. */
    presets: z.array(z.number().positive()).min(1).max(4).default([1, 5, 10, 20]),
  }),
  z.object({
    kind: z.literal('jumuah'),
    /** UK time each Friday's payment is taken (HH:mm). */
    chargeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    /** Suggested amounts per Friday, in pounds. */
    presets: z.array(z.number().positive()).min(1).max(4).default([5, 10, 20]),
  }),
]);

/** Line icon on the "Select your cause" tiles. */
export const CAUSE_ICONS = ['mosque', 'people', 'moon', 'sun', 'calendar'] as const;

export const donationProgramSchema = z.object({
  /** URL-safe id, also the card's anchor (`/donations#<id>`). */
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  /** One or two sentences under the title. */
  summary: z.string().optional(),
  /** Optional square poster (cards show it 1:1). Causes currently have none. */
  image: z
    .object({
      src: z.string().min(1),
      alt: z.string().min(1),
    })
    .optional(),
  /** Suggested / subscription amount, when the programme has one. */
  price: priceSchema.optional(),
  /** Where the button goes (donation platform, subscription page or an internal page). */
  cta: z.object({
    label: z.string().min(1),
    href: z.string().min(1),
  }),
  tracker: trackerSchema.optional(),
  giving: givingSchema.default({ kind: 'regular' }),
  icon: z.enum(CAUSE_ICONS).optional(),
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
export type Giving = z.infer<typeof givingSchema>;
export type DailyGiving = Extract<Giving, { kind: 'daily' }>;
export type JumuahGiving = Extract<Giving, { kind: 'jumuah' }>;
export type DonationOverview = z.infer<typeof donationOverviewSchema>;
export type DonationsData = z.infer<typeof donationsDataSchema>;
