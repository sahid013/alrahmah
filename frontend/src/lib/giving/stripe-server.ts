import 'server-only';
import Stripe from 'stripe';
import { isCauseVisible, loadDonations } from '@/lib/donations/repository';
import { countryName } from './countries';
import { chargeFor, DonationInputError } from './causes';
import { remainingCharges, type DailyPlan } from './schedule';
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

export { DonationInputError };

const pence = (pounds: number) => Math.round(pounds * 100);
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id);

/**
 * Metadata stored on the session and on the PaymentIntent / Subscription it creates. The webhook
 * builds the dashboard's donation record from it (`lib/giving/record.ts`), so it carries the
 * donor exactly as the form collected them, plus where they came from. Stripe allows 500
 * characters per value.
 */
function donationMetadata(r: DonationRequest, campaignTitle: string): Stripe.MetadataParam {
  const d = r.donor;
  const s = r.source;
  return {
    campaign_id: r.campaignId,
    campaign_title: campaignTitle,
    frequency: r.frequency,
    people: r.people ? String(r.people) : '',
    donor_type: d.type,
    donor_organisation: d.organisation ?? '',
    donor_first_name: d.firstName,
    donor_last_name: d.lastName,
    donor_phone: d.phone,
    donor_address: d.address,
    donor_city: d.city,
    donor_region: d.region ?? '',
    donor_postcode: d.postcode,
    donor_country: countryName(d.country),
    donor_country_code: d.country,
    donor_email: d.email,
    marketing_consent: r.marketingConsent ? 'yes' : 'no',
    utm_source: s?.utmSource ?? '',
    utm_medium: s?.utmMedium ?? '',
    utm_campaign: s?.utmCampaign ?? '',
    referrer: s?.referrer ?? '',
    landing_page: s?.landingPage ?? '',
  };
}

/**
 * Creates a Checkout Session (ui_mode `elements`) for the on-page Payment Element, following the
 * cause's rules (`chargeFor`): `payment` mode for one-off gifts (Fitrana: £ per person × people),
 * `subscription` mode for weekly/monthly giving, and `setup` mode for daily causes, which only
 * saves the card; `finaliseDailyGiving` then schedules one charge per night/day.
 * Everything is re-validated here; the browser can't change the amount, cause or schedule.
 */
export async function createDonationSession(input: unknown, origin: string) {
  const parsed = donationRequestSchema.safeParse(input);
  if (!parsed.success)
    throw new DonationInputError(parsed.error.issues[0]?.message ?? 'Invalid donation.');
  const r = parsed.data;

  const { programs } = await loadDonations();
  const campaign = programs.find((p) => p.id === r.campaignId);
  if (!campaign || !(await isCauseVisible(campaign.id)))
    throw new DonationInputError('That cause is no longer available.');

  const charge = chargeFor(r, campaign.giving);
  const metadata = donationMetadata(r, campaign.title);
  const stripe = getStripe();
  const common = {
    ui_mode: 'elements',
    integration_identifier: INTEGRATION_ID,
    return_url: `${origin}/donate/complete?session_id={CHECKOUT_SESSION_ID}`,
  } as const;
  const product = { name: `Donation: ${campaign.title}` };

  let session: Stripe.Checkout.Session;
  if (charge.kind === 'daily') {
    // A customer to keep the card on, so it can be charged on each night/day.
    const d = r.donor;
    const customer = await stripe.customers.create({
      email: d.email,
      name: `${d.firstName} ${d.lastName}`,
      phone: d.phone,
      address: {
        line1: d.address.split('\n')[0] ?? d.address,
        city: d.city,
        state: d.region,
        postal_code: d.postcode,
        country: d.country,
      },
    });
    const daily = {
      ...metadata,
      giving_kind: 'daily',
      daily_amount: String(pence(charge.amount)),
    };
    session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'setup',
      currency: 'gbp',
      customer: customer.id,
      metadata: daily,
      setup_intent_data: {
        metadata: daily,
        description: `${campaign.title}: ${charge.charges.length} daily donations`,
      },
    });
  } else if (charge.kind === 'recurring') {
    session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'subscription',
      customer_email: r.donor.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: pence(charge.amount),
            product_data: product,
            recurring: { interval: charge.interval },
          },
        },
      ],
      metadata,
      subscription_data: {
        metadata,
        description: `${campaign.title} (${r.frequency} donation)`,
      },
    });
  } else {
    session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      customer_email: r.donor.email,
      customer_creation: 'always',
      line_items: [
        {
          // Fitrana: £ per person × number of people, so the receipt shows both.
          quantity: charge.quantity,
          price_data: {
            currency: 'gbp',
            unit_amount: pence(charge.unitAmount),
            product_data:
              charge.quantity > 1 || campaign.giving.kind === 'per-person'
                ? { name: `${product.name} (per person)` }
                : product,
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata, description: product.name },
    });
  }

  if (!session.client_secret) throw new Error('Stripe did not return a client secret.');
  return { clientSecret: session.client_secret, sessionId: session.id };
}

