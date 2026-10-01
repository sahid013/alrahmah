import type { Metadata } from 'next';
import { DonationsView } from '@/components/dashboard/donations/donations-view';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Donations' };

export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Donations"
        description="Every successful payment, newest first. Filter, then export exactly what you see."
      />
      <DonationsView />
    </div>
  );
}
