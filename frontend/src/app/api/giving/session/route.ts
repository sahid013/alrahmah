import { NextResponse, type NextRequest } from 'next/server';
import { createDonationSession, DonationInputError } from '@/lib/giving/stripe-server';

/** POST a DonationRequest → { clientSecret } for the on-page Stripe Payment Element. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  try {
    const { clientSecret } = await createDonationSession(body, request.nextUrl.origin);
    return NextResponse.json({ clientSecret });
  } catch (error) {
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
