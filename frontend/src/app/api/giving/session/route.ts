import { NextResponse, type NextRequest } from 'next/server';
import {
  checkAttemptLimits,
  ipHashOf,
  recordAttempt,
  TooManyAttemptsError,
  verifyHuman,
} from '@/lib/giving/protection';
import { modeOfSession } from '@/lib/giving/stripe-mode';
import { createDonationSession, DonationInputError } from '@/lib/giving/stripe-server';

/**
 * POST a DonationRequest → { clientSecret, publishableKey, eventId } for the on-page Stripe Payment
 * Element (the key matches the session's mode, live or test; eventId is for Purchase/Subscribe).
 * Card-testing protection first (`lib/giving/protection.ts`): the Turnstile token (header
 * `x-turnstile-token`) must be valid and the visitor under the session limits.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!(await verifyHuman(request.headers.get('x-turnstile-token'), request.headers)))
    return NextResponse.json(
      { error: 'We could not check that you’re not a robot. Please try again.', captcha: true },
      { status: 403 },
    );
  const ipHash = ipHashOf(request.headers);
  try {
    await checkAttemptLimits(ipHash);
    const { clientSecret, publishableKey, eventId, sessionId } = await createDonationSession(
      body,
      request.nextUrl.origin,
      request.headers,
    );
    await recordAttempt({
      eventId,
      ipHash,
      sessionId,
      livemode: modeOfSession(sessionId) === 'live',
    });
    return NextResponse.json({ clientSecret, publishableKey, eventId });
  } catch (error) {
    if (error instanceof TooManyAttemptsError)
      return NextResponse.json(
        {
          error:
            'You’ve started several payments in a short time. Please wait a few minutes and try again, or contact us if you need help.',
        },
        { status: 429 },
      );
    if (error instanceof DonationInputError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(
      '[giving] could not create checkout session',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'We could not start the payment. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
