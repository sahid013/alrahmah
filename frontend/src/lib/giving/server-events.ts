import 'server-only';
import type Stripe from 'stripe';
import type { MetaServerEvent } from '@/lib/meta/capi';
import { userData } from '@/lib/meta/user-data';
import { referenceFromSession } from './payments';
import type { DailyPlan } from './schedule';
import { stripeFor } from './stripe-mode';
import { annualValue, causeParam, paymentMethodParam } from './tracking';
import type { Frequency } from './types';
import { browserFromMetadata } from './visit';

/**
 * Meta server events (Conversions API) from verified Stripe webhook events, as the marketing
 * team's spec (section 4) asks. Only payments from the website's donation forms count: they carry
 * our `campaign_id` metadata, and so do no payment links, card terminal or invoices.
 *
 *   one-off payment succeeded                   → Purchase         (checkout.session.completed /
 *                                                                    async_payment_succeeded)
 *   first weekly / monthly payment succeeded    → Purchase         (invoice.paid, subscription_create)
 *   daily cause's card saved                    → Subscribe        (checkout.session.completed, setup)
 *   any later payment (incl. every daily one)   → DonationRenewal  (invoice.paid)
 *   failed, cancelled, refunded                 → nothing
 *
 * Direct Debit is only reported once Stripe confirms the payment (those same events fire then).
 * Purchase / Subscribe use the donation's `event_id` (shared with the browser event);
 * DonationRenewal uses the invoice id. Stripe's retries resend the same event_id, which Meta
 * deduplicates. Donors without Marketing consent get no server events (`visit.ts`).
 */
type Meta = Record<string, string>;
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id);

export interface ServerEvent {
  event: MetaServerEvent;
  live: boolean;
}

/** The donor as `user_data`, from the donation's metadata. */
function userFrom(m: Meta, email: string | null | undefined, customer: string | undefined) {
  return userData(
    {
      email: email ?? m.donor_email,
      phone: m.donor_phone,
      firstName: m.donor_first_name,
      lastName: m.donor_last_name,
      city: m.donor_city,
      postcode: m.donor_postcode,
      country: m.donor_country_code || 'GB',
      externalId: customer ?? (email ?? m.donor_email)?.toLowerCase(),
    },
    browserFromMetadata(m),
  );
}

const frequencyOf = (m: Meta): Frequency =>
  (['one-off', 'weekly', 'monthly', 'daily'] as const).find((f) => f === m.frequency) ?? 'one-off';

/** cause / donation_type as saved with the donation (computed for older donations without them). */
function donationFields(m: Meta) {
  const frequency = frequencyOf(m);
  return {
    cause: m.cause || causeParam(m.campaign_id ?? ''),
    donation_type: m.donation_type || (frequency === 'one-off' ? 'one_off' : frequency),
  };
}

async function paymentMethodOf(stripe: Stripe, paymentIntent: string | undefined) {
  if (!paymentIntent) return 'card';
  const pi = await stripe.paymentIntents.retrieve(paymentIntent, { expand: ['payment_method'] });
  const pm = typeof pi.payment_method === 'object' ? pi.payment_method : null;
  return pm ? paymentMethodParam(pm.type, pm.card?.wallet?.type) : 'card';
}

const pounds = (pence: number) => Math.round(pence) / 100;

/**
 * The server event for a webhook event, or null when it isn't one we report. `plan`: the daily
 * schedule the webhook has just made sure exists (for Subscribe's total).
 */
