import 'server-only';
import { cache } from 'react';
import { seedDonations } from './data';
import { CAMPAIGN_COLUMNS, rowToProgram, type CampaignRow } from './rows';
import { donationsDataSchema, type DonationProgram, type DonationsData } from './types';

/** Cache tag for campaigns; every dashboard save revalidates it (`/api/revalidate/campaigns`). */
export const CAMPAIGNS_TAG = 'campaigns';

const seed = () => donationsDataSchema.parse(seedDonations);

/**
 * Campaigns from Supabase (`campaigns`, edited in the dashboard), in display order. Read with the
 * publishable key, cached and tagged (a dashboard save shows on the next visit; otherwise
 * hourly). Null when Supabase isn't configured or can't be reached.
 */
const loadRows = cache(async (): Promise<CampaignRow[] | null> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/campaigns?select=${CAMPAIGN_COLUMNS}&order=sort_order.asc,title.asc`,
      { headers: { apikey: key }, next: { tags: [CAMPAIGNS_TAG], revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as CampaignRow[];
  } catch (error) {
    console.error(
      '[donations] could not load campaigns',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
});

/** Each non-archived campaign with whether it's shown on the website (status active). */
const loadCampaigns = cache(async (): Promise<{ program: DonationProgram; shown: boolean }[]> => {
  const rows = await loadRows();
  // Fallback (no database): the causes in code, with only the standard (regular) ones shown.
  if (!rows)
    return seed().programs.map((program) => ({
      program,
      shown: program.giving.kind === 'regular',
    }));
  return rows
    .filter((row) => row.status !== 'archived')
    .flatMap((row) => {
      try {
        return [{ program: rowToProgram(row), shown: row.status === 'active' }];
      } catch {
        // One bad row shouldn't take the donation pages down.
        console.error('[donations] skipped an invalid campaign', row.id);
        return [];
      }
    });
});

/**
 * Every live (non-archived) programme, shown or not: for routes and the payment server, which
 * also need causes that are switched off. The page-level `overview` tracker stays in code.
 */
export const loadDonations = cache(async (): Promise<DonationsData> => {
  const campaigns = await loadCampaigns();
  return { overview: seed().overview, programs: campaigns.map((c) => c.program) };
});

/** True when the cause is switched on in the dashboard (campaign status active). */
export async function isCauseVisible(id: string): Promise<boolean> {
  return (await loadCampaigns()).some((c) => c.program.id === id && c.shown);
}

/** Programmes as the public site shows them: only active campaigns, in dashboard order. */
export async function loadVisibleDonations(): Promise<DonationsData> {
  const campaigns = await loadCampaigns();
  return {
    overview: seed().overview,
    programs: campaigns.filter((c) => c.shown).map((c) => c.program),
  };
}
