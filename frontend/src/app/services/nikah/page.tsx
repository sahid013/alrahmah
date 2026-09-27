import { ArrowRightIcon, RingsIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Nikah (Marriage) Services',
  description:
    'Complete Nikah and marriage services at Al-Rahmah Masjid Leeds. Book at least four weeks in advance, especially in summer.',
  path: '/services/nikah',
});

const paragraph = 'text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl';

export default function ServicesNikahPage() {
  return (
    <>
      <PageHero eyebrow="Services" title="Nikaah" />
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
                <ButtonLink href={siteConfig.links.nikahBooking} size="lg" className="mt-6">
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

          {/* TODO: replace with the nikah certificate photo (public/images/services/nikah-certificate.webp). */}
          <Reveal order={1} className="lg:col-span-6">
            <div
              aria-hidden
              className="relative isolate flex aspect-[4/3] items-center justify-center overflow-hidden bg-primary-700"
            >
              <div className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.07]" />
              <RingsIcon className="size-40 text-secondary-300 sm:size-56" strokeWidth={0.75} />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
