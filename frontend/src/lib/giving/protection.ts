import 'server-only';
import { createHmac } from 'node:crypto';
import type Stripe from 'stripe';
import { adminClient } from '@/lib/supabase/server';
import { stripeFor } from './stripe-mode';

/**
 * Protection against card-testing attacks on the donation form (marketing team, November 2026):
 * attackers use a form to try stolen card numbers, and enough declines can make Stripe restrict
 * the account. Three layers, all on the server:
 *
 *  1. CAPTCHA: Cloudflare Turnstile (no tracking cookies, so no consent needed). The payment step
 *     sends its token with the session request; no valid token, no Stripe session. Env:
 *     `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`; without the secret the check is
 *     skipped (local and preview), with a warning in the logs.
 *  2. Session limits: at most `LIMITS` payment sessions per visitor (keyed hash of the IP, never
 *     stored in the clear) in 10 minutes and in a day, in Supabase `payment_attempts`.
 *  3. Declined cards: the webhook counts failed attempts per session (`failedAttemptOf`), and
 *     after `MAX_FAILURES` the Checkout Session is closed, so the visitor has to start again
 *     (and pass 1 and 2 again).
 */
export const LIMITS = [
  { max: 5, minutes: 10 },
  { max: 20, minutes: 24 * 60 },
] as const;
export const MAX_FAILURES = 3;
/** Rows older than this are deleted as new ones are added. */
const KEEP_DAYS = 7;

export class TooManyAttemptsError extends Error {}

/** Keyed hash of the visitor's IP, only used for the limits. */
export function ipHashOf(headers: Headers): string | null {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || null;
  const key = process.env.SUPABASE_SECRET_KEY;
  return ip && key ? createHmac('sha256', key).update(`donate:${ip}`).digest('hex') : null;
}

/** Whether the Turnstile token is valid (true when Turnstile isn't set up here). */
export async function verifyHuman(token: string | null, headers: Headers): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.VERCEL_ENV === 'production')
      console.warn('[giving] TURNSTILE_SECRET_KEY is not set: donation CAPTCHA is off');
    return true;
  }
  if (!token) return false;
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, ...(ip && { remoteip: ip }) }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    // Cloudflare unreachable: let the donation through rather than block every donor; the
    // session limits still apply.
    console.error(
      '[giving] Turnstile check failed',
      error instanceof Error ? error.message : error,
    );
    return true;
  }
}

/** Throws `TooManyAttemptsError` when this visitor has started too many sessions. */
export async function checkAttemptLimits(ipHash: string | null) {
  if (!ipHash) return;
  const db = adminClient();
  for (const { max, minutes } of LIMITS) {
    const since = new Date(Date.now() - minutes * 60_000).toISOString();
    const { count, error } = await db
      .from('payment_attempts')
      .select('event_id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if (error) {
      // Never block donors because the check itself failed.
      console.error('[giving] could not check payment attempts', error.message);
      return;
    }
    if ((count ?? 0) >= max) throw new TooManyAttemptsError();
  }
}

/** Saves a new payment session (for the limits and the declined-card count). */
export async function recordAttempt(a: {
  eventId: string;
  ipHash: string | null;
  sessionId: string;
  livemode: boolean;
}) {
  const db = adminClient();
  const { error } = await db.from('payment_attempts').insert({
    event_id: a.eventId,
    ip_hash: a.ipHash,
    checkout_session: a.sessionId,
    livemode: a.livemode,
  });
  if (error) console.error('[giving] could not record payment attempt', error.message);
  const old = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString();
  await db.from('payment_attempts').delete().lt('created_at', old);
}

type Meta = Record<string, string>;
const ours = (m: Meta | null | undefined) => (m?.campaign_id && m.event_id ? m.event_id : null);

/**
 * The donation (`event_id`) a failed payment attempt belongs to, or null: a declined one-off
 * payment, a card that couldn't be saved (daily causes, Jumu'ah giving), or a declined first
 * weekly/monthly payment. Renewals that fail later aren't attempts at the form. Payments from the
 * Stripe account's other integrations carry none of our metadata and are ignored.
 */
export function failedAttemptOf(event: Stripe.Event): string | null {
  switch (event.type) {
    case 'payment_intent.payment_failed':
      return ours(event.data.object.metadata as Meta);
    case 'setup_intent.setup_failed':
      return ours(event.data.object.metadata as Meta);
    case 'invoice.payment_failed': {
      const inv = event.data.object;
      if (inv.billing_reason !== 'subscription_create') return null;
      return ours(inv.parent?.subscription_details?.metadata as Meta);
    }
    default:
      return null;
  }
}

/** Counts a failed attempt; closes the payment session after `MAX_FAILURES`. Never throws. */
export async function noteFailedAttempt(event: Stripe.Event) {
  const eventId = failedAttemptOf(event);
  if (!eventId) return;
  try {
    const { data, error } = await adminClient()
      .rpc('note_payment_failure', { p_event_id: eventId })
      .maybeSingle<{ failures: number; checkout_session: string; livemode: boolean }>();
    if (error) throw new Error(error.message);
    if (!data || data.failures < MAX_FAILURES) return;
    const stripe = stripeFor(data.livemode ? 'live' : 'test');
    const session = await stripe.checkout.sessions.retrieve(data.checkout_session);
    if (session.status !== 'open') return;
    await stripe.checkout.sessions.expire(session.id);
    console.warn('[giving] payment session closed after declined attempts', session.id);
  } catch (error) {
    console.error(
      '[giving] could not count failed attempt',
      error instanceof Error ? error.message : error,
    );
  }
}
