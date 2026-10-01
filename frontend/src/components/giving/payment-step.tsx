import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';
import {
  FREQUENCY_LABELS,
  formatGbp,
  giftAidBonus,
  type DonationRequest,
} from '@/lib/giving/types';
import { ErrorBox, StepTitle } from './fields';

/** Summary plus the payment area (`children`: Stripe's Payment Element, or the preview note). */
export function PaymentStep({
  request,
  campaignTitle,
  error,
  children,
}: {
  request: DonationRequest;
  campaignTitle: string;
  error?: string;
  children: ReactNode;
}) {
  const rows: [string, string][] = [
    ['Donation', formatGbp(request.amount)],
    ['How often', FREQUENCY_LABELS[request.frequency]],
    ['Supporting', campaignTitle],
    ...(request.donor.type === 'organisation'
      ? ([['Organisation', request.donor.organisation ?? '']] as [string, string][])
      : []),
    ['Name', `${request.donor.firstName} ${request.donor.lastName}`],
    ['Receipt to', request.donor.email],
  ];
  if (request.giftAid.declared)
    rows.push(['Gift Aid', `+ ${formatGbp(giftAidBonus(request.amount))} from HMRC`]);

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
          Pay securely
        </h3>
        {children}
        <p className="mt-3 text-sm text-primary-200">
          Payments are processed by Stripe. {siteConfig.name} never sees or stores your card
          details. Your information is only used to process your donation and claim Gift Aid.
        </p>
      </section>

      {error && <ErrorBox>{error}</ErrorBox>}
    </div>
  );
}
