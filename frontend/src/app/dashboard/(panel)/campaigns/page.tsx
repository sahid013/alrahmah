import type { Metadata } from 'next';
import { CampaignList } from '@/components/dashboard/campaigns/campaign-list';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Campaigns' };

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Donation programmes for the public Donations page. Once the backend is connected, active campaigns appear there in this order."
      />
      <CampaignList />
    </div>
  );
}