export async function serverEventFor(
  event: Stripe.Event,
  plan?: DailyPlan | null,
): Promise<ServerEvent | null> {
  const live = event.livemode;
  const stripe = stripeFor(live ? 'live' : 'test');
  const base = { event_time: event.created, action_source: 'website' as const };

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const s = event.data.object;
      const m = (s.metadata ?? {}) as Meta;
      if (!m.campaign_id || m.consent_status !== 'yes') return null;
      const email = s.customer_details?.email ?? s.customer_email;
      const common = {
        ...base,
        event_id: m.event_id || `Purchase-${s.id}`,
        event_source_url: m.event_source_url || undefined,
        user_data: userFrom(m, email, idOf(s.customer)),
      };

      // Daily causes: the card is saved and the nightly/daily charges scheduled.
      if (s.mode === 'setup' && m.giving_kind === 'daily') {
        if (event.type !== 'checkout.session.completed' || !plan) return null;
        const setup = await stripe.setupIntents.retrieve(idOf(s.setup_intent) ?? '', {
          expand: ['payment_method'],
        });
        const pm = typeof setup.payment_method === 'object' ? setup.payment_method : null;
        return {
          live,
          event: {
            ...common,
            event_name: 'Subscribe',
            custom_data: {
              value: Math.round(plan.amount * plan.count * 100) / 100,
              currency: 'GBP',
              ...donationFields(m),
              payment_sequence: 'first',
              payment_method: pm ? paymentMethodParam(pm.type, pm.card?.wallet?.type) : 'card',
              order_id: referenceFromSession(s.id),
            },
          },
        };
      }

      // One-off gifts; weekly/monthly ones are reported from their first invoice instead.
      if (s.mode !== 'payment' || s.payment_status !== 'paid') return null;
      const value = pounds(s.amount_total ?? 0);
      return {
        live,
        event: {
          ...common,
          event_name: 'Purchase',
          custom_data: {
            value,
            currency: 'GBP',
            ...donationFields(m),
            payment_sequence: 'first',
            annual_value: value,
            payment_method: await paymentMethodOf(stripe, idOf(s.payment_intent)),
            order_id: referenceFromSession(s.id),
          },
        },
      };
    }

    case 'invoice.paid': {
      const inv = event.data.object;
      const details = inv.parent?.subscription_details;
      const m = (details?.metadata ?? {}) as Meta;
      const subscription = idOf(details?.subscription);
      if (!subscription || !inv.id || !inv.amount_paid || !m.campaign_id) return null;

      const payments = await stripe.invoicePayments.list({ invoice: inv.id, limit: 1 });
      const paymentIntent = idOf(payments.data[0]?.payment.payment_intent);
      const first = inv.billing_reason === 'subscription_create' && m.giving_kind !== 'daily';
      const fields = donationFields(m);
      const sequence = first ? 'first' : 'renewal';
      // The spec asks for these on every payment in Stripe too.
      if (paymentIntent)
        await stripe.paymentIntents.update(paymentIntent, {
          metadata: { ...fields, payment_sequence: sequence },
        });
      if (m.consent_status !== 'yes') return null;

      const value = pounds(inv.amount_paid);
      const method = await paymentMethodOf(stripe, paymentIntent);
      const user_data = userFrom(m, inv.customer_email, idOf(inv.customer));

      if (first) {
        // The checkout session that started this subscription gives the donor's reference.
        const sessions = await stripe.checkout.sessions.list({ subscription, limit: 1 });
        const session = sessions.data[0]?.id;
        return {
          live,
          event: {
            ...base,
            event_name: 'Purchase',
            event_id: m.event_id || `Purchase-${session ?? inv.id}`,
            event_source_url: m.event_source_url || undefined,
            user_data,
            custom_data: {
              value,
              currency: 'GBP',
              ...fields,
              payment_sequence: 'first',
              annual_value: annualValue(value, frequencyOf(m)),
              payment_method: method,
              order_id: session ? referenceFromSession(session) : inv.id,
            },
          },
        };
      }
      return {
        live,
        event: {
          event_name: 'DonationRenewal',
          event_id: inv.id,
          event_time: event.created,
          action_source: 'system_generated',
          user_data,
          custom_data: {
            value,
            currency: 'GBP',
            ...fields,
            payment_sequence: 'renewal',
            payment_method: method,
            order_id: paymentIntent ?? inv.id,
          },
        },
      };
    }

    default:
      return null;
  }
}
