import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { DONATION_CAUSES_TAG } from '@/lib/donations/visibility';
import { AuthError, requireStaff } from '@/lib/supabase/server';

/**
 * POST (dashboard staff only, `Authorization: Bearer <access token>`) after a cause is shown or
 * hidden: drops the website's cached copy, so the donate pages change on the next visit.
 */
export async function POST(request: NextRequest) {
  try {
    await requireStaff(request);
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[donations] revalidate failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not refresh the website.' }, { status: 500 });
  }
  revalidateTag(DONATION_CAUSES_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
