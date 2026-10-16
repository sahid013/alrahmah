import 'server-only';

/** Cache tag for cause visibility; the dashboard's switch revalidates it. */
export const DONATION_CAUSES_TAG = 'donation-causes';

/**
 * Which causes are switched on in the dashboard (Supabase `donation_causes`), by id. Read with
 * the publishable key, cached and tagged (a dashboard change shows on the next visit; otherwise
 * hourly). Returns null when Supabase isn't configured or can't be reached; callers then show
 * every cause, so donations never break.
 */
export async function causeVisibility(): Promise<Map<string, boolean> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/donation_causes?select=id,visible`, {
      headers: { apikey: key },
      next: { tags: [DONATION_CAUSES_TAG], revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as { id: string; visible: boolean }[];
    return new Map(rows.map((r) => [r.id, r.visible]));
  } catch (error) {
    console.error(
      '[donations] could not load cause visibility',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
