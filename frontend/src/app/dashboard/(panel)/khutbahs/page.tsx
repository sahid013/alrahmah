import type { Metadata } from 'next';
import { KhutbahManager } from '@/components/dashboard/khutbahs/khutbah-manager';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Khutbahs' };

export default function KhutbahsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Khutbahs"
        description="Post each week's khutbah by pasting its YouTube link. The newest one is shown as “This week” in the Latest Khutbahs section on the home page."
      />
      <KhutbahManager />
    </div>
  );
}
