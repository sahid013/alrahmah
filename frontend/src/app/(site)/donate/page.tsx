import { SelectCause } from '@/components/giving/select-cause';
import { loadDonations } from '@/lib/donations/repository';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Donate',
  description: 'Select your cause: Masjid Expansion, Fitrana, Last 10 Nights or Dhul Hijjah.',
  path: '/donate',
  // TODO: remove once Stripe payments are live (preview takes no payment).
  noindex: true,
});

/** Re-render hourly so daily causes open and close on time. */
export const revalidate = 3600;

/** General donation page: "Select your cause", then each cause's own form at /donate/<id>. */
export default async function DonatePage() {
  const { programs } = await loadDonations();
  return <SelectCause programs={programs} />;
}
