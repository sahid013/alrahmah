import type Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stand-ins for the database and Stripe: capture what would be written.
const writes: {
  op: string;
  table: string;
  row?: Record<string, unknown>;
  where?: [string, string];
}[] = [];
/** What the mailing list already holds for the email being looked up. */
let listed: { consented_at: string; unsubscribed_at: string | null } | null = null;
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  adminClient: () => ({
    from: (table: string) => ({
      upsert: (row: Record<string, unknown>) => {
        writes.push({ op: 'upsert', table, row });
        return Promise.resolve({ error: null });
      },
      update: (row: Record<string, unknown>) => ({
        eq: (column: string, value: string) => {
          writes.push({ op: 'update', table, row, where: [column, value] });
          return Promise.resolve({ error: null });
        },
      }),
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: listed, error: null }) }),
      }),
    }),
  }),
}));
vi.mock('./stripe-mode', () => ({
  stripeFor: () => ({
    invoicePayments: {
      list: () => Promise.resolve({ data: [{ payment: { payment_intent: 'pi_renewal' } }] }),
    },
  }),
}));

const { recordStripeEvent } = await import('./record');

const meta = {
  campaign_id: 'masjid-expansion',
  frequency: 'monthly',
  donor_type: 'personal',
  donor_first_name: 'Aisha',
  donor_last_name: 'Khan',
  donor_address: '6 Sheepscar Way',
  donor_city: 'Leeds',
  donor_postcode: 'LS7 3JB',
  donor_country_code: 'GB',
  donor_email: 'Aisha@Example.com',
  donor_phone: '07700 900123',
  marketing_consent: 'yes',
  utm_source: 'facebook',
  landing_page: '/appeal',
};

const event = (type: string, object: unknown) =>
  ({ type, created: 1_791_000_000, data: { object } }) as unknown as Stripe.Event;

beforeEach(() => {
  writes.length = 0;
  listed = null;
});
const donationWrites = () => writes.filter((w) => w.table === 'donations');
const listWrites = () => writes.filter((w) => w.table === 'mailing_list');

describe('recording donations from Stripe', () => {
  it('records a paid one-off gift with the donor and source', async () => {
    await recordStripeEvent(
      event('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'paid',
        payment_intent: 'pi_1',
        amount_total: 2500,
        customer_details: { email: 'aisha@example.com' },
        metadata: { ...meta, frequency: 'one-off' },
      }),
    );
    expect(donationWrites()).toHaveLength(1);
    expect(writes[0]!.row).toMatchObject({
      payment_ref: 'pi_1',
      amount: 25,
      type: 'one-off',
      campaign_id: 'masjid-expansion',
      marketing_consent: true,
      source: { utmSource: 'facebook', landingPage: '/appeal' },
      donor: { id: 'aisha@example.com', firstName: 'Aisha', country: 'GB', type: 'personal' },
    });
  });

  it('records every subscription payment from invoice.paid', async () => {
    await recordStripeEvent(
      event('invoice.paid', {
        id: 'in_1',
        amount_paid: 1000,
        customer_email: 'aisha@example.com',
        parent: { subscription_details: { subscription: 'sub_1', metadata: meta } },
      }),
    );
    expect(writes[0]!.row).toMatchObject({
      payment_ref: 'in_1',
      payment_intent: 'pi_renewal',
      amount: 10,
      type: 'recurring',
      frequency: 'monthly',
      subscription_id: 'sub_1',
      subscription_status: 'active',
    });
    expect(writes[1]).toMatchObject({ op: 'update', where: ['subscription_id', 'sub_1'] });
  });

  it('ignores payments that are not ours, unpaid, or card set-ups', async () => {
    await recordStripeEvent(
      event('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'paid',
        metadata: {},
      }),
    );
    await recordStripeEvent(
      event('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'unpaid',
        metadata: meta,
      }),
    );
    await recordStripeEvent(event('checkout.session.completed', { mode: 'setup', metadata: meta }));
    await recordStripeEvent(event('invoice.paid', { id: 'in_2', amount_paid: 500, parent: null }));
    expect(writes).toHaveLength(0);
  });

  it('marks full refunds, failed renewals and cancellations', async () => {
    await recordStripeEvent(
      event('charge.refunded', { payment_intent: 'pi_1', amount: 2500, amount_refunded: 2500 }),
    );
    await recordStripeEvent(
      event('charge.refunded', { payment_intent: 'pi_2', amount: 2500, amount_refunded: 1000 }),
    );
    await recordStripeEvent(
      event('invoice.payment_failed', {
        parent: { subscription_details: { subscription: 'sub_1' } },
      }),
    );
    await recordStripeEvent(event('customer.subscription.deleted', { id: 'sub_1' }));
    expect(writes).toEqual([
      {
        op: 'update',
        table: 'donations',
        row: { status: 'refunded' },
        where: ['payment_intent', 'pi_1'],
      },
      {
        op: 'update',
        table: 'donations',
        row: { subscription_status: 'past_due' },
        where: ['subscription_id', 'sub_1'],
      },
      {
        op: 'update',
        table: 'donations',
        row: { subscription_status: 'cancelled' },
        where: ['subscription_id', 'sub_1'],
      },
    ]);
  });
});

