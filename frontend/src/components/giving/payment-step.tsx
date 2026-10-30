import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';
import type { DonationProgram } from '@/lib/donations/types';
import { dateRange, nextFridayCharge, remainingCharges } from '@/lib/giving/schedule';
import {
  FREQUENCY_LABELS,
  formatGbp,
  giftAidBonus,
  type DonationRequest,
} from '@/lib/giving/types';
import { ErrorBox, StepTitle } from './fields';

const fridayDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/London',
});

/** The summary rows for the cause's kind of giving. */
function donationRows(request: DonationRequest, program: DonationProgram): [string, string][] {
  const g = program.giving;
  if (g.kind === 'per-person') {
    const people = request.people ?? 1;
    return [
      ['Cause', program.title],
      ['People', `${people} × ${formatGbp(g.unitAmount)}`],
      ['Total (one-off)', formatGbp(request.amount)],
    ];
  }
  if (g.kind === 'daily') {
    const charges = remainingCharges(g);
    return [
      ['Cause', program.title],
      [`Each ${g.unit}`, formatGbp(request.amount)],
      [g.unit === 'night' ? 'Nights' : 'Days', `${charges.length} (${dateRange(charges)})`],
      ['Total', formatGbp(request.amount * charges.length)],
      ['Taken today', formatGbp(0)],
    ];
  }
  if (g.kind === 'jumuah') {
    return [
      ['Cause', program.title],
      ['Each Friday', formatGbp(request.amount)],
      ['First payment', fridayDate.format(nextFridayCharge(g))],
      ['Taken today', formatGbp(0)],
    ];
  }
  return [
    ['Donation', formatGbp(request.amount)],
    ['How often', FREQUENCY_LABELS[request.frequency]],
    ['Supporting', program.title],
  ];
}

/** Summary plus the payment area (`children`: Stripe's Payment Element, or the preview note). */
export function PaymentStep({
  request,
  program,
  error,
  children,
}: {
  request: DonationRequest;
  program: DonationProgram;
  error?: string;
  children: ReactNode;
}) {
  /** Daily causes and Jumu'ah giving save the card; nothing is taken today. */
  const daily = program.giving.kind === 'daily' || program.giving.kind === 'jumuah';
  const rows: [string, string][] = [
    ...donationRows(request, program),
    ...(request.donor.type === 'organisation'
      ? ([['Organisation', request.donor.organisation ?? '']] as [string, string][])
      : []),
    ['Name', `${request.donor.firstName} ${request.donor.lastName}`],
    ['Receipt to', request.donor.email],
    ...(request.giftAid.declared
      ? ([
          [
            'Gift Aid',
            `Yes, + ${formatGbp(giftAidBonus(request.amount))}${request.frequency === 'one-off' ? '' : ' each payment'} from HMRC`,
          ],
        ] as [string, string][])
      : []),
  ];

  return (
    <div className="space-y-10">
      <StepTitle id="step-title">Payment</StepTitle>

      <dl className="divide-y divide-white/10 border-y border-white/10">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 py-3">
            <dt className="text-primary-200">{k}</dt>
            <dd className="text-right font-bold break-all text-white">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="card-title">
        <h3
          id="card-title"
          className="mb-3 font-label text-sm font-bold tracking-[0.12em] text-white uppercase"
        >
          {daily ? 'Save your card' : 'Pay securely'}
        </h3>
        {children}
        <p className="mt-3 text-sm text-primary-200">
          Payments are processed by Stripe. {siteConfig.name} never sees or stores your card
          details.
          {daily && ' Your card is saved with Stripe only to take the payments listed above.'} Your
          information is only used to process your donation
          {request.giftAid.declared ? ' and claim Gift Aid' : ''}.
        </p>
      </section>

      {error && <ErrorBox>{error}</ErrorBox>}
    </div>
  );
}
