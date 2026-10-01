'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon } from '@/components/icons';
import { sourceOf } from '@/lib/dashboard/queries';
import { SUBSCRIPTION_STATUS_LABELS, type Campaign, type Donation } from '@/lib/dashboard/types';
import { countryName } from '@/lib/giving/countries';
import { DONOR_TYPE_LABELS } from '@/lib/giving/types';
import { Badge, gbp, iconButton, shortDate } from '../ui';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[9rem_1fr] gap-3 py-2">
    <dt className="text-sm text-neutral-500">{label}</dt>
    <dd className="text-sm break-words text-primary-900">{children ?? '—'}</dd>
  </div>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-t border-neutral-200 px-6 py-4">
    <h3 className="mb-1 font-label text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
      {title}
    </h3>
    <dl className="divide-y divide-neutral-100">{children}</dl>
  </section>
);

/** Everything recorded about one donation (native modal dialog: focus trap, Esc to close). */
export function DonationDetail({
  donation,
  campaigns,
  onClose,
}: {
  donation?: Donation;
  campaigns: Campaign[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (donation && !dialog.open) dialog.showModal();
    if (!donation && dialog.open) dialog.close();
  }, [donation]);

  const d = donation;
  const campaign = d && campaigns.find((c) => c.id === d.campaignId)?.title;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="donation-detail-title"
      className="m-0 ml-auto h-full max-h-none w-full max-w-lg bg-white p-0 backdrop:bg-primary-950/60"
    >
      {d && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div>
              <p className="font-label text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
                {shortDate(d.createdAt)} · {d.createdAt.slice(11, 16)}
              </p>
              <h2 id="donation-detail-title" className="mt-1 text-title-xl text-primary-900">
                <span className="font-ui font-semibold">{gbp(d.amount)}</span> to {campaign}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {d.type === 'recurring' ? (
                  <Badge tone="sky">{d.frequency}</Badge>
                ) : (
                  <Badge>One-off</Badge>
                )}
                {d.status === 'refunded' && <Badge tone="error">Refunded</Badge>}
                {d.giftAid && <Badge tone="indigo">Gift Aid</Badge>}
                {d.marketingConsent && <Badge tone="success">Opted in</Badge>}
              </div>
            </div>
            <button type="button" onClick={onClose} className={iconButton} aria-label="Close">
              <CloseIcon className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-6">
            <Section title="Donor">
              <Row label="Name">
                {d.donor.firstName} {d.donor.lastName}
              </Row>
              <Row label="Donating as">{DONOR_TYPE_LABELS[d.donor.type]}</Row>
              {d.donor.organisation && <Row label="Organisation">{d.donor.organisation}</Row>}
              <Row label="Email">
                <a href={`mailto:${d.donor.email}`} className="text-secondary-700 hover:underline">
                  {d.donor.email}
                </a>
              </Row>
              <Row label="Phone">
                <span className="font-ui">{d.donor.phone}</span>
              </Row>
            </Section>
            <Section title="Address">
              <Row label="Address">{d.donor.address}</Row>
              <Row label="Town / City">{d.donor.city}</Row>
              {d.donor.region && <Row label="County / State">{d.donor.region}</Row>}
              <Row label="Postcode">
                <span className="font-ui">{d.donor.postcode}</span>
              </Row>
              <Row label="Country">{countryName(d.donor.country)}</Row>
            </Section>
            <Section title="Gift Aid & consent">
              <Row label="Gift Aid">
                {d.giftAid
                  ? `Declared ${d.giftAidDeclaredAt ? shortDate(d.giftAidDeclaredAt) : ''}`
                  : 'No'}
              </Row>
              <Row label="Marketing">{d.marketingConsent ? 'Opted in to email updates' : 'No'}</Row>
            </Section>
            <Section title="Payment">
              <Row label="Status">{d.status === 'refunded' ? 'Refunded' : 'Paid'}</Row>
              {d.subscription && (
                <Row label="Regular gift">
                  {SUBSCRIPTION_STATUS_LABELS[d.subscription.status]} ·{' '}
                  <span className="font-ui text-xs">{d.subscription.id}</span>
                </Row>
              )}
              <Row label="Reference">
                <span className="font-ui text-xs">{d.paymentRef}</span>
              </Row>
            </Section>
            <Section title="Source">
              <Row label="Source">{sourceOf(d)}</Row>
              {d.source?.utmMedium && <Row label="Medium">{d.source.utmMedium}</Row>}
              {d.source?.utmCampaign && <Row label="UTM campaign">{d.source.utmCampaign}</Row>}
              {d.source?.landingPage && <Row label="Landing page">{d.source.landingPage}</Row>}
            </Section>
          </div>
        </div>
      )}
    </dialog>
  );
}
