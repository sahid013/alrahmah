import { DonationFlow } from '@/components/giving/donation-flow';
import { loadDonations } from '@/lib/donations/repository';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Donate',
  path: '/give',
  // TODO: remove once Stripe payments are live (preview takes no payment).
  noindex: true,
});

/** General donation page: the donor picks the cause on the first step. */
export default async function GiveIndexPage() {
  const { programs } = await loadDonations();
  return <DonationFlow programs={programs} />;
}
