import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { flattenServices, type Service } from '@/lib/services/data';
import { ServiceCard } from './service-card';

/**
 * Mosaic grid positions (desktop, 4 columns × 3 rows). The intro tile sits top-left (row 1,
 * columns 1–2). Extra services beyond the layout fall back to single cells.
 */
const LAYOUT = [
  'lg:col-span-2 lg:row-span-2 lg:col-start-1 lg:row-start-2', // Funerals — large, under the intro
  'lg:col-start-3 lg:row-span-2 lg:row-start-1', // Quran Academy — tall
  'lg:col-start-4 lg:row-start-1', // Sunday lessons
  'lg:col-start-4 lg:row-start-2', // Sisters' lessons
  'lg:col-span-2 lg:col-start-3 lg:row-start-3', // Nikah — wide
];

/** Home-page mosaic of the masjid's services (same list as the navbar "Services" menu). */
export function ServicesSection({ items = flattenServices() }: { items?: Service[] }) {
  // Order to suit the mosaic: large first, wide last.
  const order = [
    'Funerals',
    'Al-Rahmah Quran Academy',
    'Sunday Weekly Lessons',
    'Sisters’ Only Lessons',
    'Nikah (Marriage)',
  ];
  const sorted = [...items].sort(
    (a, b) => (order.indexOf(a.title) + 1 || 99) - (order.indexOf(b.title) + 1 || 99),
  );

  return (
    <section aria-labelledby="services-title" className="bg-primary-950 text-white">
      <Container className="py-20 sm:py-28">
        <div className="grid auto-rows-[18rem] gap-4 sm:grid-cols-2 lg:auto-rows-[17rem] lg:grid-cols-4">
          {/* Intro tile (top-left on desktop, first on mobile). */}
          <Reveal className="flex flex-col justify-start sm:col-span-2 lg:col-start-1 lg:row-start-1 lg:pr-8">
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
          {sorted.map((service, i) => (
            <ServiceCard key={service.href} service={service} className={LAYOUT[i] ?? ''} />
          ))}
        </div>
      </Container>
    </section>
  );
}
