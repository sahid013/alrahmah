import 'server-only';
import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { DashboardUser, Role } from '@/lib/dashboard/auth/types';
import { AuthError, requireStaff } from '@/lib/supabase/server';

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}
export const PROFILE_COLUMNS = 'id,email,name,role,created_at';

/** A team member as the dashboard shows them: profile + sign-in details from Supabase Auth. */
export function toDashboardUser(profile: ProfileRow, authUser?: User | null): DashboardUser {
  return {
    id: profile.id,
    name: profile.name || profile.email,
    email: profile.email,
    role: profile.role,
    mfaEnrolled: (authUser?.factors ?? []).some(
      (f) => f.factor_type === 'totp' && f.status === 'verified',
    ),
    createdAt: profile.created_at,
    ...(authUser?.last_sign_in_at && { lastSignInAt: authUser.last_sign_in_at }),
  };
}

/** Runs `handler` for admins only; maps errors to JSON responses. */
export async function asAdmin(
  request: Request,
  handler: (me: { userId: string }) => Promise<Response>,
): Promise<Response> {
  try {
    const me = await requireStaff(request);
    if (me.role !== 'admin') throw new AuthError('Only admins can manage users.', 403);
    return await handler(me);
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    console.error('[dashboard] users:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
