import type { DonationOverview } from '@/lib/donations/types';
import { DonationTracker } from './donation-tracker';

/** Page-level tracker panel (e.g. running costs covered), on a navy surface. */
export function DonationsOverview({ overview }: { overview: DonationOverview }) {
  return (
    <section
      aria-labelledby="donations-overview-title"
      className="bg-primary-800 p-8 text-white sm:p-10"
    >
      <h2 id="donations-overview-title" className="text-title-2xl text-white">
        {overview.title}
      </h2>
      {overview.description && (
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-primary-100">
          {overview.description}
        </p>
      )}
      <DonationTracker tracker={overview.tracker} tone="dark" className="mt-8" />
    </section>
  );
}
