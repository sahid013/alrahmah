import { cache } from 'react';
import { seedDonations } from './data';
import { donationsDataSchema, type DonationProgram, type DonationsData } from './types';
import { causeVisibility } from './visibility';

/**
 * The ONLY place that knows where donation programmes come from (server-side).
 *
 * To connect the dashboard: replace the body of `loadDonations` with the API call, e.g.
 *   const { data } = await api.get<unknown>('/donations', { next: { tags: ['donations'] } });
 * and keep the validation. Adding / removing / reordering programmes then happens in the
 * dashboard with no code changes.
 */
export const loadDonations = cache(async (): Promise<DonationsData> => {
  const raw: unknown = seedDonations;
  return donationsDataSchema.parse(raw);
});

/** True when the dashboard has the cause switched on (or visibility is unknown). */
export async function isCauseVisible(id: string): Promise<boolean> {
  return (await causeVisibility())?.get(id) ?? true;
}

/**
 * Programmes as the public site shows them: only causes switched on in the dashboard
 * ("Shown on the website"). E.g. before Ramadan only the main appeal is on.
 */
export async function loadVisibleDonations(): Promise<DonationsData> {
  const [data, visibility] = await Promise.all([loadDonations(), causeVisibility()]);
  const shown = (p: DonationProgram) => visibility?.get(p.id) ?? true;
  return { ...data, programs: data.programs.filter(shown) };
}
