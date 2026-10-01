import { AuthGate } from '@/components/dashboard/auth/auth-gate';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

/**
 * Signed-in area. `AuthGate` requires a two-step (aal2) session. TODO (backend step): also
 * enforce it server-side in `proxy.ts` with Supabase, so pages never render for signed-out users.
 */
export default function PanelLayout({ children }: LayoutProps<'/dashboard'>) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
