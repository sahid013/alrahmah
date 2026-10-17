import type Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stand-ins for the database and Stripe: capture what would be written.
const writes: { op: string; row?: Record<string, unknown>; where?: [string, string] }[] = [];
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  adminClient: () => ({
    from: () => ({
      upsert: (row: Record<string, unknown>) => {
        writes.push({ op: 'upsert', row });
        return Promise.resolve({ error: null });
      },
      update: (row: Record<string, unknown>) => ({
        eq: (column: string, value: string) => {
          writes.push({ op: 'update', row, where: [column, value] });
          return Promise.resolve({ error: null });
        },
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
});

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
    expect(writes).toHaveLength(1);
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
      { op: 'update', row: { status: 'refunded' }, where: ['payment_intent', 'pi_1'] },
      {
        op: 'update',
        row: { subscription_status: 'past_due' },
        where: ['subscription_id', 'sub_1'],
      },
      {
        op: 'update',
        row: { subscription_status: 'cancelled' },
        where: ['subscription_id', 'sub_1'],
      },
    ]);
  });
});
