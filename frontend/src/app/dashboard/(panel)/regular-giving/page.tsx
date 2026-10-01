import type { Metadata } from 'next';
import { RegularGivingView } from '@/components/dashboard/regular/regular-giving-view';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Regular giving' };

export default function RegularGivingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Regular giving"
        description="Weekly and monthly donors: who is giving, how much, and whose payments have failed or stopped."
      />
      <RegularGivingView />
    </div>
  );
}
