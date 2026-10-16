import 'server-only';
import type Stripe from 'stripe';
import { adminClient } from '@/lib/supabase/server';
import { getStripe } from './stripe-server';

/**
 * Records donations from verified Stripe webhook events into Supabase `donations` (the dashboard's
 * Donations, Regular giving and Donors & exports read it). Server only, with the secret key.
 *
 *  - One-off gifts: `checkout.session.completed` / `async_payment_succeeded` (payment mode, paid).
 *  - Every weekly / monthly / daily payment, including the first: `invoice.paid`.
 *  - `charge.refunded` marks the payment refunded; `invoice.payment_failed` and
 *    `customer.subscription.deleted` update the regular gift's status.
 *
 * Rows are keyed by `payment_ref` (PaymentIntent or Invoice id), so Stripe's retries never create
 * duplicates. Payments without our metadata (e.g. made elsewhere in Stripe) are ignored.
 */

type Meta = Record<string, string>;
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id);
const opt = (v: string | undefined) => (v ? v : undefined);

/** The donor as the donation form collected them; `id` groups gifts by person (their email). */
function donorFrom(m: Meta, email: string | null | undefined) {
  const address = m.donor_address ?? '';
  const mail = (email ?? m.donor_email ?? '').trim();
  return {
    id: mail.toLowerCase() || `stripe:${m.donor_first_name}-${m.donor_last_name}`,
    type: m.donor_type === 'organisation' ? 'organisation' : 'personal',
    ...(opt(m.donor_organisation) && { organisation: m.donor_organisation }),
    firstName: m.donor_first_name ?? '',
    lastName: m.donor_last_name ?? '',
    address,
    country: m.donor_country_code || 'GB',
    postcode: m.donor_postcode ?? '',
    city: m.donor_city ?? '',
    ...(opt(m.donor_region) && { region: m.donor_region }),
    email: mail,
    phone: m.donor_phone ?? '',
  };
}

function sourceFrom(m: Meta) {
  const source = {
    ...(opt(m.utm_source) && { utmSource: m.utm_source }),
    ...(opt(m.utm_medium) && { utmMedium: m.utm_medium }),
    ...(opt(m.utm_campaign) && { utmCampaign: m.utm_campaign }),
    ...(opt(m.referrer) && { referrer: m.referrer }),
    ...(opt(m.landing_page) && { landingPage: m.landing_page }),
  };
  return Object.keys(source).length ? source : null;
}

const at = (event: Stripe.Event) => new Date(event.created * 1000).toISOString();

async function upsert(row: Record<string, unknown>) {
  const { error } = await adminClient()
    .from('donations')
    .upsert(row, { onConflict: 'payment_ref' });
  if (error) throw new Error(`Could not record donation: ${error.message}`);
}

async function updateWhere(column: string, value: string, patch: Record<string, unknown>) {
  const { error } = await adminClient().from('donations').update(patch).eq(column, value);
  if (error) throw new Error(`Could not update donations: ${error.message}`);
}

/** Records what a verified Stripe event means for donations (no-op for other events). */
export async function recordStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const s = event.data.object;
      // Subscriptions are recorded per invoice; setup (daily causes) has no payment yet.
      if (s.mode !== 'payment' || s.payment_status !== 'paid') return;
      const m = (s.metadata ?? {}) as Meta;
      if (!m.campaign_id) return;
      const paymentIntent = idOf(s.payment_intent);
      await upsert({
        payment_ref: paymentIntent ?? s.id,
        payment_intent: paymentIntent ?? null,
        created_at: at(event),
        amount: (s.amount_total ?? 0) / 100,
        currency: 'GBP',
        type: 'one-off',
        frequency: null,
        campaign_id: m.campaign_id,
        status: 'succeeded',
        donor: donorFrom(m, s.customer_details?.email ?? s.customer_email),
        marketing_consent: m.marketing_consent === 'yes',
        source: sourceFrom(m),
        stripe_customer: idOf(s.customer) ?? null,
      });
      return;
    }

    case 'invoice.paid': {
      const inv = event.data.object;
      const details = inv.parent?.subscription_details;
      const m = (details?.metadata ?? {}) as Meta;
      const subscription = idOf(details?.subscription);
      if (!subscription || !m.campaign_id || !inv.id || !inv.amount_paid) return;
      // The PaymentIntent behind this invoice, so a refund can be matched to it later.
      const payments = await getStripe().invoicePayments.list({ invoice: inv.id, limit: 1 });
      const paymentIntent = idOf(payments.data[0]?.payment.payment_intent);
      await upsert({
        payment_ref: inv.id,
        payment_intent: paymentIntent ?? null,
        created_at: at(event),
        amount: inv.amount_paid / 100,
        currency: 'GBP',
        type: 'recurring',
        frequency: ['weekly', 'monthly', 'daily'].includes(m.frequency ?? '')
          ? m.frequency
          : 'monthly',
        campaign_id: m.campaign_id,
        status: 'succeeded',
        donor: donorFrom(m, inv.customer_email),
        marketing_consent: m.marketing_consent === 'yes',
        subscription_id: subscription,
        subscription_status: 'active',
        source: sourceFrom(m),
        stripe_customer: idOf(inv.customer) ?? null,
      });
      // A successful payment means the regular gift is active again (e.g. after a failure).
      await updateWhere('subscription_id', subscription, { subscription_status: 'active' });
      return;
    }

    case 'invoice.payment_failed': {
      const subscription = idOf(event.data.object.parent?.subscription_details?.subscription);
      if (subscription)
        await updateWhere('subscription_id', subscription, { subscription_status: 'past_due' });
      return;
    }

    case 'customer.subscription.deleted':
      await updateWhere('subscription_id', event.data.object.id, {
        subscription_status: 'cancelled',
      });
      return;

    case 'charge.refunded': {
      const charge = event.data.object;
      const paymentIntent = idOf(charge.payment_intent);
      // Only full refunds mark the donation refunded.
      if (paymentIntent && charge.amount_refunded >= charge.amount)
        await updateWhere('payment_intent', paymentIntent, { status: 'refunded' });
      return;
    }

    default:
      return;
  }
}
