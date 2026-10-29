import type Stripe from 'stripe';
import { ThankYou } from '@/components/giving/thank-you';
import { TrackEvent } from '@/components/giving/track-event';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/config/site';
import type { DonationProgram } from '@/lib/donations/types';
import { loadDonations, loadVisibleDonations } from '@/lib/donations/repository';
import { nextPaymentDate, type DonationConfirmation } from '@/lib/giving/confirmation';
import { referenceFromSession } from '@/lib/giving/payments';
import type { DailyPlan } from '@/lib/giving/schedule';
import { finaliseDailyGiving } from '@/lib/giving/stripe-server';
import { completionEvent, paymentMethodParam, type TrackingEvent } from '@/lib/giving/tracking';
import { modeOfSession, stripeFor } from '@/lib/giving/stripe-mode';
import type { Frequency } from '@/lib/giving/types';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Thank you',
  path: '/donate/complete',
  noindex: true,
});

/** The payment method a session was paid or saved with (cards: their Apple / Google Pay wallet). */
function paymentMethodOf(session: Stripe.Checkout.Session) {
  const pm = (v: string | Stripe.PaymentMethod | null | undefined) =>
    typeof v === 'object' ? v : null;
  const intent = typeof session.payment_intent === 'object' ? session.payment_intent : null;
  const setup = typeof session.setup_intent === 'object' ? session.setup_intent : null;
  const subscription = typeof session.subscription === 'object' ? session.subscription : null;
  const method =
    pm(intent?.payment_method) ??
    pm(setup?.payment_method) ??
    pm(subscription?.default_payment_method);
  return method ? paymentMethodParam(method.type, method.card?.wallet?.type) : 'card';
}

/** Purchase / Subscribe for a donor returning here, built from the session (null if not paid). */
function trackingEventFor(
  session: Stripe.Checkout.Session,
  program: DonationProgram,
  daily: DailyPlan | null,
): TrackingEvent | null {
  const meta = session.metadata ?? {};
  return completionEvent({
    sessionId: session.id,
    eventId: meta.event_id || `Purchase-${session.id}`,
    campaignId: program.id,
    giving: program.giving,
    frequency: (meta.frequency as Frequency) ?? 'one-off',
    amount: daily ? daily.amount : (session.amount_total ?? 0) / 100,
    count: daily?.count,
    method: paymentMethodOf(session),
  });
}

/**
 * Where Stripe returns donors after a redirect-based step (e.g. bank authentication).
 * Shows the session's real status; the donation itself is recorded by the webhook. For daily
 * causes and Jumu'ah giving (card saved, nothing taken yet) it also makes sure the charges are
 * scheduled.
 * A successful instant payment also sends its Purchase / Subscribe event to Tag Manager.
 */
export default async function DonateCompletePage({ searchParams }: PageProps<'/donate/complete'>) {
  const { session_id } = await searchParams;
  const id =
    typeof session_id === 'string' && session_id.startsWith('cs_') ? session_id : undefined;
  const session = id
    ? await Promise.resolve()
        .then(() =>
          stripeFor(modeOfSession(id)).checkout.sessions.retrieve(id, {
            expand: [
              'payment_intent.payment_method',
              'setup_intent.payment_method',
              'subscription.default_payment_method',
            ],
          }),
        )
        .catch(() => null)
    : null;
  const daily =
    session?.mode === 'setup' && session.status === 'complete'
      ? await finaliseDailyGiving(session.id).catch(() => null)
      : null;
  const paid = daily
    ? true
    : session?.status === 'complete' &&
      session.mode !== 'setup' &&
      session.payment_status !== 'unpaid';
  const meta = session?.metadata ?? {};
  const program = paid
    ? (await loadDonations()).programs.find((p) => p.id === meta.campaign_id)
    : undefined;
  // Direct Debit is still processing here (unpaid), so it gets no event until the server's.
  const event = session && program ? trackingEventFor(session, program, daily) : null;
  const frequency = (meta.frequency as Frequency) || 'one-off';
  const confirmation: DonationConfirmation | null =
    session && program
      ? {
          firstName: meta.donor_first_name || undefined,
          email: meta.donor_email || session.customer_details?.email || undefined,
          amount: daily ? daily.amount : (session.amount_total ?? 0) / 100,
          frequency,
          people: Number(meta.people) || undefined,
          reference: referenceFromSession(session.id),
          plan: daily ?? undefined,
          // Cards saved for later (daily, Jumu'ah) show their first payment instead.
          nextPayment: daily
            ? undefined
            : nextPaymentDate(frequency, new Date(session.created * 1000)),
        }
      : null;

  if (program && confirmation)
    return (
      <div className="bg-primary-950 [color-scheme:dark]">
        <Container className="max-w-3xl py-20 lg:py-28">
          {event && <TrackEvent event={event} />}
          <ThankYou
            pageHeading
            confirmation={confirmation}
            program={program}
            makeMonthly={{ href: `/donate/${program.id}?frequency=monthly` }}
            canChangeCause={(await loadVisibleDonations()).programs.length > 1}
          />
        </Container>
      </div>
    );

  return (
    <div className="bg-white">
      <Container className="max-w-3xl py-20 lg:py-28">
        <div className="space-y-6">
          <h1 className="text-title-3xl leading-none text-primary-900">Payment not completed</h1>
          <p className="text-lg text-neutral-600">
            Your donation didn&apos;t go through and you have not been charged. Please try again.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href={siteConfig.links.donations} variant="outline">
            Back to donations
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
