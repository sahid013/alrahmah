import type { Metadata } from 'next';
import { DonorsView } from '@/components/dashboard/donors/donors-view';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Donors & exports' };

export default function DonorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Donors & exports"
        description="Choose a period, review who gave, and download donor records or the Gift Aid claim schedule."
      />
      <DonorsView />
    </div>
  );
}
