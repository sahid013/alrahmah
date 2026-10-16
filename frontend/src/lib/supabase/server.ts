import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '@/lib/dashboard/auth/types';

/** Server-side Supabase helpers for the site's own API routes. */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 = 401,
  ) {
    super(message);
  }
}

/**
 * Checks a request's `Authorization: Bearer <access token>` belongs to dashboard staff
 * (a `profiles` row, read as that user so Row Level Security applies). Returns their role.
 */
export async function requireStaff(
  request: Request,
): Promise<{ userId: string; role: Role; client: SupabaseClient }> {
  if (!url || !publishableKey) throw new Error('Supabase is not configured.');
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AuthError('Sign in to continue.');

  const client = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth } = await client.auth.getUser(token);
  if (!auth.user) throw new AuthError('Your session has ended. Please sign in again.');

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle<{ role: Role }>();
  if (!profile) throw new AuthError('This account doesn’t have dashboard access.', 403);
  return { userId: auth.user.id, role: profile.role, client };
}

/** Admin client (secret key, bypasses RLS): only for creating/removing staff accounts. */
export function adminClient(): SupabaseClient {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret)
    throw new Error('Adding or removing users needs SUPABASE_SECRET_KEY on the server.');
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
