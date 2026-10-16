'use client';

import { useDashboardAuth } from '../auth/auth-gate';
import { AccountPanel } from './account-panel';
import { UsersPanel } from './users-panel';

export function SettingsView() {
  const { session } = useDashboardAuth();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 2xl:grid-cols-[minmax(0,1fr)_26rem]">
      {/* Editors only see their own account. */}
      {session.user.role === 'admin' && <UsersPanel meId={session.user.id} />}
      <AccountPanel />
    </div>
  );
}
