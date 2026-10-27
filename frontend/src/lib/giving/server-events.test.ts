import type Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A stand-in for Stripe: payment methods, invoice payments and checkout sessions.
const updates: { id: string; metadata: Record<string, string> }[] = [];
vi.mock('server-only', () => ({}));
vi.mock('./stripe-mode', () => ({
  stripeFor: () => ({
    paymentIntents: {
      retrieve: () =>
        Promise.resolve({
          payment_method: { type: 'card', card: { wallet: { type: 'apple_pay' } } },
        }),
      update: (id: string, p: { metadata: Record<string, string> }) => {
        updates.push({ id, metadata: p.metadata });
        return Promise.resolve({});
      },
    },
    setupIntents: { retrieve: () => Promise.resolve({ payment_method: { type: 'card' } }) },
    invoicePayments: {
      list: () => Promise.resolve({ data: [{ payment: { payment_intent: 'pi_1' } }] }),
    },
    checkout: {
      sessions: { list: () => Promise.resolve({ data: [{ id: 'cs_live_aaaaRFXENE31' }] }) },
    },
  }),
}));

const { serverEventFor } = await import('./server-events');

const meta = {
  campaign_id: 'masjid-expansion',
  frequency: 'monthly',
  cause: 'masjid_expansion',
  donation_type: 'monthly',
  event_id: 'uuid-1',
  consent_status: 'yes',
  event_source_url: 'https://www.alrahmahmasjid.co.uk/donate/masjid-expansion',
  donor_email: 'aisha@example.com',
  donor_first_name: 'Aisha',
  donor_last_name: 'Khan',
  donor_phone: '07700 900133',
  donor_city: 'Leeds',
  donor_postcode: 'LS7 1AB',
  donor_country_code: 'GB',
  fbp: 'fb.1.1.99',
  client_ip_address: '203.0.113.9',
};

const stripeEvent = (type: string, object: unknown) =>
  ({ type, livemode: true, created: 1793000000, data: { object } }) as unknown as Stripe.Event;

const invoice = (billing_reason: string, m: Record<string, string> = meta) =>
  stripeEvent('invoice.paid', {
    id: 'in_1',
    amount_paid: 2500,
    billing_reason,
    customer: 'cus_1',
    customer_email: 'aisha@example.com',
    parent: { subscription_details: { subscription: 'sub_1', metadata: m } },
  });

beforeEach(() => {
  updates.length = 0;
});

describe('serverEventFor', () => {
  it('sends a Purchase for a paid one-off gift, with the shared event_id', async () => {
    const result = await serverEventFor(
      stripeEvent('checkout.session.completed', {
        id: 'cs_live_bbbbONEOFF01',
        mode: 'payment',
        payment_status: 'paid',
        amount_total: 5000,
        payment_intent: 'pi_1',
        customer: 'cus_1',
        customer_details: { email: 'aisha@example.com' },
        metadata: { ...meta, frequency: 'one-off', donation_type: 'one_off' },
      }),
    );
    expect(result?.live).toBe(true);
    expect(result?.event).toMatchObject({
      event_name: 'Purchase',
      event_id: 'uuid-1',
      event_time: 1793000000,
      action_source: 'website',
      event_source_url: meta.event_source_url,
      custom_data: {
        value: 50,
        currency: 'GBP',
        cause: 'masjid_expansion',
        donation_type: 'one_off',
        payment_sequence: 'first',
        annual_value: 50,
        payment_method: 'apple_pay',
        order_id: 'AR-ONEOFF01',
      },
    });
    expect(result?.event.user_data).toMatchObject({ fbp: 'fb.1.1.99' });
    expect(result?.event.user_data.em).toHaveLength(1);
  });

  it('waits for Direct Debit to clear (no event while the session is unpaid)', async () => {
    const result = await serverEventFor(
      stripeEvent('checkout.session.completed', {
        id: 'cs_live_x',
        mode: 'payment',
        payment_status: 'unpaid',
        metadata: meta,
      }),
    );
    expect(result).toBeNull();
  });

  it('sends a Purchase for the first monthly payment, and tags the payment in Stripe', async () => {
    const result = await serverEventFor(invoice('subscription_create'));
    expect(result?.event).toMatchObject({
      event_name: 'Purchase',
      event_id: 'uuid-1',
      custom_data: { value: 25, annual_value: 300, order_id: 'AR-RFXENE31' },
    });
    expect(updates).toEqual([
      {
        id: 'pi_1',
        metadata: {
          cause: 'masjid_expansion',
          donation_type: 'monthly',
          payment_sequence: 'first',
        },
      },
    ]);
  });

  it('sends a DonationRenewal for later payments, keyed by the invoice', async () => {
    const result = await serverEventFor(invoice('subscription_cycle'));
    expect(result?.event).toMatchObject({
      event_name: 'DonationRenewal',
      event_id: 'in_1',
      action_source: 'system_generated',
      custom_data: { value: 25, payment_sequence: 'renewal', order_id: 'pi_1' },
    });
    expect(result?.event.custom_data).not.toHaveProperty('annual_value');
  });

  it('treats every payment of a daily cause as a renewal', async () => {
    const daily = {
      ...meta,
      giving_kind: 'daily',
      frequency: 'daily',
      donation_type: 'nightly_10',
    };
    const result = await serverEventFor(invoice('subscription_create', daily));
    expect(result?.event.event_name).toBe('DonationRenewal');
  });

  it('sends a Subscribe with the total pledged when a daily card is saved', async () => {
    const result = await serverEventFor(
      stripeEvent('checkout.session.completed', {
        id: 'cs_live_ccccDAILY001',
        mode: 'setup',
        setup_intent: 'seti_1',
        customer: 'cus_1',
        metadata: { ...meta, giving_kind: 'daily', donation_type: 'nightly_10' },
      }),
      { amount: 5, count: 10, firstCharge: '', lastCharge: '' },
    );
    expect(result?.event).toMatchObject({
      event_name: 'Subscribe',
      event_id: 'uuid-1',
      custom_data: { value: 50, donation_type: 'nightly_10', payment_method: 'card' },
    });
  });

  it('sends declined donors the same event without email, phone or other details', async () => {
    const result = await serverEventFor(
      invoice('subscription_cycle', { ...meta, consent_status: 'no', fbp: '' }),
    );
    expect(result?.event).toMatchObject({
      event_name: 'DonationRenewal',
      event_id: 'in_1',
      custom_data: { value: 25, cause: 'masjid_expansion' },
    });
    expect(result?.event.user_data).toEqual({ client_ip_address: '203.0.113.9' });
  });

  it('skips donations without our metadata, or from before the visit was saved', async () => {
    expect(await serverEventFor(invoice('subscription_cycle', {}))).toBeNull();
    const older: Record<string, string> = { ...meta };
    delete older.consent_status;
    expect(await serverEventFor(invoice('subscription_cycle', older))).toBeNull();
  });
});
