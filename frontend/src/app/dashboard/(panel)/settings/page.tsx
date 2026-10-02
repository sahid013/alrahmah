import type { Metadata } from 'next';
import { SettingsView } from '@/components/dashboard/settings/settings-view';
import { PageHeader } from '@/components/dashboard/ui';
import { TWO_FACTOR_REQUIRED } from '@/lib/dashboard/auth/types';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
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
