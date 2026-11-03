import type Stripe from 'stripe';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Stand-ins: the failure counter in Supabase and Stripe's Checkout Sessions.
let failures = 0;
let status = 'open';
const expired: string[] = [];
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  adminClient: () => ({
    rpc: () => ({
      maybeSingle: () =>
        Promise.resolve({
          data: { failures: ++failures, checkout_session: 'cs_test_1', livemode: false },
          error: null,
        }),
    }),
  }),
}));
vi.mock('./stripe-mode', () => ({
  stripeFor: () => ({
    checkout: {
      sessions: {
        retrieve: (id: string) => Promise.resolve({ id, status }),
        expire: (id: string) => {
          expired.push(id);
          return Promise.resolve({});
        },
      },
    },
  }),
}));

const { failedAttemptOf, ipHashOf, MAX_FAILURES, noteFailedAttempt, verifyHuman } =
  await import('./protection');

const ours = { campaign_id: 'masjid-expansion', event_id: 'uuid-1' };
const event = (type: string, object: unknown) =>
  ({ type, livemode: true, created: 1793000000, data: { object } }) as unknown as Stripe.Event;

describe('failedAttemptOf', () => {
  it('counts a declined one-off payment and a card that could not be saved', () => {
    expect(failedAttemptOf(event('payment_intent.payment_failed', { metadata: ours }))).toBe(
      'uuid-1',
    );
    expect(failedAttemptOf(event('setup_intent.setup_failed', { metadata: ours }))).toBe('uuid-1');
  });

  it('counts a declined first weekly/monthly payment, not a later renewal', () => {
    const invoice = (billing_reason: string) =>
      event('invoice.payment_failed', {
        billing_reason,
        parent: { subscription_details: { metadata: ours } },
      });
    expect(failedAttemptOf(invoice('subscription_create'))).toBe('uuid-1');
    expect(failedAttemptOf(invoice('subscription_cycle'))).toBeNull();
  });

  it("ignores the Stripe account's other payments and unrelated events", () => {
    expect(failedAttemptOf(event('payment_intent.payment_failed', { metadata: {} }))).toBeNull();
    expect(failedAttemptOf(event('invoice.paid', { metadata: ours }))).toBeNull();
  });
});

describe('verifyHuman', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('lets donations through where Turnstile is not set up', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(await verifyHuman(null, new Headers())).toBe(true);
  });

  it("needs Cloudflare's yes when it is", async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    expect(await verifyHuman(null, new Headers())).toBe(false);
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ success: false })));
    expect(await verifyHuman('bad', new Headers())).toBe(false);
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ success: true })));
    expect(await verifyHuman('good', new Headers())).toBe(true);
  });
});

describe('ipHashOf', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('hashes the IP (never stored in the clear), the same for the same visitor', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'key');
    const a = ipHashOf(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain('203');
    expect(ipHashOf(new Headers({ 'x-forwarded-for': '203.0.113.9' }))).toBe(a);
    expect(ipHashOf(new Headers())).toBeNull();
  });
});

describe('noteFailedAttempt', () => {
  const declined = event('payment_intent.payment_failed', { metadata: ours });

  it(`closes the payment session on the ${MAX_FAILURES}rd declined card, not before`, async () => {
    await noteFailedAttempt(declined);
    await noteFailedAttempt(declined);
    expect(expired).toEqual([]);
    await noteFailedAttempt(declined);
    expect(expired).toEqual(['cs_test_1']);
  });

  it('leaves a session that has already finished alone', async () => {
    status = 'complete';
    expired.length = 0;
    await noteFailedAttempt(declined);
    expect(expired).toEqual([]);
  });
});
