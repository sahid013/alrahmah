import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const setting = vi.hoisted(() => ({ value: 'test' as string | null, fail: false }));
vi.mock('@/lib/supabase/server', () => ({
  adminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve(
              setting.fail
                ? { data: null, error: { message: 'offline' } }
                : { data: setting.value ? { value: setting.value } : null, error: null },
            ),
        }),
      }),
    }),
  }),
}));

const { currentStripeMode, keysFor, modeOfSession, webhookSecrets } = await import('./stripe-mode');

const BOTH = {
  STRIPE_LIVE_SECRET_KEY: 'sk_live_a',
  STRIPE_LIVE_PUBLISHABLE_KEY: 'pk_live_a',
  STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_live',
  STRIPE_LIVE_PMC: 'pmc_live',
  STRIPE_TEST_SECRET_KEY: 'sk_test_a',
  STRIPE_TEST_PUBLISHABLE_KEY: 'pk_test_a',
  STRIPE_TEST_WEBHOOK_SECRET: 'whsec_test',
};
const stub = (vars: Record<string, string>) =>
  Object.entries(vars).forEach(([k, v]) => vi.stubEnv(k, v));

beforeEach(() => {
  setting.value = 'test';
  setting.fail = false;
  for (const name of [
    ...Object.keys(BOTH),
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_MODE',
  ])
    vi.stubEnv(name, '');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe('keysFor', () => {
  it('picks each mode’s own key set', () => {
    stub(BOTH);
    expect(keysFor('live')).toMatchObject({
      secretKey: 'sk_live_a',
      paymentMethodConfig: 'pmc_live',
    });
    expect(keysFor('test')).toMatchObject({ secretKey: 'sk_test_a', publishableKey: 'pk_test_a' });
  });

  it('uses a single key set only for the mode it belongs to (Preview, local)', () => {
    stub({ STRIPE_SECRET_KEY: 'sk_test_sandbox', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_s' });
    expect(keysFor('test')?.secretKey).toBe('sk_test_sandbox');
    expect(keysFor('live')).toBeNull();
  });
});

describe('currentStripeMode', () => {
  it('follows the Supabase switch, instantly', async () => {
    stub(BOTH);
    expect(await currentStripeMode()).toBe('test');
    setting.value = 'live';
    expect(await currentStripeMode()).toBe('live');
  });

  it('falls back to STRIPE_MODE when Supabase is unreachable', async () => {
    stub({ ...BOTH, STRIPE_MODE: 'test' });
    setting.fail = true;
    expect(await currentStripeMode()).toBe('test');
  });

  it('never picks a mode without keys', async () => {
    stub({ STRIPE_SECRET_KEY: 'sk_test_sandbox', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_s' });
    setting.value = 'live';
    expect(await currentStripeMode()).toBe('test');
  });
});

it('reads the mode from a session id and accepts both endpoints’ webhooks', () => {
  stub(BOTH);
  expect(modeOfSession('cs_live_123')).toBe('live');
  expect(modeOfSession('cs_test_123')).toBe('test');
  expect(webhookSecrets()).toEqual(['whsec_live', 'whsec_test']);
});
