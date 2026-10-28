import type { Metadata } from 'next';
import { MailingListView } from '@/components/dashboard/mailing-list/mailing-list-view';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Mailing list' };

export default function MailingListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mailing list"
        description="Donors who ticked “Keep me updated” on the donation form, added once their donation goes through. Only email subscribed contacts, and unsubscribe anyone who asks."
      />
      <MailingListView />
    </div>
  );
}
