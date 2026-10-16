import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { recordDonationEvent, toDonationEvent } from '@/lib/giving/fulfilment';
import { DonationInputError, finaliseDailyGiving, getStripe } from '@/lib/giving/stripe-server';

/**
 * Stripe webhook. Every event's signature is verified with STRIPE_WEBHOOK_SECRET before use.
 * Subscribe the endpoint to: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, invoice.paid, invoice.payment_failed, charge.refunded,
 * customer.subscription.deleted.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

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

  const donation = toDonationEvent(event);
  if (donation) await recordDonationEvent(donation);
  return NextResponse.json({ received: true });
}
