import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { JsonLd } from '@/components/seo/json-ld';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';
import { services } from '@/lib/services/data';
import { servicePageJsonLd } from '@/lib/structured-data';

/** The photo is shared with the home page and `/services` (`lib/services/data.ts`). */
const nikah = services.find((s) => s.href === '/services/nikah')!;

const description =
  'Complete Nikah and marriage services at Al-Rahmah Masjid Leeds. Book at least four weeks in advance, especially in summer.';

export const metadata = buildMetadata({
  title: 'Nikah (Islamic Marriage) in Leeds',
  description,
  path: '/services/nikah',
});

const structuredData = servicePageJsonLd({
  name: 'Nikah',
  serviceType: 'Islamic marriage (nikah) ceremony',
  description,
  path: '/services/nikah',
});

const paragraph = 'text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl';

export default function ServicesNikahPage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <PageHero eyebrow="Services" title="Nikah" />
      <section aria-labelledby="nikah-services-title" className="py-20 sm:py-28">
        <Container className="grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2
                id="nikah-services-title"
                className="text-title-3xl leading-none sm:text-title-4xl"
              >
                Nikah (Marriage) Services
              </h2>
            </Reveal>
            <div className="mt-8 max-w-3xl space-y-6">
              <Reveal order={1}>
                <p className={paragraph}>
                  Complete Nikah and marriage services are available at Al Rahmah Masjid Leeds. It
                  is recommended that the Nikah be scheduled at least four weeks in advance to
                  ensure a seamless process. Planning ahead is essential, especially during the
                  summer months when Nikah ceremonies are in great demand.
                </p>
              </Reveal>
              <Reveal order={2}>
                <p className={paragraph}>
                  Participants in a Nikah are asked to fill out their details on the nikah
                  certificate which can be accessed below.
                </p>
                <ButtonLink
                  href={siteConfig.links.nikahBooking}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  className="mt-6"
                >
                  Book now
                  <ArrowRightIcon />
                </ButtonLink>
              </Reveal>
              <Reveal order={3}>
                <p className="border-l-2 border-secondary-500 pl-5 text-lg leading-relaxed text-pretty text-primary-900 sm:text-xl">
                  Please get in touch with Leeds Register Office at Leeds City Council to schedule a
                  civil ceremony.
                </p>
              </Reveal>
            </div>
          </div>

          {nikah.image && (
            <Reveal order={1} className="lg:col-span-6">
              <div className="relative aspect-[4/3] overflow-hidden bg-primary-100">
                <Image
                  src={nikah.image.src}
                  alt={nikah.image.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
        </Container>
      </section>
    </>
  );
}