function planOf(schedule: Stripe.SubscriptionSchedule): DailyPlan {
  const m = schedule.metadata ?? {};
  return {
    amount: Number(m.daily_amount ?? 0) / 100,
    count: Number(m.daily_count ?? 0),
    firstCharge: m.daily_first ?? '',
    lastCharge: m.daily_last ?? '',
  };
}

async function findSchedule(customer: string, sessionId: string) {
  const { data } = await getStripe().subscriptionSchedules.list({ customer, limit: 20 });
  return data.find((s) => s.metadata?.checkout_session === sessionId);
}

/**
 * After a daily cause's card is saved: schedule one charge per remaining night/day, ending by
 * itself. Safe to call more than once for the same session (the browser, the return page and the
 * webhook all call it); later calls return the existing plan. Returns null for other sessions.
 */
export async function finaliseDailyGiving(sessionId: string): Promise<DailyPlan | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent'] });
  const m = session.metadata ?? {};
  if (session.mode !== 'setup' || m.giving_kind !== 'daily') return null;
  const setupIntent = session.setup_intent as Stripe.SetupIntent | null;
  const customer = idOf(session.customer);
  const paymentMethod = idOf(setupIntent?.payment_method);
  if (session.status !== 'complete' || setupIntent?.status !== 'succeeded' || !customer)
    throw new DonationInputError('Your card hasn’t been confirmed yet.');
  if (!paymentMethod) throw new Error('The saved card is missing from the session.');

  const existing = await findSchedule(customer, session.id);
  if (existing) return planOf(existing);

  const { programs } = await loadDonations();
  const campaign = programs.find((p) => p.id === m.campaign_id);
  if (campaign?.giving.kind !== 'daily')
    throw new DonationInputError('That cause is no longer available.');
  // Recomputed now: nights that passed while the donor was on the form aren't charged.
  const charges = remainingCharges(campaign.giving);
  const first = charges[0];
  const last = charges.at(-1);
  if (!first || !last)
    throw new DonationInputError(`Donations for ${campaign.giving.periodLabel} have closed.`);

  const amount = Number(m.daily_amount);
  const plan = {
    ...m,
    daily_count: String(charges.length),
    daily_first: first.toISOString(),
    daily_last: last.toISOString(),
  };
  const key = `daily-${session.id}`;
  try {
    const price = await stripe.prices.create(
      {
        currency: 'gbp',
        unit_amount: amount,
        recurring: { interval: 'day' },
        product_data: { name: `Donation: ${campaign.title}` },
      },
      { idempotencyKey: `${key}-price` },
    );
    const schedule = await stripe.subscriptionSchedules.create(
      {
        customer,
        start_date: Math.floor(first.getTime() / 1000),
        end_behavior: 'cancel',
        default_settings: {
          collection_method: 'charge_automatically',
          default_payment_method: paymentMethod,
          description: `${campaign.title} (daily donation)`,
        },
        phases: [
          {
            items: [{ price: price.id, quantity: 1 }],
            duration: { interval: 'day', interval_count: charges.length },
            // Copied onto the subscription, so its invoices can be traced to the cause.
            metadata: plan,
          },
        ],
        metadata: { ...plan, checkout_session: session.id },
      },
      { idempotencyKey: `${key}-schedule` },
    );
    return planOf(schedule);
  } catch (error) {
    // Another caller may have created it at the same moment.
    const raced = await findSchedule(customer, session.id);
    if (raced) return planOf(raced);
    throw error;
  }
}
