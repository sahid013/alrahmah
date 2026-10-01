import type { Metadata } from 'next';
import { CampaignEditor } from '@/components/dashboard/campaigns/campaign-editor';

export const metadata: Metadata = { title: 'Edit campaign' };

export default async function CampaignPage({ params }: PageProps<'/dashboard/campaigns/[id]'>) {
  const { id } = await params;
  return <CampaignEditor id={id === 'new' ? undefined : id} />;
}
