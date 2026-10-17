import 'server-only';
import Stripe from 'stripe';
import { adminClient } from '@/lib/supabase/server';

/**
 * Live or test payments, switchable instantly. Production holds both key sets
 * (`STRIPE_LIVE_*` and `STRIPE_TEST_*`, same Stripe account); the mode for new donations is the
 * `stripe_mode` row in Supabase `site_settings`, read on every new payment session, so
 *   update site_settings set value = 'live', updated_at = now() where key = 'stripe_mode';
 * takes effect on the next donation, with no redeploy. Anything already started (a session id,
 * a webhook event) carries its own mode and is handled with that mode's keys.
 *
 * Environments with one key set (Preview, local: `STRIPE_SECRET_KEY` +
 * `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) use it for whichever mode it belongs to.
 */
export type StripeMode = 'live' | 'test';

export interface StripeKeys {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
  /** Payment method configurations ("Al-Rahmah website", and without Direct Debit for daily causes). */
  paymentMethodConfig?: string;
  paymentMethodConfigDaily?: string;
}

const env = (name: string) => process.env[name] || undefined;

export function keysFor(mode: StripeMode): StripeKeys | null {
  const prefix = mode === 'live' ? 'STRIPE_LIVE_' : 'STRIPE_TEST_';
  const secretKey = env(`${prefix}SECRET_KEY`);
  const publishableKey = env(`${prefix}PUBLISHABLE_KEY`);
  if (secretKey && publishableKey)
    return {
      secretKey,
      publishableKey,
      webhookSecret: env(`${prefix}WEBHOOK_SECRET`),
      paymentMethodConfig: env(`${prefix}PMC`),
      paymentMethodConfigDaily: env(`${prefix}PMC_DAILY`),
    };

  const single = env('STRIPE_SECRET_KEY');
  const singlePublishable = env('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  if (single && singlePublishable && modeOfKey(single) === mode)
    return {
      secretKey: single,
      publishableKey: singlePublishable,
      webhookSecret: env('STRIPE_WEBHOOK_SECRET'),
      paymentMethodConfig: env('STRIPE_PAYMENT_METHOD_CONFIG'),
      paymentMethodConfigDaily: env('STRIPE_PAYMENT_METHOD_CONFIG_DAILY'),
    };
  return null;
}

/** sk_live_… / rk_test_… → its mode. */
const modeOfKey = (key: string): StripeMode | null =>
  key.match(/^[sr]k_(live|test)_/)?.[1] as StripeMode | null;

/** The mode a Checkout Session id belongs to (cs_test_… / cs_live_…). */
export const modeOfSession = (sessionId: string): StripeMode =>
  sessionId.startsWith('cs_live_') ? 'live' : 'test';

const clients = new Map<string, Stripe>();

/** Stripe client for a mode. Throws if that mode has no keys here. */
export function stripeFor(mode: StripeMode): Stripe {
  const keys = keysFor(mode);
  if (!keys) throw new Error(`Stripe is not configured for ${mode} payments.`);
  let client = clients.get(keys.secretKey);
  if (!client) {
    client = new Stripe(keys.secretKey);
    clients.set(keys.secretKey, client);
  }
  return client;
}

/**
 * Mode for a new donation: the Supabase switch, else `STRIPE_MODE`, else live when live keys
 * exist. A mode without keys here falls back to the one that has them.
 */
export async function currentStripeMode(): Promise<StripeMode> {
  let mode: StripeMode | undefined;
  try {
    const { data, error } = await adminClient()
      .from('site_settings')
      .select('value')
      .eq('key', 'stripe_mode')
      .maybeSingle<{ value: string }>();
    if (error) throw new Error(error.message);
    if (data?.value === 'live' || data?.value === 'test') mode = data.value;
  } catch (error) {
    console.error(
      '[stripe] could not read stripe_mode; using STRIPE_MODE',
      error instanceof Error ? error.message : error,
    );
  }
  const fallback = env('STRIPE_MODE');
  mode ??= fallback === 'live' || fallback === 'test' ? fallback : undefined;
  mode ??= keysFor('live') ? 'live' : 'test';
  if (keysFor(mode)) return mode;
  return mode === 'live' ? 'test' : 'live';
}

/** Every webhook signing secret configured here (live and test endpoints can both post to us). */
export function webhookSecrets(): string[] {
  const secrets = [keysFor('live')?.webhookSecret, keysFor('test')?.webhookSecret];
  return [...new Set(secrets.filter((s): s is string => !!s))];
}
