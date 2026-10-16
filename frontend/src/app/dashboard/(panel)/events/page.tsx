import type { Metadata } from 'next';
import { EventList } from '@/components/dashboard/events/event-list';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Events' };

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Events and courses on the website (home page, Events calendar and menu). Published events show in this order."
      />
      <EventList />
    </div>
  );
}
