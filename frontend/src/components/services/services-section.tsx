import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { flattenServices, type Service } from '@/lib/services/data';
import { ServiceCard } from './service-card';

/**
 * Grid positions (desktop, 3 columns × 2 rows): two cards stacked in the left column; on the
 * right, two cards side by side with one wide card below. Extra services fall back to single cells.
 */
const LAYOUT = [
  'lg:col-start-1 lg:row-start-1', // Funerals — left, top
  'lg:col-start-1 lg:row-start-2', // Nikah — left, bottom
  'lg:col-start-2 lg:row-start-1', // Sunday lessons — right, top
  'lg:col-start-3 lg:row-start-1', // Sisters' lessons — right, top
  'sm:col-span-2 lg:col-start-2 lg:row-start-2', // Quran Academy — right, wide below
];

/** Home-page mosaic of the masjid's services (same list as the navbar "Services" menu). */
export function ServicesSection({ items = flattenServices() }: { items?: Service[] }) {
  // Order to suit the grid: left column first, the wide card last.
  const order = [
    'Funerals',
    'Nikah (Marriage)',
    'Sunday Weekly Lessons',
    'Sisters’ Only Lessons',
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
        </Reveal>
        <div className="grid auto-rows-[18rem] gap-4 sm:grid-cols-2 lg:auto-rows-[20rem] lg:grid-cols-3">
          {sorted.map((service, i) => (
            <ServiceCard key={service.href} service={service} className={LAYOUT[i] ?? ''} />
          ))}
        </div>
      </Container>
    </section>
  );
}
