import { notFound } from 'next/navigation';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DonationFlow } from '@/components/giving/donation-flow';
import { isCauseVisible, loadDonations, loadVisibleDonations } from '@/lib/donations/repository';
import { dailyStatus } from '@/lib/giving/schedule';
import { buildMetadata } from '@/lib/seo';

/**
 * `dynamicParams` stays on (the default): with it off, Next.js can't re-render these prerendered
 * pages after an on-demand refresh (e.g. a prayer-time save revalidates every page) and serves a
 * 404. Unknown ids still 404 through `notFound()` below.
 */
/** Re-render hourly so daily causes open and close on time. */
export const revalidate = 3600;

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

/** One cause's own donation form (chosen on /donate). */
export default async function DonateCausePage({ params }: PageProps<'/donate/[slug]'>) {
  const { slug } = await params;
  const { programs } = await loadDonations();
  const program = programs.find((p) => p.id === slug);
  if (!program) notFound();

  if (!(await isCauseVisible(program.id)))
    return (
      <section className="bg-primary-950 text-white">
        <Container className="max-w-3xl py-20 lg:py-28">
          <h1 className="text-title-3xl leading-none sm:text-title-4xl">{program.title}</h1>
          <p className="mt-6 text-lg text-primary-100">
            Donations to {program.title} aren&apos;t open at the moment. Please check back soon, or
            give to one of our other causes.
          </p>
          <ButtonLink href="/donate" variant="secondary" className="mt-10">
            Donate
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </Container>
      </section>
    );

  if (program.giving.kind === 'daily' && dailyStatus(program.giving) === 'closed')
    return (
      <section className="bg-primary-950 text-white">
        <Container className="max-w-3xl py-20 lg:py-28">
          <h1 className="text-title-3xl leading-none sm:text-title-4xl">{program.title}</h1>
          <p className="mt-6 text-lg text-primary-100">
            Donations for {program.giving.periodLabel} have closed for this year. Jazakum Allahu
            khairan to everyone who gave. Please choose another cause.
          </p>
          <ButtonLink href="/donate" variant="secondary" className="mt-10">
            Select your cause
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </Container>
      </section>
    );

  const { programs: shown } = await loadVisibleDonations();
  return <DonationFlow program={program} canChangeCause={shown.length > 1} />;
}
