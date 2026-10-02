import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SettingsView } from '@/components/dashboard/settings/settings-view';
import { PageHeader } from '@/components/dashboard/ui';
import { AUTH_ENABLED, TWO_FACTOR_REQUIRED } from '@/lib/dashboard/auth/types';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  // Users and account settings need sign-in; hidden while it's switched off.
  if (!AUTH_ENABLED) redirect('/dashboard');
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={`Team access and your account. Everyone signs in with a password${TWO_FACTOR_REQUIRED ? ' and an authenticator app' : ''}.`}
      />
      <SettingsView />
    </div>
  );
}
