import 'server-only';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { isCauseVisible, loadDonations } from '@/lib/donations/repository';
import { countryName } from './countries';
import { chargeFor, DonationInputError } from './causes';
import { nextFridayCharge, remainingCharges, type DailyPlan } from './schedule';
import { currentStripeMode, keysFor, modeOfSession, stripeFor } from './stripe-mode';
import { causeParam, donationTypeParam } from './tracking';
import { donationRequestSchema, type DonationRequest } from './types';
import { visitFrom, visitMetadata } from './visit';

/**
 * Server-only Stripe calls for donations. Which keys (live or test) come from `stripe-mode.ts`:
 * new sessions use the current mode; anything already started uses the mode of its session id.
 * Before going live, swap each secret key for a restricted key (rk_…) with only the
 * permissions used here: Checkout Sessions (write), Customers (write), Products/Prices (write).
 */
/** Tags our sessions in the Stripe Dashboard (label + 8-letter suffix, per Stripe guidance). */
const INTEGRATION_ID = 'alrahmah-give-QKZMWPLT';

export { DonationInputError };

const pence = (pounds: number) => Math.round(pounds * 100);
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id);

/**
 * Metadata stored on the session and on the PaymentIntent / Subscription it creates. The webhook
 * builds the dashboard's donation record from it (`lib/giving/record.ts`), so it carries the
 * donor exactly as the form collected them, plus where they came from. Stripe allows 50 keys and
 * 500 characters per value; the visit fields (`visitMetadata`) and the tracking `event_id`,
 * `cause` and `donation_type` are for the Meta server events (`lib/giving/server-events.ts`).
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
    // Gift Aid declaration (personal donations only; the wording is GIFT_AID_TEXT). Regular gifts
    // carry it on every payment, as the declaration covers future donations.
    gift_aid: r.giftAid.declared && d.type === 'personal' ? 'yes' : 'no',
    gift_aid_declared_at:
      r.giftAid.declared && d.type === 'personal' ? new Date().toISOString() : '',
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
 * `subscription` mode for weekly/monthly giving, and `setup` mode for daily causes and Jumu'ah
 * giving, which only saves the card; `finaliseDailyGiving` then schedules one charge per
 * night/day, or one every Friday.
 * Everything is re-validated here; the browser can't change the amount, cause or schedule.
 */
export async function createDonationSession(input: unknown, origin: string, headers: Headers) {
  const parsed = donationRequestSchema.safeParse(input);
  if (!parsed.success)
    throw new DonationInputError(parsed.error.issues[0]?.message ?? 'Invalid donation.');
  const r = parsed.data;

  const { programs } = await loadDonations();
  const campaign = programs.find((p) => p.id === r.campaignId);
  if (!campaign || !(await isCauseVisible(campaign.id)))
    throw new DonationInputError('That cause is no longer available.');

  const charge = chargeFor(r, campaign.giving);
  // The browser's Purchase / Subscribe uses the same event_id, so Meta counts the donation once.
  const eventId = randomUUID();
  const metadata = {
    ...donationMetadata(r, campaign.title),
    event_id: eventId,
    cause: causeParam(campaign.id),
    donation_type: donationTypeParam(r.frequency, campaign.giving),
    ...visitMetadata(visitFrom(headers, r.source), r.source, `${origin}/donate/${campaign.id}`),
  };
  const mode = await currentStripeMode();
  const stripe = stripeFor(mode);
  const keys = keysFor(mode)!;
  const common = {
    ui_mode: 'elements',
    integration_identifier: INTEGRATION_ID,
    return_url: `${origin}/donate/complete?session_id={CHECKOUT_SESSION_ID}`,
  } as const;
  // The website's own payment method settings in Stripe, so the account's defaults (used by the
  // masjid's other donation pages) stay untouched. Daily causes and Jumu'ah giving (charged on a
  // set night or Friday) use a set without Direct Debit, which takes days to clear. Unset (e.g.
  // the test sandbox): Stripe's defaults apply.
  const savesCard = charge.kind === 'daily' || charge.kind === 'jumuah';
  const methods = savesCard ? keys.paymentMethodConfigDaily : keys.paymentMethodConfig;
  const config = methods ? { payment_method_configuration: methods } : {};
  const product = { name: `Donation: ${campaign.title}` };

  let session: Stripe.Checkout.Session;
  if (savesCard) {
    // A customer to keep the card on, so it can be charged on each night/day or Friday.
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
      giving_kind: charge.kind,
      daily_amount: String(pence(charge.amount)),
    };
    session = await stripe.checkout.sessions.create({
      ...common,
      ...config,
      mode: 'setup',
      currency: 'gbp',
      customer: customer.id,
      metadata: daily,
      setup_intent_data: {
        metadata: daily,
        description:
          charge.kind === 'daily'
            ? `${campaign.title}: ${charge.charges.length} daily donations`
            : `${campaign.title}: a donation every Friday`,
      },
    });
  } else if (charge.kind === 'recurring') {
    session = await stripe.checkout.sessions.create({
      ...common,
      ...config,
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
      ...config,
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
      payment_intent_data: {
        metadata: { ...metadata, payment_sequence: 'first' },
        description: product.name,
      },
    });
  }

  if (!session.client_secret) throw new Error('Stripe did not return a client secret.');
  // The browser loads Stripe.js with the same mode's publishable key.
  return {
    clientSecret: session.client_secret,
    sessionId: session.id,
    publishableKey: keys.publishableKey,
    eventId,
  };
}

