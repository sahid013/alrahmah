import { cache } from 'react';
import { seedDonations } from './data';
import { donationsDataSchema, type DonationsData } from './types';

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
