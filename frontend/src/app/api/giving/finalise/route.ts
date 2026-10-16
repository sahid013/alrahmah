import { NextResponse, type NextRequest } from 'next/server';
import { DonationInputError, finaliseDailyGiving } from '@/lib/giving/stripe-server';

/**
 * POST { sessionId } after a daily cause's card is saved → { plan }: schedules one charge per
 * night/day. Idempotent; the webhook (checkout.session.completed) does the same as a backup.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { sessionId?: unknown };
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  if (!sessionId.startsWith('cs_'))
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const plan = await finaliseDailyGiving(sessionId);
    if (!plan) return NextResponse.json({ error: 'Not a daily donation.' }, { status: 400 });
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof DonationInputError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(
      '[giving] could not schedule daily donation',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Your card was saved, but we could not schedule the donations. Please contact us.' },
      { status: 500 },
    );
  }
}
