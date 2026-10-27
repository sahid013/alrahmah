import { ArrowRightIcon, WhatsAppIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import type { DonationProgram } from '@/lib/donations/types';
import {
  formatLongDate,
  whatsappShareUrl,
  type DonationConfirmation,
} from '@/lib/giving/confirmation';
import { formatClock } from '@/lib/giving/schedule';
import { amountWithFrequency, FREQUENCY_LABELS, formatGbp } from '@/lib/giving/types';
import { cn } from '@/lib/utils/cn';
import { NextStep, type MakeMonthly } from './thank-you-next-step';

const rowLabel = 'font-label text-xs font-bold tracking-[0.12em] text-primary-200 uppercase';

/**
 * The donation's thank-you screen, in three parts (marketing team, October 2026):
 *  1. confirmation: amount, frequency, reference and, for regular gifts, the next payment date;
 *  2. "Share on WhatsApp" with a pre-written message and a tagged link to the cause;
 *  3. one next step (`NextStep`): make it monthly, or the appeal's progress.
 * Shown as step 4 of the form and on `/donate/complete` (redirect methods). Dark theme.
 */
export function ThankYou({
  confirmation: c,
  program,
  makeMonthly,
  onAgain,
  canChangeCause = true,
  pageHeading = false,
}: {
  confirmation: DonationConfirmation;
  program: DonationProgram;
  makeMonthly: MakeMonthly;
  /** Step 4 only: start a new donation on the same form. */
  onAgain?: () => void;
  /** False when this is the only cause on the website (no "Choose another cause"). */
  canChangeCause?: boolean;
  /** True on `/donate/complete`, where the title is the page's h1. */
  pageHeading?: boolean;
}) {
  const g = program.giving;
  const unit = g.kind === 'daily' ? g.unit : undefined;
  const Title = pageHeading ? 'h1' : 'h2';
  const firstDaily = c.plan && new Date(c.plan.firstCharge);

  const rows: [string, string][] = [
    [
      'Donation',
      g.kind === 'per-person' && c.people
        ? `${formatGbp(c.amount)} (${c.people} × ${formatGbp(c.amount / c.people)})`
        : amountWithFrequency(c.amount, c.frequency, unit),
    ],
    [
      'Frequency',
      c.plan && unit
        ? `Every ${unit}, ${c.plan.count} payments (${formatGbp(c.plan.amount * c.plan.count)} in total)`
        : FREQUENCY_LABELS[c.frequency],
    ],
    ['Reference', c.reference],
  ];
  if (c.nextPayment) rows.push(['Next payment', formatLongDate(c.nextPayment)]);
  else if (firstDaily && g.kind === 'daily')
    rows.push(['First payment', `${formatLongDate(firstDaily)}, ${formatClock(g.chargeTime)}`]);

  return (
    <div className="space-y-12">
      {/* 1. Confirmation */}
      <section className="space-y-6" aria-labelledby="step-title">
        <p className="font-script text-4xl text-secondary-300">Jazakum Allahu khairan</p>
        <Title
          id="step-title"
          tabIndex={-1}
          className="text-title-2xl leading-none text-white outline-none sm:text-title-3xl"
        >
          Thank you{c.firstName ? `, ${c.firstName}` : ''}
        </Title>
        <p className="text-lg text-primary-100">
          Your donation to <strong className="text-white">{program.title}</strong>{' '}
          {c.plan ? 'is set up. Nothing has been taken today.' : 'has been received.'}
          {c.email && ` A confirmation is on its way to ${c.email}.`}
        </p>
        <dl className="border-t border-white/10">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/10 py-3"
            >
              <dt className={rowLabel}>{label}</dt>
              <dd className="font-ui text-lg font-semibold text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 2. Share */}
      <section className="space-y-4" aria-labelledby="share-title">
        <h3 id="share-title" className="text-title-lg leading-none text-white">
          Invite others to give
        </h3>
        <p className="text-primary-100">
          Every share helps. Send {program.title} to family and friends on WhatsApp.
        </p>
        <ButtonLink
          href={whatsappShareUrl(siteConfig.url, program.id, program.title)}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
        >
          <WhatsAppIcon className="size-4" />
          Share on WhatsApp
        </ButtonLink>
      </section>

      {/* 3. One next step */}
      <NextStep program={program} confirmation={c} makeMonthly={makeMonthly} />

      <div className={cn('flex flex-wrap gap-6', !canChangeCause && !onAgain && 'hidden')}>
        {canChangeCause && (
          <ButtonLink href="/donate" variant="tertiary-light">
            Choose another cause
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        )}
        {onAgain && (
          <button
            type="button"
            onClick={onAgain}
            className="inline-flex items-center gap-2 font-label font-bold tracking-[0.12em] text-secondary-300 uppercase hover:text-white"
          >
            Give again
            <ArrowRightIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
