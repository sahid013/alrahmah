import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';

/**
 * Centred welcome section: salaam title, script translation, short intro and one call to action.
 * Each line reveals from the left in sequence as it scrolls into view.
 */
export function GreetingSection() {
  return (
    <section aria-labelledby="greeting-title" className="bg-primary-50 py-20 sm:py-28 lg:py-32">
      <Container className="flex flex-col items-center text-center">
        <Reveal>
          <h2
            id="greeting-title"
            className="text-title-4xl leading-none sm:text-title-5xl lg:text-title-6xl"
          >
            Assalamu Alaykum
          </h2>
        </Reveal>
        <Reveal order={1}>
          {/* Decorative translation in the script accent font (not a heading). */}
          <p className="-mt-1 font-script text-[2.75rem] leading-tight text-balance text-secondary-700 sm:text-6xl lg:text-7xl">
            Peace Be Upon You
          </p>
        </Reveal>
        <Reveal order={2}>
          <p className="mx-auto mt-8 max-w-4xl text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl">
            At Al Rahmah Masjid, the doors are open to visitors throughout the year, creating an
            atmosphere of inclusivity and warmth. Many individuals from diverse backgrounds and
            beliefs come with a desire to learn more about the mosque and the teachings of the
            Islamic faith.
          </p>
        </Reveal>
        <Reveal order={3}>
          <ButtonLink href="/about" size="lg" className="mt-10">
            Learn about us
            <ArrowRightIcon />
          </ButtonLink>
        </Reveal>
      </Container>
    </section>
  );
}
