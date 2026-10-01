import 'server-only';
import type Stripe from 'stripe';

/**
 * What the webhook does with each confirmed payment. TODO (Supabase step): insert/update rows
 * in `donations` (dashboard `donationSchema`): paymentRef = PaymentIntent / Invoice id,
 * subscription id for regular gifts, campaign + Gift Aid from the session/subscription metadata.
 * Upsert on paymentRef so Stripe's retries never create duplicates.
 */
export interface DonationEvent {
  kind: 'paid' | 'renewed' | 'failed' | 'refunded' | 'cancelled';
  /** PaymentIntent, Invoice, Charge or Subscription id: the idempotency key. */
  ref: string;
  amount?: number;
  campaignId?: string;
  giftAid?: boolean;
  subscriptionId?: string;
}

export async function recordDonationEvent(event: DonationEvent) {
  // No personal data in logs: ids, amounts and flags only.
  console.info('[giving] donation event', JSON.stringify(event));
}

const pounds = (minor: number | null | undefined) => (minor ?? 0) / 100;
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id);

/** Maps a verified Stripe event to a donation event (or null when it isn't one we act on). */
export function toDonationEvent(event: Stripe.Event): DonationEvent | null {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const s = event.data.object;
      // Delayed payment methods complete while still unpaid; fulfil only once paid.
      if (s.payment_status === 'unpaid') return null;
      return {
        kind: 'paid',
        ref: idOf(s.payment_intent) ?? idOf(s.invoice) ?? s.id,
        amount: pounds(s.amount_total),
        campaignId: s.metadata?.campaign_id,
        giftAid: s.metadata?.gift_aid === 'yes',
        subscriptionId: idOf(s.subscription),
      };
    }
    case 'checkout.session.async_payment_failed':
      return { kind: 'failed', ref: event.data.object.id };
    case 'invoice.paid': {
      const inv = event.data.object;
      // The first invoice is covered by checkout.session.completed; record renewals only.
      if (inv.billing_reason !== 'subscription_cycle') return null;
      return { kind: 'renewed', ref: inv.id ?? event.id, amount: pounds(inv.amount_paid) };
    }
    case 'invoice.payment_failed':
      return { kind: 'failed', ref: event.data.object.id ?? event.id };
    case 'charge.refunded': {
      const charge = event.data.object;
      return {
        kind: 'refunded',
        ref: idOf(charge.payment_intent) ?? charge.id,
        amount: pounds(charge.amount_refunded),
      };
    }
    case 'customer.subscription.deleted':
      return { kind: 'cancelled', ref: event.data.object.id, subscriptionId: event.data.object.id };
    default:
      return null;
  }
}
