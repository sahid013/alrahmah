import type { CSSProperties } from 'react';
import { DonationCard } from '@/components/donations/donation-card';
import { DonationsOverview } from '@/components/donations/donations-overview';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { StaggerGroup } from '@/components/ui/stagger-group';
import { siteConfig } from '@/config/site';
import { loadDonations } from '@/lib/donations/repository';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Donations',
  description: `Support ${siteConfig.name}: Sadaqah, Zakaah, Jummah giving, monthly giving, iftar and masjid renovations.`,
  path: '/donations',
});

export default async function DonationsPage() {
  const { overview, programs } = await loadDonations();

  return (
    <>
      <PageHero eyebrow={siteConfig.name} title="Donations" />

      <div className="bg-primary-50">
        <Container className="py-16 lg:py-20">
          {/* Featured: the main appeal. */}
          <div className="mb-12 flex flex-col gap-6 border-l-4 border-secondary-500 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
                Our appeal
              </p>
              <p className="mt-2 font-heading text-title-xl tracking-heading text-primary-900 uppercase">
                Make Space for Rahmah
              </p>
              <p className="mt-1 text-neutral-500">
                Help us secure a permanent home for the masjid.
              </p>
            </div>
            <ButtonLink href={siteConfig.links.appeal} variant="secondary" className="shrink-0">
              About the appeal
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>

          {overview && (
            <div className="mb-12">
              <DonationsOverview overview={overview} />
            </div>
          )}

          <h2 className="sr-only">Donation programmes</h2>
          <StaggerGroup>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {programs.map((program, i) => (
                <li key={program.id} className="stagger-item" style={{ '--i': i } as CSSProperties}>
                  <DonationCard program={program} />
                </li>
              ))}
            </ul>
          </StaggerGroup>
        </Container>
      </div>
    </>
  );
}
