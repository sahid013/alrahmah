import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { Text } from '@/components/ui/typography';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Volunteering',
  description: `Volunteer at ${siteConfig.name}, ${siteConfig.address.locality}. Volunteers with a sincere desire to help the Muslim community are always welcome to join.`,
  path: '/volunteering',
});

export default function VolunteeringPage() {
  return (
    <>
      {/* Page header: pulled up under the transparent site header. */}
      <div className="relative isolate -mt-16 overflow-hidden bg-primary-900 pt-[calc(4rem+4rem)] pb-16 text-white lg:-mt-[4.5rem] lg:pt-[calc(4.5rem+5rem)] lg:pb-20">
        <div aria-hidden className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.05]" />
        <Container>
          <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
            Get involved
          </p>
          <h1 className="mt-3 text-title-4xl text-white sm:text-title-5xl">Volunteering</h1>
        </Container>
      </div>

      <Container className="py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="max-w-xl space-y-6">
              <Text size="lead">
                Al Rahmah Masjid values the contributions its volunteers provide to the community.
                Volunteers at Al Rahmah Masjid represent a wide range of ages, ethnicities,
                education levels, and professional and life experiences, all of which enrich the
                quality of our programmes and services. We recognise their efforts and value their
                commitment to their chosen fields.
              </Text>
              <Text size="lead">
                Volunteering is a great way to fulfil your obligation to the community. Volunteers
                with a sincere desire to help the Muslim community are always welcome to join.
              </Text>
            </div>
            <ButtonLink
              href={siteConfig.links.volunteerForm}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="mt-10"
              aria-label="Apply to volunteer (opens the application form in a new tab)"
            >
              Apply to volunteer
              <ArrowRightIcon />
            </ButtonLink>
          </Reveal>
          <Reveal order={1}>
            <Image
              src="/images/volunteering/volunteering.webp"
              alt="Hands joined together — volunteering is a great way to fulfil the sadaqah obligation"
              width={924}
              height={603}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-auto w-full"
            />
          </Reveal>
        </div>
      </Container>
    </>
  );
}
