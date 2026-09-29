import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ArrowRightIcon, HeartIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { StaggerGroup } from '@/components/ui/stagger-group';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

/**
 * Short summary of the "Make Space for Rahmah" appeal. Figures and wording come from the
 * official appeal website (siteConfig.links.appealWebsite), which this page promotes for the
 * full details — keep the two in sync when the appeal is updated.
 */
export const metadata = buildMetadata({
  title: 'Make Space for Rahmah — Our Appeal',
  description:
    'Help Al-Rahmah Masjid Leeds secure a permanent home. We have outgrown our current premises; together we can raise £1,000,000 towards a new masjid and Islamic education centre.',
  path: '/appeal',
});

const { appealWebsite, appealDonate } = siteConfig.links;
const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const step = (i: number) => ({ '--i': i }) as CSSProperties;

const NEED = [
  { value: '300', caption: 'Current capacity' },
  { value: '1,500', caption: 'Capacity of the new home' },
  { value: '120', caption: 'Children in our madrassah' },
];

const VISION = [
  {
    title: 'Youth Development Centre',
    text: 'A dedicated space for our young people to learn, grow and belong.',
  },
  {
    title: 'Sisters’ Community & Learning Space',
    text: 'Room for sisters to pray, learn and attend Jumuʿah — something our current building cannot offer.',
  },
  {
    title: 'Classrooms & Madrassah Expansion',
    text: 'More classrooms so more children can learn the Qur’an and their deen.',
  },
];

const WAYS = [
  '£1,000 Founding Donor',
  '£500',
  '£250',
  '£100',
  '£50',
  '£10 weekly',
  'Monthly standing order',
];

const label = 'font-label text-xs font-bold tracking-[0.3em] uppercase sm:text-sm';

export default function AppealPage() {
  return (
    <>
      {/* Hero — full-bleed photo of the new property, same left-to-right scrim as the home
          hero for contrast. Pulled up under the transparent header. */}
      <section className="relative isolate -mt-16 overflow-hidden bg-primary-950 pt-[calc(4rem+4rem)] pb-20 text-white lg:-mt-[8.5rem] lg:flex lg:min-h-[80svh] lg:items-center lg:pt-[calc(8.5rem+4rem)] lg:pb-24">
        <Image
          src="/images/appeal/appeal-hero.webp"
          alt="Aerial view of the property proposed as Al-Rahmah Masjid’s new home, with its car park"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden className="hero-scrim absolute inset-0 -z-10" />
        <Container>
          <Reveal className="max-w-2xl">
            <p className={`${label} text-secondary-300`}>Our Appeal</p>
            <h1 className="mt-6 font-heading text-title-4xl leading-[1.05] font-normal tracking-heading text-white uppercase sm:text-title-5xl xl:text-title-6xl">
              Make Space for Rahmah
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-primary-100">
              We have outgrown our current premises, and the building is now limiting the work of
              the masjid. With your support, we can move to a home that serves the whole community.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href={appealDonate} variant="secondary" size="lg">
                <HeartIcon />
                Donate now
              </ButtonLink>
              <ButtonLink href={appealWebsite} {...external} variant="outline-light" size="lg">
                Full appeal details
                <ArrowRightIcon />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* The need */}
      <section aria-labelledby="need-title" className="bg-white py-20 sm:py-24">
        <Container>
          <Reveal className="max-w-3xl">
            <p className={`${label} text-secondary-700`}>The need</p>
            <h2 id="need-title" className="mt-3 text-title-3xl sm:text-title-4xl">
              We have outgrown our home
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-500">
              Our building can no longer keep up with the community it serves. Sisters currently
              cannot attend Jumuʿah because there simply isn’t space.
            </p>
          </Reveal>
          <StaggerGroup>
            <dl className="mt-12 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
              {NEED.map((stat, i) => (
                <div
                  key={stat.caption}
                  className="stagger-item flex flex-col bg-white p-8"
                  style={step(i)}
                >
                  <dt className="order-2 mt-2 text-neutral-500">{stat.caption}</dt>
                  <dd className="order-1 font-heading text-title-5xl leading-none text-primary-500">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </StaggerGroup>
        </Container>
      </section>

      {/* The opportunity + vision */}
      <section aria-labelledby="vision-title" className="bg-primary-50 py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className={`${label} text-secondary-700`}>The opportunity</p>
            <h2 id="vision-title" className="mt-3 text-title-3xl sm:text-title-4xl">
              A permanent home for Rahmah
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-500">
              A large warehouse with a substantial car park and a separate building for income
              generation — ready to become a masjid and Islamic education centre, held as waqf for
              generations to come.
            </p>
          </Reveal>
          <StaggerGroup className="lg:col-span-7">
            <ul className="grid gap-4">
              {VISION.map((item, i) => (
                <li
                  key={item.title}
                  className="stagger-item border-l-2 border-secondary-500 bg-white p-6"
                  style={step(i)}
                >
                  <h3 className="font-heading text-title-lg tracking-heading text-primary-900 uppercase">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-neutral-500">{item.text}</p>
                </li>
              ))}
            </ul>
          </StaggerGroup>
        </Container>
      </section>

      {/* The goal */}
      <section aria-labelledby="goal-title" className="bg-primary-900 py-20 text-white sm:py-24">
        <Container>
          <Reveal className="max-w-4xl">
            <p className={`${label} text-secondary-300`}>Our goal</p>
            <h2 id="goal-title" className="mt-3 text-title-3xl text-white sm:text-title-4xl">
              1,000 people × £1,000
            </h2>
            <p className="mt-4 max-w-[550px] text-lg leading-relaxed text-primary-100">
              The property costs £2,000,000. Our community target is{' '}
              <strong className="font-bold text-white">£1,000,000</strong> — and if 1,000 of us each
              give £1,000, we will reach it together.
            </p>
          </Reveal>
          <Reveal order={1}>
            <p className={`${label} mt-12 text-primary-200`}>Ways you can help</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {WAYS.map((way) => (
                <li
                  key={way}
                  className="border border-white/20 px-4 py-2 font-ui text-sm text-white"
                >
                  {way}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href={appealDonate} variant="secondary" size="lg">
                <HeartIcon />
                Donate now
              </ButtonLink>
              <ButtonLink href={appealWebsite} {...external} variant="outline-light" size="lg">
                See all ways to give
                <ArrowRightIcon />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Hadith + hand-off to the full appeal website */}
      <section aria-labelledby="reward-title" className="bg-white py-20 sm:py-24">
        <Container className="flex flex-col items-center text-center">
          <Reveal className="max-w-3xl">
            <p className={`${label} text-secondary-700`}>A reward that continues</p>
            <h2 id="reward-title" className="sr-only">
              A reward that continues after you have passed
            </h2>
            <blockquote className="mt-6 font-heading text-title-2xl leading-snug text-primary-900 sm:text-title-3xl">
              “Whoever builds a masjid for Allah, even if it is only like the small hollow a bird
              makes for its eggs, Allah will build for him a house in Paradise.”
            </blockquote>
          </Reveal>
          <Reveal order={1} className="mt-12 max-w-2xl">
            <p className="text-lg leading-relaxed text-neutral-500">
              Read the full story, see the property and find every way to support the appeal on the
              official Make Space for Rahmah website.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <ButtonLink href={appealWebsite} {...external} size="lg">
                Visit makespaceforrahmah.com
                <ArrowRightIcon />
              </ButtonLink>
              <ButtonLink href={appealDonate} variant="outline" size="lg">
                <HeartIcon />
                Donate now
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
