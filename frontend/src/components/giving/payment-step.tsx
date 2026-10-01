import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';
import {
  FREQUENCY_LABELS,
  formatGbp,
  giftAidBonus,
  type DonationRequest,
} from '@/lib/giving/types';
import { StepTitle } from './fields';

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
    ['Name', `${request.donor.firstName} ${request.donor.lastName}`],
    ['Receipt to', request.donor.email],
  ];
  if (request.giftAid.declared)
    rows.push(['Gift Aid', `+ ${formatGbp(giftAidBonus(request.amount))} from HMRC`]);

  return (
    <div className="space-y-10">
      <StepTitle id="step-title">Payment</StepTitle>

      <dl className="border border-neutral-200 bg-white">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-6 border-b border-neutral-100 px-5 py-3 last:border-0"
          >
            <dt className="text-neutral-500">{k}</dt>
            <dd className="text-right font-bold break-all text-primary-900">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="card-title">
        <h3
          id="card-title"
          className="mb-3 font-label text-sm font-bold tracking-[0.12em] text-primary-900 uppercase"
        >
          Pay securely
        </h3>
        {children}
        <p className="mt-3 text-sm text-neutral-500">
          Payments are processed by Stripe. {siteConfig.name} never sees or stores your card
          details. Your information is only used to process your donation and claim Gift Aid.
        </p>
      </section>

      {error && (
        <p role="alert" className="bg-error-50 px-4 py-3 text-error-700">
          {error}
        </p>
      )}
    </div>
  );
}
