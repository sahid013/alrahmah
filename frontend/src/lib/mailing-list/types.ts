import { z } from 'zod';

/**
 * A donor who ticked "Keep me updated" on the donation form (Supabase `mailing_list`, one row per
 * email). `consentedAt` / `consentRef` / `consentText` are the record of consent: when, with which
 * donation, and the wording they agreed to. Staff can unsubscribe people; the record stays.
 */
export const mailingContactSchema = z.object({
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  organisation: z.string().optional(),
  city: z.string().optional(),
  /** ISO country code, as the donation form collects it. */
  country: z.string().optional(),
  subscribed: z.boolean(),
  /** ISO timestamp of the latest opt-in. */
  consentedAt: z.string(),
  /** The cause they were giving to when they opted in. */
  consentCampaignId: z.string().optional(),
  /** Stripe PaymentIntent / Invoice / Checkout Session id of that donation. */
  consentRef: z.string().optional(),
  consentText: z.string(),
  unsubscribedAt: z.string().optional(),
  /** False when the opt-in came with a Stripe test-mode donation. */
  livemode: z.boolean(),
});
export type MailingContact = z.infer<typeof mailingContactSchema>;
