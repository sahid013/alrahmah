import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/ui';
import { PrayerCalendarEditor } from '@/components/dashboard/prayer/prayer-calendar-editor';

export const metadata: Metadata = { title: 'Prayer times' };

export default function PrayerTimesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prayer times"
        description="Pick any date to edit its adhan and jama'ah times. Days you haven't edited use the calculated timetable."
      />
      <PrayerCalendarEditor />
    </div>
  );
}
