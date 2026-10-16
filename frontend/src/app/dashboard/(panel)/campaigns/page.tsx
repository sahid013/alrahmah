import type { Metadata } from 'next';
import { CampaignsView } from '@/components/dashboard/campaigns/campaigns-view';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Campaigns' };

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="The causes on the Donate and Donations pages. Active campaigns are shown on the website, in this order."
      />
      <CampaignsView />
    </div>
  );
}
