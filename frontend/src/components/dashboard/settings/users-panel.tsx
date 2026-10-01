'use client';

import { useState } from 'react';
import { TrashIcon } from '@/components/icons';
import { ROLES, type DashboardUser, type Role } from '@/lib/dashboard/auth/types';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { Badge, iconButton, LoadingRows, Panel, Select, shortDate, td, th } from '../ui';
import { AddUserForm } from './add-user-form';

/** Team accounts: roles, two-step status, reset and remove (admins only). */
export function UsersPanel({ meId }: { meId: string }) {
  const api = useDashboardApi();
  const { data: users, reload } = useDashboardQuery((a) => a.users.list(), []);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string }>();

  const act = async (task: () => Promise<void>, ok: string) => {
    setMessage(undefined);
    try {
      await task();
      setMessage({ tone: 'ok', text: ok });
      reload();
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  };

  const setRole = (u: DashboardUser, role: Role) =>
    act(
      () => api.users.setRole(u.id, role),
      `${u.name} is now ${role === 'admin' ? 'an admin' : 'an editor'}.`,
    );
  const resetTwoFactor = (u: DashboardUser) =>
    window.confirm(
      `Reset two-step verification for ${u.name}? They'll set up their authenticator app again at next sign-in.`,
    ) &&
    act(
      () => api.users.resetTwoFactor(u.id),
      `${u.name} will set up two-step verification at next sign-in.`,
    );
  const remove = (u: DashboardUser) =>
    window.confirm(`Remove ${u.name} (${u.email})? They'll no longer be able to sign in.`) &&
    act(() => api.users.remove(u.id), `${u.name} has been removed.`);

  return (
    <div className="space-y-6">
      <Panel title={users ? `${users.length} users` : 'Users'}>
        <p role="status" className="px-5 pt-4 text-sm empty:hidden">
          {message && (
            <span className={message.tone === 'ok' ? 'text-success-700' : 'text-error-700'}>
              {message.text}
            </span>
          )}
        </p>
        {!users ? (
          <LoadingRows />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-200">
              <thead>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Role</th>
                  <th className={th}>Two-step</th>
                  <th className={th}>Last sign-in</th>
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const me = u.id === meId;
                  return (
                    <tr key={u.id}>
                      <td className={td}>
                        <span className="block font-bold text-primary-900">
                          {u.name}{' '}
                          {me && <span className="font-normal text-neutral-400">(you)</span>}
                        </span>
                        <span className="text-xs">{u.email}</span>
                      </td>
                      <td className={td}>
                        <Select
                          aria-label={`Role for ${u.name}`}
                          value={u.role}
                          disabled={me}
                          onChange={(e) => void setRole(u, e.target.value as Role)}
                          className="w-auto py-1.5 text-sm"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r === 'admin' ? 'Admin' : 'Editor'}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className={td}>
                        {u.mfaEnrolled ? (
                          <Badge tone="success">On</Badge>
                        ) : (
                          <Badge tone="warning">Set up at next sign-in</Badge>
                        )}
                      </td>
                      <td className={`${td} font-ui whitespace-nowrap`}>
                        {u.lastSignInAt ? shortDate(u.lastSignInAt) : 'Never'}
                      </td>
                      <td className={`${td} text-right whitespace-nowrap`}>
                        {u.mfaEnrolled && (
                          <button
                            type="button"
                            onClick={() => void resetTwoFactor(u)}
                            className="mr-2 font-label text-xs font-bold tracking-[0.08em] text-primary-500 uppercase hover:text-secondary-700"
                          >
                            Reset 2FA
                          </button>
                        )}
                        {!me && (
                          <button
                            type="button"
                            className={iconButton}
                            aria-label={`Remove ${u.name}`}
                            onClick={() => void remove(u)}
                          >
                            <TrashIcon className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <AddUserForm onCreated={reload} />
    </div>
  );
}