describe('the mailing list ("Keep me updated")', () => {
  const oneOff = (metadata: Record<string, string>, created = 1_791_000_000) =>
    ({
      type: 'checkout.session.completed',
      created,
      livemode: true,
      data: {
        object: {
          id: 'cs_1',
          mode: 'payment',
          payment_status: 'paid',
          payment_intent: 'pi_1',
          amount_total: 2500,
          customer_details: { email: 'Aisha@Example.com ' },
          metadata,
        },
      },
    }) as unknown as Stripe.Event;

  it('adds a donor who opted in, with the record of consent', async () => {
    await recordStripeEvent(oneOff({ ...meta, frequency: 'one-off' }));
    expect(listWrites()).toHaveLength(1);
    expect(listWrites()[0]!.row).toMatchObject({
      email: 'aisha@example.com',
      first_name: 'Aisha',
      last_name: 'Khan',
      city: 'Leeds',
      country: 'GB',
      subscribed: true,
      unsubscribed_at: null,
      consented_at: new Date(1_791_000_000 * 1000).toISOString(),
      consent_campaign_id: 'masjid-expansion',
      consent_ref: 'pi_1',
      livemode: true,
    });
    expect(listWrites()[0]!.row!.consent_text).toMatch(/^Keep me updated\./);
  });

  it('leaves the list alone when the box was not ticked', async () => {
    await recordStripeEvent(oneOff({ ...meta, marketing_consent: 'no' }));
    expect(listWrites()).toHaveLength(0);
    expect(donationWrites()).toHaveLength(1);
  });

  it('never lets an older event undo a later unsubscribe', async () => {
    listed = { consented_at: '2026-01-01T00:00:00Z', unsubscribed_at: '2026-12-01T00:00:00Z' };
    await recordStripeEvent(oneOff(meta, Date.parse('2026-11-01T00:00:00Z') / 1000));
    expect(listWrites()).toHaveLength(0);
    // A newer opt-in subscribes them again.
    await recordStripeEvent(oneOff(meta, Date.parse('2026-12-02T00:00:00Z') / 1000));
    expect(listWrites()).toHaveLength(1);
  });

  it('takes consent from the first regular payment only, not renewals', async () => {
    const invoice = (billing_reason: string) =>
      event('invoice.paid', {
        id: 'in_1',
        amount_paid: 1000,
        billing_reason,
        customer_email: 'aisha@example.com',
        parent: { subscription_details: { subscription: 'sub_1', metadata: meta } },
      });
    await recordStripeEvent(invoice('subscription_cycle'));
    expect(listWrites()).toHaveLength(0);
    await recordStripeEvent(invoice('subscription_create'));
    expect(listWrites()).toHaveLength(1);
    expect(listWrites()[0]!.row).toMatchObject({ consent_ref: 'in_1' });
  });

  it("takes a daily cause's consent when the card is saved", async () => {
    const daily = { ...meta, giving_kind: 'daily' };
    await recordStripeEvent(
      event('checkout.session.completed', {
        id: 'cs_daily',
        mode: 'setup',
        status: 'complete',
        metadata: daily,
      }),
    );
    expect(donationWrites()).toHaveLength(0);
    expect(listWrites()[0]!.row).toMatchObject({
      email: 'aisha@example.com',
      consent_ref: 'cs_daily',
    });
    // Its nightly invoices don't touch the list.
    await recordStripeEvent(
      event('invoice.paid', {
        id: 'in_night_1',
        amount_paid: 500,
        billing_reason: 'subscription_create',
        parent: { subscription_details: { subscription: 'sub_d', metadata: daily } },
      }),
    );
    expect(listWrites()).toHaveLength(1);
  });
});

describe('recording Gift Aid', () => {
  it('records the declaration, when it was made and its wording with the payment', async () => {
    await recordStripeEvent(
      event('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'paid',
        payment_intent: 'pi_ga',
        amount_total: 5000,
        metadata: {
          ...meta,
          frequency: 'one-off',
          gift_aid: 'yes',
          gift_aid_declared_at: '2026-10-29T18:00:00.000Z',
        },
      }),
    );
    expect(donationWrites()[0]!.row).toMatchObject({
      gift_aid: true,
      gift_aid_declared_at: '2026-10-29T18:00:00.000Z',
      gift_aid_declaration: expect.stringContaining('I am a UK taxpayer'),
    });
  });

  it('carries a regular gift’s declaration onto every payment', async () => {
    await recordStripeEvent(
      event('invoice.paid', {
        id: 'in_ga',
        amount_paid: 2000,
        billing_reason: 'subscription_cycle',
        customer_email: 'aisha@example.com',
        parent: {
          subscription_details: {
            subscription: 'sub_ga',
            metadata: { ...meta, gift_aid: 'yes', gift_aid_declared_at: '2026-10-01T09:00:00Z' },
          },
        },
      }),
    );
    expect(donationWrites()[0]!.row).toMatchObject({ gift_aid: true, payment_ref: 'in_ga' });
  });

  it('records no Gift Aid without a declaration, or for an organisation', async () => {
    for (const m of [
      { ...meta, frequency: 'one-off' },
      { ...meta, frequency: 'one-off', donor_type: 'organisation', gift_aid: 'yes' },
    ])
      await recordStripeEvent(
        event('checkout.session.completed', {
          mode: 'payment',
          payment_status: 'paid',
          payment_intent: `pi_${m.donor_type}`,
          amount_total: 1000,
          metadata: m,
        }),
      );
    for (const w of donationWrites())
      expect(w.row).toMatchObject({
        gift_aid: false,
        gift_aid_declared_at: null,
        gift_aid_declaration: null,
      });
  });
});
