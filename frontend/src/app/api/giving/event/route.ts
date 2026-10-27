import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { loadDonations } from '@/lib/donations/repository';
import { currentStripeMode } from '@/lib/giving/stripe-mode';
import { donationParams } from '@/lib/giving/tracking';
import { amountSchema, donorFields, sourceSchema } from '@/lib/giving/types';
import { visitFrom } from '@/lib/giving/visit';
import { sendMetaEventSafely } from '@/lib/meta/capi';
import { userData } from '@/lib/meta/user-data';

/**
 * POST from the donation form at steps 1 and 2 → the server copy of InitiateCheckout /
 * AddPaymentInfo for Meta, with the same event_id as the browser event (Meta keeps one). The
 * amount is checked against the form's limits and the cause must exist; only same-site requests, and only
 * donors with Marketing consent, are sent. Always answers 204: the form never waits on it.
 */
const bodySchema = z.object({
  event: z.enum(['InitiateCheckout', 'AddPaymentInfo']),
  eventId: z.string().min(1).max(100),
  donation: amountSchema,
  donor: donorFields.partial().optional(),
  source: sourceSchema.optional(),
});

export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return done;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return done;
  const { event, eventId, donation, donor, source } = parsed.data;

  const visit = visitFrom(request.headers, source);
  if (!visit.consent) return done;
  const program = (await loadDonations()).programs.find((p) => p.id === donation.campaignId);
  if (!program || !Number.isFinite(donation.amount)) return done;

  await sendMetaEventSafely(
    {
      event_name: event,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: `${request.nextUrl.origin}/donate/${program.id}`,
      user_data: userData(
        {
          email: donor?.email,
          phone: donor?.phone,
          firstName: donor?.firstName,
          lastName: donor?.lastName,
          city: donor?.city,
          postcode: donor?.postcode,
          country: donor?.country,
          externalId: donor?.email?.toLowerCase(),
        },
        visit.browser,
      ),
      custom_data: {
        ...donationParams(program.id, program.giving, donation.frequency, donation.amount),
      },
    },
    (await currentStripeMode()) === 'live',
  );
  return done;
}
