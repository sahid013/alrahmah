import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/config/site';
import { referenceFromSession } from '@/lib/giving/payments';
import { dateRange } from '@/lib/giving/schedule';
import { finaliseDailyGiving } from '@/lib/giving/stripe-server';
import { modeOfSession, stripeFor } from '@/lib/giving/stripe-mode';
import { amountWithFrequency, type Frequency } from '@/lib/giving/types';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Thank you',
  path: '/donate/complete',
  noindex: true,
});

/**
 * Where Stripe returns donors after a redirect-based step (e.g. bank authentication).
 * Shows the session's real status; the donation itself is recorded by the webhook. For daily
 * causes (card saved, nothing taken yet) it also makes sure the nightly/daily charges are scheduled.
 */
export default async function DonateCompletePage({ searchParams }: PageProps<'/donate/complete'>) {
  const { session_id } = await searchParams;
  const id =
    typeof session_id === 'string' && session_id.startsWith('cs_') ? session_id : undefined;
  const session = id
    ? await Promise.resolve()
        .then(() => stripeFor(modeOfSession(id)).checkout.sessions.retrieve(id))
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

  return (
    <div className="bg-white">
      <Container className="max-w-3xl py-20 lg:py-28">
        {paid && session ? (
          <div className="space-y-8">
            <p className="font-script text-4xl text-secondary-700">Jazakum Allahu khairan</p>
            <h1 className="text-title-3xl leading-none text-primary-900 sm:text-title-4xl">
              Thank you{meta.donor_first_name ? `, ${meta.donor_first_name}` : ''}
            </h1>
            {daily ? (
              <p className="text-lg text-neutral-600">
                Your donation of{' '}
                <strong className="font-ui text-primary-900">
                  {amountWithFrequency(daily.amount, 'daily')}
                </strong>{' '}
                to{' '}
                <strong className="text-primary-900">
                  {meta.campaign_title ?? siteConfig.name}
                </strong>{' '}
                is set up: {daily.count} payments,{' '}
                {dateRange([new Date(daily.firstCharge), new Date(daily.lastCharge)])}. Nothing has
                been taken today.
              </p>
            ) : (
              <p className="text-lg text-neutral-600">
                Your donation of{' '}
                <strong className="font-ui text-primary-900">
                  {amountWithFrequency(
                    (session.amount_total ?? 0) / 100,
                    (meta.frequency as Frequency) ?? 'one-off',
                  )}
                </strong>{' '}
                to{' '}
                <strong className="text-primary-900">
                  {meta.campaign_title ?? siteConfig.name}
                </strong>{' '}
                has been received.
              </p>
            )}
            <p className="text-sm text-neutral-500">
              Reference:{' '}
              <span className="font-ui text-primary-900">{referenceFromSession(session.id)}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-title-3xl leading-none text-primary-900">Payment not completed</h1>
            <p className="text-lg text-neutral-600">
              Your donation didn&apos;t go through and you have not been charged. Please try again.
            </p>
          </div>
        )}
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href={siteConfig.links.donations} variant="outline">
            {paid ? 'More ways to give' : 'Back to donations'}
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
