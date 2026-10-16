'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  generatePassword,
  userUpdateSchema,
  type DashboardUser,
  type UserUpdate,
} from '@/lib/dashboard/auth/types';
import { useDashboardApi } from '../dashboard-api-provider';
import { Field, Input, Panel } from '../ui';

/**
 * Edit a team member (admins): name, email, and optionally a new password (generated, shown once,
 * for someone who's locked out). Only changed fields are sent.
 */
export function EditUserForm({
  user,
  onDone,
}: {
  user: DashboardUser;
  /** Called after saving (with the updated user) or cancelling. */
  onDone: (updated?: DashboardUser) => void;
}) {
  const api = useDashboardApi();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ user: DashboardUser; password?: string }>();
  const [copied, setCopied] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const changes: UserUpdate = {
      ...(name.trim() !== user.name && { name: name.trim() }),
      ...(email.trim().toLowerCase() !== user.email.toLowerCase() && { email: email.trim() }),
      ...(password && { password }),
    };
    const result = userUpdateSchema.safeParse(changes);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues)
        next[String(issue.path[0] ?? 'form')] ??= issue.message;
      return setErrors(next);
    }
    setBusy(true);
    setErrors({});
    try {
      const updated = await api.users.update(user.id, result.data);
      if (password) setSaved({ user: updated, password });
      else onDone(updated);
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!saved?.password) return;
    await navigator.clipboard.writeText(
      `Al-Rahmah dashboard\nSign in: ${location.origin}/dashboard/login\nEmail: ${saved.user.email}\nNew password: ${saved.password}`,
    );
    setCopied(true);
  };

  if (saved?.password)
    return (
      <Panel title={`Updated ${saved.user.name}`}>
        <div className="space-y-4 p-5">
          <p className="text-primary-900">
            Their new password works straight away. Send it to them privately; it&apos;s shown only
            once, and they can change it in Settings after signing in.
          </p>
          <dl className="grid gap-x-4 gap-y-2 border border-neutral-200 bg-neutral-50 p-4 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-neutral-500">Email</dt>
            <dd className="font-ui break-all text-primary-900">{saved.user.email}</dd>
            <dt className="text-neutral-500">New password</dt>
            <dd className="font-ui break-all text-primary-900 select-all">{saved.password}</dd>
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? 'Copied' : 'Copy sign-in details'}
            </Button>
            <Button size="sm" onClick={() => onDone(saved.user)}>
              Done
            </Button>
          </div>
        </div>
      </Panel>
    );

  return (
    <Panel title={`Edit ${user.name}`}>
      <form onSubmit={submit} noValidate className="space-y-5 p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email" hint="Used to sign in." error={errors.email}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
        </div>

        <div className="border-t border-neutral-200 pt-5">
          <p className="font-label text-xs font-bold tracking-[0.12em] text-primary-900 uppercase">
            Password
          </p>
          {password ? (
            <p className="mt-2 text-sm text-neutral-600">
              A new password will be set:{' '}
              <span className="font-ui text-primary-900 select-all">{password}</span>{' '}
              <button
                type="button"
                onClick={() => setPassword(undefined)}
                className="ml-2 font-label text-xs font-bold tracking-[0.08em] text-primary-500 uppercase hover:text-secondary-700"
              >
                Keep current password
              </button>
            </p>
          ) : (
            <p className="mt-2 text-sm text-neutral-600">
              Locked out?{' '}
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="font-label text-xs font-bold tracking-[0.08em] text-primary-500 uppercase hover:text-secondary-700"
              >
                Set a new password
              </button>
            </p>
          )}
          {errors.password && <p className="mt-1 text-sm text-error-700">{errors.password}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => onDone()}>
            Cancel
          </Button>
          {errors.form && <span className="text-error-700">{errors.form}</span>}
        </div>
      </form>
    </Panel>
  );
}
