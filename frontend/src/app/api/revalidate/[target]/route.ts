import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { CAMPAIGNS_TAG } from '@/lib/donations/repository';
import { EVENTS_TAG } from '@/lib/events/repository';
import { KHUTBAHS_TAG } from '@/lib/khutbahs/repository';
import { PRAYER_DAYS_TAG } from '@/lib/prayer/overrides';
import { AuthError, requireStaff } from '@/lib/supabase/server';

/** What the dashboard can refresh on the website, and the cache tag behind each. */
const TAGS: Record<string, string> = {
  'prayer-times': PRAYER_DAYS_TAG,
  campaigns: CAMPAIGNS_TAG,
  khutbahs: KHUTBAHS_TAG,
  events: EVENTS_TAG,
};

/**
 * POST /api/revalidate/<prayer-times|campaigns|khutbahs|events> (dashboard staff only,
 * `Authorization: Bearer <access token>`) after a save: drops the website's cached copy, so the
 * next visit shows the change.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/revalidate/[target]'>,
) {
  const tag = TAGS[(await params).target];
  if (!tag) return NextResponse.json({ error: 'Unknown target.' }, { status: 404 });
  try {
    await requireStaff(request);
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[revalidate] failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not refresh the website.' }, { status: 500 });
  }
  // expire: 0 → the next visitor gets fresh content rather than the old copy.
  revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
