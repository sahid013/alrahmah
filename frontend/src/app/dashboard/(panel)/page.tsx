import type { Metadata } from 'next';
import { DashboardOverview } from '@/components/dashboard/overview/dashboard-overview';
import { PageHeader } from '@/components/dashboard/ui';

export const metadata: Metadata = { title: 'Overview' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Recent donations and today's timetable at a glance."
      />
      <DashboardOverview />
    </div>
  );
}
