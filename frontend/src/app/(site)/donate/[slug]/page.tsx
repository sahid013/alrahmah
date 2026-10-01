import { notFound } from 'next/navigation';
import { DonationFlow } from '@/components/giving/donation-flow';
import { loadDonations } from '@/lib/donations/repository';
import { buildMetadata } from '@/lib/seo';

export const dynamicParams = false;

export async function generateStaticParams() {
  const { programs } = await loadDonations();
  return programs.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: PageProps<'/donate/[slug]'>) {
  const { slug } = await params;
  const { programs } = await loadDonations();
  const program = programs.find((p) => p.id === slug);
  return buildMetadata({
    title: program ? `Donate to ${program.title}` : 'Donate',
    description: program?.summary,
    path: `/donate/${slug}`,
    // TODO: remove once Stripe payments are live (preview takes no payment).
    noindex: true,
  });
}

export default async function DonateCampaignPage({ params }: PageProps<'/donate/[slug]'>) {
  const { slug } = await params;
  const { programs } = await loadDonations();
  if (!programs.some((p) => p.id === slug)) notFound();
  return <DonationFlow programs={programs} initialId={slug} />;
}
