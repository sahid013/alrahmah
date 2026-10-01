'use client';

/* eslint-disable @next/next/no-img-element -- QR codes are generated data URIs */
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import type { TotpEnrollment } from '@/lib/dashboard/auth/types';
import { useDashboardApi } from '../dashboard-api-provider';
import { Field, Input } from '../ui';
import { CodeInput } from './code-input';

type Step = 'password' | 'verify' | 'enroll';

const STEP_TITLES: Record<Step, string> = {
  password: 'Sign in',
  verify: 'Two-step verification',
  enroll: 'Set up two-step verification',
};

/** Only allow redirects back into the dashboard. */
const safeNext = (next: string | null) =>
  next && next.startsWith('/dashboard') && !next.startsWith('//') ? next : '/dashboard';

/** Password → authenticator code (or first-time authenticator setup) → dashboard. */
export function LoginFlow() {
  const api = useDashboardApi();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [enrollment, setEnrollment] = useState<TotpEnrollment>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // Already fully signed in → straight to the dashboard.
  useEffect(() => {
    api.auth.getSession().then((s) => s?.aal === 'aal2' && router.replace(next));
  }, [api, router, next]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const result = await api.auth.signIn(email, password);
      setPassword('');
      if (result === 'mfa-enroll') setEnrollment(await api.auth.enrollTotp());
      setStep(result === 'mfa-enroll' ? 'enroll' : 'verify');
    });
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await api.auth.verifyTotp(code, step === 'enroll' ? enrollment?.factorId : undefined);
      router.replace(next);
    });
  };

  const back = () => {
    void api.auth.signOut();
    setStep('password');
    setCode('');
    setError(undefined);
  };

  return (
    <div className="w-full max-w-md border border-neutral-200 bg-white p-8">
      <h1 className="text-title-2xl leading-none text-primary-900">{STEP_TITLES[step]}</h1>

      {step === 'password' && (
        <form onSubmit={submitPassword} className="mt-6 space-y-5">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorText error={error} />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Continue'}
          </Button>
          <p className="text-sm text-neutral-500">
            Forgotten your password? Ask a dashboard admin to reset your account.
          </p>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={submitCode} className="mt-6 space-y-5">
          <p className="text-neutral-600">
            Open your authenticator app and enter the 6-digit code for{' '}
            <strong className="text-primary-900">Al-Rahmah Dashboard</strong>.
          </p>
          <CodeInput value={code} onChange={setCode} autoFocus />
          <ErrorText error={error} />
          <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
            {busy ? 'Checking…' : 'Verify and sign in'}
          </Button>
          <BackLink onClick={back} />
          <p className="text-sm text-neutral-500">
            Lost your phone? Ask a dashboard admin to reset your two-step verification.
          </p>
        </form>
      )}

      {step === 'enroll' && enrollment && (
        <form onSubmit={submitCode} className="mt-6 space-y-5">
          <ol className="list-decimal space-y-2 pl-5 text-neutral-600">
            <li>
              Install an authenticator app such as Google Authenticator, Microsoft Authenticator or
              1Password.
            </li>
            <li>Scan this QR code with the app (or type in the key below).</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          <div className="flex flex-col items-center gap-3 border border-neutral-200 bg-neutral-50 p-4">
            <img
              src={enrollment.qrCode}
              alt="QR code for your authenticator app"
              width={180}
              height={180}
            />
            <p className="text-center text-xs text-neutral-500">
              Key:{' '}
              <code className="font-ui break-all text-primary-900 select-all">
                {enrollment.secret.match(/.{1,4}/g)?.join(' ')}
              </code>
            </p>
          </div>
          <CodeInput value={code} onChange={setCode} />
          <ErrorText error={error} />
          <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
            {busy ? 'Checking…' : 'Turn on and sign in'}
          </Button>
          <BackLink onClick={back} />
        </form>
      )}
    </div>
  );
}

const ErrorText = ({ error }: { error?: string }) =>
  error ? (
    <p role="alert" className="bg-error-50 px-3 py-2 text-sm text-error-700">
      {error}
    </p>
  ) : null;

const BackLink = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="font-label text-xs font-bold tracking-[0.12em] text-primary-500 uppercase hover:text-secondary-700"
  >
    ← Use a different account
  </button>
);
