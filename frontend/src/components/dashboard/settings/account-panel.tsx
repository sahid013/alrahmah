'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { MIN_PASSWORD, passwordSchema } from '@/lib/dashboard/auth/types';
import { useDashboardAuth } from '../auth/auth-gate';
import { useDashboardApi } from '../dashboard-api-provider';
import { Badge, Field, Input, Panel } from '../ui';

/** The signed-in user's details and password change. */
export function AccountPanel() {
  const api = useDashboardApi();
  const { session } = useDashboardAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setDone(false);
    const check = passwordSchema.safeParse(form.next);
    if (!check.success) return setError(check.error.issues[0]!.message);
    if (form.next !== form.confirm) return setError("The new passwords don't match.");
    setBusy(true);
    try {
      await api.auth.changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setError(undefined);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password.');
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    type: 'password',
    value: form[key],
    onChange: (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6">
      <Panel title="My account">
        <dl className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-neutral-500">Name</dt>
          <dd className="font-bold text-primary-900">{session.user.name}</dd>
          <dt className="text-neutral-500">Email</dt>
          <dd className="text-primary-900">{session.user.email}</dd>
          <dt className="text-neutral-500">Role</dt>
          <dd className="text-primary-900 capitalize">{session.user.role}</dd>
          <dt className="text-neutral-500">Two-step verification</dt>
          <dd>
            <Badge tone="success">On · authenticator app</Badge>
          </dd>
        </dl>
      </Panel>
      <Panel title="Change password">
        <form onSubmit={submit} noValidate className="grid gap-5 p-5 sm:max-w-md">
          <Field label="Current password">
            <Input autoComplete="current-password" {...field('current')} />
          </Field>
          <Field label="New password" hint={`At least ${MIN_PASSWORD} characters.`}>
            <Input autoComplete="new-password" {...field('next')} />
          </Field>
          <Field label="Confirm new password">
            <Input autoComplete="new-password" {...field('confirm')} />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-error-700">
              {error}
            </p>
          )}
          {done && (
            <p role="status" className="text-sm text-success-700">
              Password changed.
            </p>
          )}
          <div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Change password'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
