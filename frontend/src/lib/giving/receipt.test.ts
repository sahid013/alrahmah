import type Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/donations/repository', () => ({
  loadDonations: () =>
    Promise.resolve({
      programs: [{ id: 'last-10-nights', giving: { kind: 'daily', unit: 'night' } }],
    }),
}));
vi.mock('./stripe-mode', () => ({
  stripeFor: () => ({
    checkout: {
      sessions: { list: () => Promise.resolve({ data: [{ id: 'cs_live_aaaaRFXENE31' }] }) },
    },
  }),
}));

const { buildReceiptEmail, receiptFor, receiptRows } = await import('./receipt');

const meta = {
  campaign_id: 'masjid-expansion',
  campaign_title: 'Masjid Expansion',
  frequency: 'one-off',
  donor_email: 'aisha@example.com',
  donor_first_name: 'Aisha',
  donor_type: 'personal',
  gift_aid: 'no',
};
// 2 November 2026, 12:00 UK time.
const created = Date.UTC(2026, 10, 2, 12) / 1000;
const event = (type: string, object: unknown, livemode = true) =>
  ({ type, livemode, created, data: { object } }) as unknown as Stripe.Event;
const session = (o: Record<string, unknown>) =>
  event('checkout.session.completed', {
    id: 'cs_live_aaaaJYVPY5LV',
    mode: 'payment',
    payment_status: 'paid',
    amount_total: 5000,
    customer_details: { email: 'aisha@example.com' },
    metadata: meta,
    ...o,
  });

describe('receiptFor', () => {
  it('sends one for a paid one-off gift, keyed by its session', async () => {
    const found = await receiptFor(session({}));
    expect(found?.key).toBe('receipt-cs_live_aaaaJYVPY5LV');
    expect(found?.receipt).toMatchObject({
      to: 'aisha@example.com',
      reference: 'AR-JYVPY5LV',
      amount: 50,
      frequency: 'one-off',
      giftAid: false,
    });
  });

  it('waits for Direct Debit to clear, and skips payments made elsewhere', async () => {
    expect(await receiptFor(session({ payment_status: 'unpaid' }))).toBeNull();
    expect(await receiptFor(session({ metadata: {} }))).toBeNull();
    expect(await receiptFor(session({ mode: 'subscription' }))).toBeNull();
  });

  it('sends one for the first weekly/monthly payment only', async () => {
    const invoice = (billing_reason: string) =>
      event('invoice.paid', {
        id: 'in_1',
        amount_paid: 2000,
        billing_reason,
        customer_email: 'aisha@example.com',
        parent: {
          subscription_details: {
            subscription: 'sub_1',
            metadata: { ...meta, frequency: 'monthly' },
          },
        },
      });
    const first = await receiptFor(invoice('subscription_create'));
    expect(first?.key).toBe('receipt-in_1');
    expect(first?.receipt).toMatchObject({
      amount: 20,
      frequency: 'monthly',
      reference: 'AR-RFXENE31',
    });
    expect(await receiptFor(invoice('subscription_cycle'))).toBeNull();
  });

  it("sends one when a daily cause's card is saved, with the schedule", async () => {
    const plan = {
      amount: 5,
      count: 10,
      firstCharge: '2027-02-27T20:00:00.000Z',
      lastCharge: '2027-03-08T20:00:00.000Z',
    };
    const found = await receiptFor(
      session({
        mode: 'setup',
        amount_total: null,
        metadata: { ...meta, campaign_id: 'last-10-nights', giving_kind: 'daily' },
      }),
      plan,
    );
    expect(found?.receipt).toMatchObject({ plan, unit: 'night' });
    expect(receiptRows(found!.receipt)).toContainEqual([
      'Donation',
      '£5 each night for 10 nights (£50 in total)',
    ]);
  });
});

describe('buildReceiptEmail', () => {
  it('confirms the gift, with the Gift Aid declaration the donor agreed to', async () => {
    const found = await receiptFor(
      session({
        metadata: {
          ...meta,
          gift_aid: 'yes',
          gift_aid_declared_at: '2026-11-02T11:59:00.000Z',
          donor_first_name: 'Aisha <b>',
        },
      }),
    );
    const email = buildReceiptEmail(found!.receipt, { CONTACT_EMAIL_FROM: 'Site <w@x.uk>' });
    expect(email).toMatchObject({
      from: 'Site <w@x.uk>',
      to: ['aisha@example.com'],
      subject: 'Thank you for your donation to Al-Rahmah Masjid',
    });
    expect(email.text).toContain('Reference: AR-JYVPY5LV');
    expect(email.text).toContain("Gift Aid: Yes: we'll claim an extra £12.50 from HMRC");
    expect(email.text).toContain('I want to Gift Aid my donation');
    expect(email.text).toContain('on Monday 2 November 2026');
    // Donor-typed text is escaped in the HTML.
    expect(email.html).toContain('Aisha &#60;b&#62;');
    expect(email.html).not.toContain('Aisha <b>');
  });

  it('marks test payments and tells regular donors how to cancel', async () => {
    const found = await receiptFor(
      event(
        'invoice.paid',
        {
          id: 'in_2',
          amount_paid: 1000,
          billing_reason: 'subscription_create',
          customer_email: 'aisha@example.com',
          parent: {
            subscription_details: {
              subscription: 'sub_2',
              metadata: { ...meta, frequency: 'weekly' },
            },
          },
        },
        false,
      ),
    );
    const email = buildReceiptEmail(found!.receipt, {});
    expect(email.subject).toMatch(/^\[Test\] /);
    expect(email.text).toContain('Donation: £10 a week');
    expect(email.text).toContain('Next payment: Monday 9 November 2026');
    expect(email.text).toContain('To change or cancel your regular donation');
  });
});
