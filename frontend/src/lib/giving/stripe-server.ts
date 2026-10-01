import 'server-only';
import Stripe from 'stripe';
import { loadDonations } from '@/lib/donations/repository';
import { donationRequestSchema, type DonationRequest } from './types';

/**
 * Server-only Stripe access. Keys come from env (provisioned by the Vercel Stripe integration):
 * STRIPE_SECRET_KEY (server) and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (browser).
 * Before going live, swap the secret key for a restricted key (rk_…) with only the
 * permissions used here: Checkout Sessions (write), Customers (write), Products/Prices (write).
 */
let client: Stripe | null = null;
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY is missing).');
  client ??= new Stripe(key);
  return client;
}

/** Tags our sessions in the Stripe Dashboard (label + 8-letter suffix, per Stripe guidance). */
const INTEGRATION_ID = 'alrahmah-give-QKZMWPLT';
const INTERVAL = { weekly: 'week', monthly: 'month' } as const;

export class DonationInputError extends Error {}

/** Metadata stored on the session and on the PaymentIntent / Subscription it creates. */
function donationMetadata(r: DonationRequest, campaignTitle: string): Stripe.MetadataParam {
  return {
    campaign_id: r.campaignId,
    campaign_title: campaignTitle,
    frequency: r.frequency,
    donor_title: r.donor.title ?? '',
    donor_first_name: r.donor.firstName,
    donor_last_name: r.donor.lastName,
    donor_phone: r.donor.phone ?? '',
    gift_aid: r.giftAid.declared ? 'yes' : 'no',
    gift_aid_house: r.giftAid.declared ? (r.giftAid.houseNameOrNumber ?? '') : '',
    gift_aid_postcode: r.giftAid.declared ? (r.giftAid.postcode ?? '') : '',
    gift_aid_declared_at: r.giftAid.declared ? new Date().toISOString() : '',
  };
}

/**
 * Creates a Checkout Session (ui_mode `elements`) for the on-page Payment Element:
 * `payment` mode for one-off gifts, `subscription` mode for weekly/monthly giving.
 * Everything is re-validated here; the browser can't change the amount or campaign.
 */
export async function createDonationSession(input: unknown, origin: string) {
  const parsed = donationRequestSchema.safeParse(input);
  if (!parsed.success)
    throw new DonationInputError(parsed.error.issues[0]?.message ?? 'Invalid donation.');
  const r = parsed.data;

  const { programs } = await loadDonations();
  const campaign = programs.find((p) => p.id === r.campaignId);
  if (!campaign) throw new DonationInputError('That cause is no longer available.');

  const recurring = r.frequency !== 'one-off';
  const metadata = donationMetadata(r, campaign.title);
  const unitAmount = Math.round(r.amount * 100);

  const session = await getStripe().checkout.sessions.create({
    ui_mode: 'elements',
    mode: recurring ? 'subscription' : 'payment',
    integration_identifier: INTEGRATION_ID,
    customer_email: r.donor.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: unitAmount,
          product_data: { name: `Donation: ${campaign.title}` },
          ...(recurring && {
            recurring: { interval: INTERVAL[r.frequency as 'weekly' | 'monthly'] },
          }),
        },
      },
    ],
    metadata,
    ...(recurring
      ? {
          subscription_data: {
            metadata,
            description: `${campaign.title} (${r.frequency} donation)`,
          },
        }
      : {
          customer_creation: 'always',
          payment_intent_data: { metadata, description: `Donation: ${campaign.title}` },
        }),
    return_url: `${origin}/give/complete?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!session.client_secret) throw new Error('Stripe did not return a client secret.');
  return { clientSecret: session.client_secret, sessionId: session.id };
}
