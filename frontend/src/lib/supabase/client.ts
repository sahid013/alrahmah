import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client (publishable key: safe to expose; Row Level Security protects the
 * data). Used by the dashboard: Supabase Auth for sign-in, and the tables staff edit.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False until the Supabase env vars are set; the dashboard then runs in browser preview mode. */
export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !key) throw new Error('Supabase is not configured.');
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'alrahmah.dashboard.auth' },
  });
  return client;
}

/** The signed-in user's access token, for calling the site's own protected API routes. */
export async function accessToken(): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  if (!data.session) throw new Error('Your session has ended. Please sign in again.');
  return data.session.access_token;
}
