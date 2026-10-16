import type { Metadata } from 'next';
import { EventEditor } from '@/components/dashboard/events/event-editor';

export const metadata: Metadata = { title: 'Edit event' };

export default async function EventPage({ params }: PageProps<'/dashboard/events/[id]'>) {
  const { id } = await params;
  return <EventEditor id={id === 'new' ? undefined : id} />;
}
