import 'server-only';
import { NextResponse } from 'next/server';
import { AuthError, requireStaff } from '@/lib/supabase/server';

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
