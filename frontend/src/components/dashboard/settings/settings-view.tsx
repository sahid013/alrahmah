'use client';

import { useDashboardAuth } from '../auth/auth-gate';
import { AccountPanel } from './account-panel';
import { UsersPanel } from './users-panel';

export function SettingsView() {
  const { session } = useDashboardAuth();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 2xl:grid-cols-[minmax(0,1fr)_26rem]">
      {session.user.role === 'admin' ? (
        <UsersPanel meId={session.user.id} />
      ) : (
        <p className="border border-neutral-200 bg-white p-5 text-neutral-600">
          Only admins can add or manage users.
        </p>
      )}
      <AccountPanel />
    </div>
  );
}
