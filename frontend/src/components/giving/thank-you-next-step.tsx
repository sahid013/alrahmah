import { ArrowRightIcon } from '@/components/icons';
import { Button, ButtonLink } from '@/components/ui/button';
import { DonationTracker } from '@/components/donations/donation-tracker';
import { siteConfig } from '@/config/site';
import type { DonationProgram } from '@/lib/donations/types';
import type { DonationConfirmation } from '@/lib/giving/confirmation';
import { formatGbp, REGULAR_PRESETS } from '@/lib/giving/types';

/** Step 4 restarts the form on Monthly; `/donate/complete` links to the form with ?frequency=monthly. */
export type MakeMonthly = { onClick: () => void } | { href: string };

const box = 'space-y-4 border border-white/15 bg-white/5 p-6 sm:p-8';
const eyebrow = 'font-label text-xs font-bold tracking-[0.15em] text-secondary-300 uppercase';

/**
 * The thank-you screen's single next step: one-off donors to a regular cause are asked to make
 * it monthly; everyone else sees the appeal's progress (the campaign's tracker from the dashboard,
 * or the appeal's goal until one is set: never a made-up total).
 */
export function NextStep({
  program,
  confirmation,
  makeMonthly,
}: {
  program: DonationProgram;
  confirmation: DonationConfirmation;
  makeMonthly: MakeMonthly;
}) {
  if (program.giving.kind === 'regular' && confirmation.frequency === 'one-off') {
    const monthly = REGULAR_PRESETS.monthly.preselected;
    const label = `Give ${formatGbp(monthly)} monthly`;
    return (
      <section className={box} aria-labelledby="next-title">
        <p className={eyebrow}>Most impact</p>
        <h3 id="next-title" className="text-title-lg leading-none text-white">
          Make it monthly
        </h3>
        <p className="text-primary-100">
          Regular gifts let the masjid plan ahead. {formatGbp(monthly)} a month adds up to{' '}
          <strong className="font-ui text-white">{formatGbp(monthly * 12)}</strong> over a year, and
          you can stop at any time.
        </p>
        {'href' in makeMonthly ? (
          <ButtonLink href={makeMonthly.href} variant="secondary">
            {label}
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        ) : (
          <Button type="button" variant="secondary" onClick={makeMonthly.onClick}>
            {label}
            <ArrowRightIcon className="size-4" />
          </Button>
        )}
      </section>
    );
  }

  return (
    <section className={box} aria-labelledby="next-title">
      <p className={eyebrow}>Make Space for Rahmah</p>
      <h3 id="next-title" className="text-title-lg leading-none text-white">
        {program.tracker ? `${program.title}: progress so far` : 'Our appeal'}
      </h3>
      {program.tracker ? (
        <DonationTracker tracker={program.tracker} tone="dark" />
      ) : (
        <p className="text-primary-100">
          Together we can raise <strong className="font-ui text-white">£1,000,000</strong> for a
          permanent home: a new masjid and Islamic education centre for 1,500 people. If 1,000 of us
          each give £1,000, we will get there.
        </p>
      )}
      <ButtonLink href={siteConfig.links.appeal} variant="tertiary-light">
        See the appeal
        <ArrowRightIcon className="size-4" />
      </ButtonLink>
    </section>
  );
}
