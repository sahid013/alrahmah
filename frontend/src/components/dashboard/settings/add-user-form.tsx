'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  generatePassword,
  newUserSchema,
  ROLE_LABELS,
  ROLES,
  TWO_FACTOR_REQUIRED,
  type DashboardUser,
  type NewUser,
} from '@/lib/dashboard/auth/types';
import { useDashboardApi } from '../dashboard-api-provider';
import { Field, Input, Panel, Select } from '../ui';

const blank = (): NewUser => ({
  name: '',
  email: '',
  role: 'editor',
  password: generatePassword(),
});

/** Create a team account with a temporary password (plus 2FA setup at first sign-in when required). */
export function AddUserForm({ onCreated }: { onCreated: () => void }) {
  const api = useDashboardApi();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ user: DashboardUser; password: string }>();
  const [copied, setCopied] = useState(false);

  const change = (patch: Partial<NewUser>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch))));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = newUserSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] ??= issue.message;
      return setErrors(next);
    }
    setBusy(true);
    try {
      const user = await api.users.create(result.data);
      setCreated({ user, password: result.data.password });
      setForm(blank());
      onCreated();
    } catch (e) {
      setErrors({ email: e instanceof Error ? e.message : 'Could not create the user.' });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Al-Rahmah dashboard\nSign in: ${location.origin}/dashboard/login\nEmail: ${created.user.email}\nTemporary password: ${created.password}${TWO_FACTOR_REQUIRED ? "\nYou'll be asked to set up an authenticator app when you first sign in." : ''}`,
    );
    setCopied(true);
  };

  return (
    <Panel title="Add a user">
      {created ? (
        <div className="space-y-4 p-5">
          <p className="text-primary-900">
            <strong>{created.user.name}</strong> can now sign in. Send them these details privately.
            The password is shown only once.
          </p>
          <dl className="grid gap-x-4 gap-y-2 border border-neutral-200 bg-neutral-50 p-4 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-neutral-500">Email</dt>
            <dd className="font-ui break-all text-primary-900">{created.user.email}</dd>
            <dt className="text-neutral-500">Temporary password</dt>
            <dd className="font-ui break-all text-primary-900 select-all">{created.password}</dd>
          </dl>
          <p className="text-sm text-neutral-500">
            {TWO_FACTOR_REQUIRED &&
              'At first sign-in they’ll scan a QR code with an authenticator app. '}
            They can change the password under Settings → My account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? 'Copied' : 'Copy sign-in details'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreated(undefined);
                setCopied(false);
              }}
            >
              Add another user
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}>
            <Input value={form.name} onChange={(e) => change({ name: e.target.value })} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => change({ email: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) => change({ role: e.target.value as NewUser['role'] })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Temporary password" error={errors.password}>
            <div className="flex gap-2">
              <Input
                value={form.password}
                onChange={(e) => change({ password: e.target.value })}
                className="font-ui"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-auto shrink-0"
                onClick={() => change({ password: generatePassword() })}
              >
                New
              </Button>
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}
