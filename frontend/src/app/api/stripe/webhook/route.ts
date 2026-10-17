import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { recordStripeEvent } from '@/lib/giving/record';
import { DonationInputError, finaliseDailyGiving } from '@/lib/giving/stripe-server';
import { webhookSecrets } from '@/lib/giving/stripe-mode';

/**
 * Stripe webhook. Every event's signature is verified before use, against each configured
 * endpoint's signing secret: the account's live and test endpoints both post here, so switching
 * the payment mode never breaks either (see `lib/giving/stripe-mode.ts`).
 * Subscribe the endpoint to: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, invoice.paid, invoice.payment_failed, charge.refunded,
 * customer.subscription.deleted. Donations are recorded in Supabase (`lib/giving/record.ts`).
 */
export async function POST(request: NextRequest) {
  const secrets = webhookSecrets();
  const signature = request.headers.get('stripe-signature');
  if (!secrets.length) {
    console.error('[stripe] no webhook signing secret is set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event | undefined;
  for (const secret of secrets) {
    try {
      event = await Stripe.webhooks.constructEventAsync(payload, signature, secret);
      break;
    } catch {
      /* not this endpoint's secret: try the next */
    }
  }
  if (!event) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  // Daily causes: the card was saved; schedule the nightly/daily charges (backup for the browser,
  // which normally does this straight away; idempotent).
  if (event.type === 'checkout.session.completed' && event.data.object.mode === 'setup') {
    try {
      await finaliseDailyGiving(event.data.object.id);
    } catch (error) {
      // A closed cause won't succeed on retry; anything else returns 500 so Stripe retries.
      console.error(
        '[stripe] could not schedule daily donation',
        error instanceof Error ? error.message : error,
      );
      if (!(error instanceof DonationInputError))
        return NextResponse.json({ error: 'Scheduling failed' }, { status: 500 });
    }
  }

  try {
    await recordStripeEvent(event);
  } catch (error) {
    // 500 → Stripe retries the event later (recording is idempotent).
    console.error(
      '[stripe] could not record donation',
      event.type,
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: 'Recording failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
