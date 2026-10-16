import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { PRAYER_DAYS_TAG } from '@/lib/prayer/overrides';
import { AuthError, requireStaff } from '@/lib/supabase/server';

/**
 * POST (dashboard staff only, `Authorization: Bearer <access token>`) after prayer times are
 * saved: drops the website's cached copy, so the next visit shows the new times.
 */
export async function POST(request: NextRequest) {
  try {
    await requireStaff(request);
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[prayer] revalidate failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not refresh the website.' }, { status: 500 });
  }
  // expire: 0 → the next visitor gets fresh times rather than the old copy.
  revalidateTag(PRAYER_DAYS_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
