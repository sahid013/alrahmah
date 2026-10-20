import type { Metadata } from 'next';
import { MessagesView } from '@/components/dashboard/messages/messages-view';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Messages' };

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Everything sent through the website’s contact forms (Contact, Funerals, Quran Academy). Each message is also emailed to that form’s inbox; open one to read it in full and reply."
      />
      <MessagesView />
    </div>
  );
}
