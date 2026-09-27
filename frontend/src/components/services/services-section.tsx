import type { CSSProperties } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { StaggerGroup } from '@/components/ui/stagger-group';
import { flattenServices, type Service } from '@/lib/services/data';
import { ServiceCard } from './service-card';

/**
 * Grid positions (desktop, 6-column grid × 2 rows): three equal cards on the first row, two
 * equal cards on the second. Extra services fall back to single cells.
 */
const LAYOUT = [
  'lg:col-span-2', // Funerals
  'lg:col-span-2', // Sunday lessons
  'lg:col-span-2', // Sisters' lessons
  'lg:col-span-3', // Nikah
  'sm:col-span-2 lg:col-span-3', // Quran Academy
];

/** Home-page mosaic of the masjid's services (same list as the navbar "Services" menu). */
export function ServicesSection({ items = flattenServices() }: { items?: Service[] }) {
  // Order to suit the grid: three on the first row, two on the second.
  const order = [
    'Funerals',
    'Sunday Weekly Lessons',
    'Sisters’ Only Lessons',
    'Nikah (Marriage)',
    'Al-Rahmah Quran Academy',
  ];
  const sorted = [...items].sort(
    (a, b) => (order.indexOf(a.title) + 1 || 99) - (order.indexOf(b.title) + 1 || 99),
  );

  return (
    <section aria-labelledby="services-title" className="bg-primary-950 text-white">
      <Container className="py-20 sm:py-28">
        {/* Intro, top-left above the grid. */}
        <Reveal className="mb-10 sm:mb-12">
          <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
            How we can help
          </p>
          <h2
            id="services-title"
            className="mt-3 text-title-4xl leading-none text-white sm:text-title-5xl"
          >
            Services
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-primary-100">
            From life’s milestones to lifelong learning, the masjid is here to serve you and your
            family.
          </p>
          <ButtonLink href="/services" variant="outline-light" size="sm" className="mt-8">
            All services
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </Reveal>
        {/* Cards drop in from above, one after another (same motion as events and impact). */}
        <StaggerGroup>
          <div className="grid auto-rows-[18rem] gap-4 sm:grid-cols-2 lg:auto-rows-[20rem] lg:grid-cols-6">
            {sorted.map((service, i) => (
              <ServiceCard
                key={service.href}
                service={service}
                className={`stagger-item ${LAYOUT[i] ?? ''}`}
                style={{ '--i': i } as CSSProperties}
              />
            ))}
          </div>
        </StaggerGroup>
      </Container>
    </section>
  );
}
