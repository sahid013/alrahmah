import type { Metadata } from 'next';
import { connection } from 'next/server';
import { DashboardApiProvider } from '@/components/dashboard/dashboard-api-provider';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | Dashboard' },
  robots: { index: false, follow: false },
};

/** Private dashboard: data provider for the sign-in page and the signed-in panel. */
export default async function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  // Render per request: screens use "today" (masjid time), and auth is per request.
  await connection();
  return <DashboardApiProvider>{children}</DashboardApiProvider>;
}
