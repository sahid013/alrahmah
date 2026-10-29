import { ArrowRightIcon } from '@/components/icons';
import { JsonLd } from '@/components/seo/json-ld';
import { ServiceCategory } from '@/components/services/service-category';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { services } from '@/lib/services/data';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbJsonLd } from '@/lib/structured-data';

export const metadata = buildMetadata({
  title: 'Masjid Services in Leeds',
  description:
    'Funerals, Islamic education for children and adults, and nikah ceremonies at Al-Rahmah Masjid, Leeds. Find the service you need and how to get in touch.',
  path: '/services',
});

/**
 * All services, grouped as in the navbar "Services" menu (`lib/services/data.ts`): one titled
 * section per service (Education with its courses), then a contact band.
 */
export default function ServicesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Services', path: '/services' }])} />
      <PageHero eyebrow="How we can help" title="Our Services">
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-primary-100 sm:text-xl">
          From life’s milestones to lifelong learning, the masjid is here to serve you and your
          family.
        </p>
      </PageHero>

      {services.map((service, i) => (
        <ServiceCategory key={service.href} service={service} index={i} />
      ))}

      <section aria-labelledby="services-help-title" className="bg-primary-900 text-white">
        <Container className="flex flex-col gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <Reveal className="max-w-2xl">
            <h2
              id="services-help-title"
              className="text-title-3xl leading-none text-white sm:text-title-4xl"
            >
              Not sure where to start?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-primary-100">
              Get in touch and we’ll point you to the right person.
            </p>
          </Reveal>
          <Reveal order={1}>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Contact us
              <ArrowRightIcon />
            </ButtonLink>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