function planOf(schedule: Stripe.SubscriptionSchedule): DailyPlan {
  const m = schedule.metadata ?? {};
  return {
    amount: Number(m.daily_amount ?? 0) / 100,
    count: Number(m.daily_count ?? 0),
    firstCharge: m.daily_first ?? '',
    lastCharge: m.daily_last ?? '',
    ...(m.giving_kind === 'jumuah' && { everyFriday: true }),
  };
}

async function findSchedule(stripe: Stripe, customer: string, sessionId: string) {
  const { data } = await stripe.subscriptionSchedules.list({ customer, limit: 20 });
  return data.find((s) => s.metadata?.checkout_session === sessionId);
}

/**
 * After a daily cause's card is saved: schedule one charge per remaining night/day, ending by
 * itself. Jumu'ah giving: a weekly charge from the coming Friday, which carries on after the
 * schedule's first week (`end_behavior: release`) until the donor cancels. Safe to call more than
 * once for the same session (the browser, the return page and the webhook all call it); later
 * calls return the existing plan. Returns null for other sessions.
 */
export async function finaliseDailyGiving(sessionId: string): Promise<DailyPlan | null> {
  const stripe = stripeFor(modeOfSession(sessionId));
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent'] });
  const m = session.metadata ?? {};
  if (session.mode !== 'setup' || (m.giving_kind !== 'daily' && m.giving_kind !== 'jumuah'))
    return null;
  const setupIntent = session.setup_intent as Stripe.SetupIntent | null;
  const customer = idOf(session.customer);
  const paymentMethod = idOf(setupIntent?.payment_method);
  if (session.status !== 'complete' || setupIntent?.status !== 'succeeded' || !customer)
    throw new DonationInputError('Your card hasn’t been confirmed yet.');
  if (!paymentMethod) throw new Error('The saved card is missing from the session.');

  const existing = await findSchedule(stripe, customer, session.id);
  if (existing) return planOf(existing);

  const { programs } = await loadDonations();
  const campaign = programs.find((p) => p.id === m.campaign_id);
  if (campaign?.giving.kind === 'jumuah' && m.giving_kind === 'jumuah')
    return scheduleFridays(stripe, session.id, customer, paymentMethod, m, campaign.title, {
      first: nextFridayCharge(campaign.giving),
    });
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
    const raced = await findSchedule(stripe, customer, session.id);
    if (raced) return planOf(raced);
    throw error;
  }
}

/** Jumu'ah giving: a weekly price from `first` (a Friday), released to run until cancelled. */
async function scheduleFridays(
  stripe: Stripe,
  sessionId: string,
  customer: string,
  paymentMethod: string,
  m: Stripe.Metadata,
  title: string,
  { first }: { first: Date },
): Promise<DailyPlan> {
  const plan = { ...m, daily_count: '0', daily_first: first.toISOString(), daily_last: '' };
  const key = `jumuah-${sessionId}`;
  try {
    const price = await stripe.prices.create(
      {
        currency: 'gbp',
        unit_amount: Number(m.daily_amount),
        recurring: { interval: 'week' },
        product_data: { name: `Donation: ${title}` },
      },
      { idempotencyKey: `${key}-price` },
    );
    const schedule = await stripe.subscriptionSchedules.create(
      {
        customer,
        start_date: Math.floor(first.getTime() / 1000),
        // After the first week the subscription carries on by itself, every Friday.
        end_behavior: 'release',
        default_settings: {
          collection_method: 'charge_automatically',
          default_payment_method: paymentMethod,
          description: `${title} (every Friday)`,
        },
        phases: [
          {
            items: [{ price: price.id, quantity: 1 }],
            duration: { interval: 'week', interval_count: 1 },
            // Copied onto the subscription, so its invoices can be traced to the cause.
            metadata: plan,
          },
        ],
        metadata: { ...plan, checkout_session: sessionId },
      },
      { idempotencyKey: `${key}-schedule` },
    );
    return planOf(schedule);
  } catch (error) {
    const raced = await findSchedule(stripe, customer, sessionId);
    if (raced) return planOf(raced);
    throw error;
  }
}
