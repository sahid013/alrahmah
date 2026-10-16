import { SelectCause } from '@/components/giving/select-cause';
import { redirect } from 'next/navigation';
import { loadVisibleDonations } from '@/lib/donations/repository';
import { checkoutHref } from '@/lib/giving/links';
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

/**
 * General donation page: "Select your cause" (causes switched on in the dashboard), then each
 * cause's own form at /donate/<id>. With only one cause on (e.g. before Ramadan) there's nothing
 * to choose, so it goes straight to that form.
 */
export default async function DonatePage() {
  const { programs } = await loadVisibleDonations();
  if (programs.length === 1) redirect(checkoutHref(programs[0]!.id));
  return <SelectCause programs={programs} />;
}
