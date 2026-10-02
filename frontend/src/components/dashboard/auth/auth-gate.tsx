'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AUTH_ENABLED, type Session } from '@/lib/dashboard/auth/types';
import { useDashboardApi } from '../dashboard-api-provider';

interface AuthContextValue {
  session: Session;
  /** Reload the session (e.g. after changing your own details). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function useDashboardAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useDashboardAuth must be used inside <AuthGate>');
  return value;
}

/** Used while `AUTH_ENABLED` is off. */
const OPEN_SESSION: Session = {
  user: {
    id: 'open-access',
    name: 'Dashboard',
    email: '',
    role: 'admin',
    mfaEnrolled: false,
    createdAt: '1970-01-01T00:00:00.000Z',
  },
  aal: 'aal2',
};

export const loginHref = (next?: string) =>
  next && next !== '/dashboard'
    ? `/dashboard/login?next=${encodeURIComponent(next)}`
    : '/dashboard/login';

/**
 * Renders children only for a signed-in user (`aal2` session), or for everyone while
 * `AUTH_ENABLED` is off.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const api = useDashboardApi();
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>();

  const refresh = useCallback(async () => {
    const s = await api.auth.getSession();
    setSession(s?.aal === 'aal2' ? s : null);
  }, [api]);

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    let cancelled = false;
    api.auth.getSession().then((s) => {
      if (cancelled) return;
      if (s?.aal === 'aal2') setSession(s);
      else router.replace(loginHref(pathname));
    });
    return () => {
      cancelled = true;
    };
  }, [api, router, pathname]);

  const signOut = useCallback(async () => {
    await api.auth.signOut();
    router.replace('/dashboard/login');
  }, [api, router]);

  // Sign-in switched off: everyone gets an open preview session.
  if (!AUTH_ENABLED)
    return (
      <AuthContext.Provider value={{ session: OPEN_SESSION, refresh, signOut }}>
        {children}
      </AuthContext.Provider>
    );

  if (!session)
    return (
      <div aria-busy="true" className="flex min-h-svh items-center justify-center bg-primary-900">
        <span className="sr-only">Checking your sign-in…</span>
        <span className="size-8 animate-spin border-2 border-white/20 border-t-secondary-400 motion-reduce:animate-none" />
      </div>
    );

  return (
    <AuthContext.Provider value={{ session, refresh, signOut }}>{children}</AuthContext.Provider>
  );
}
