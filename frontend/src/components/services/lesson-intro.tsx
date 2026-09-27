import Image from 'next/image';
import { ArrowRightIcon, PeopleIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { EVENTS_PAGE } from '@/lib/events';

interface LessonIntroProps {
  id: string;
  /** Small sky label above the title (e.g. "Every Sunday evening"). */
  label: string;
  title: string;
  description: string;
  /** Lesson poster at its natural ratio; a patterned placeholder shows until it's supplied. */
  poster?: { src: string; alt: string; width: number; height: number };
}

/**
 * Education lesson page body: a sticky text column (label, title, intro, link to all events)
 * beside the lesson poster.
 */
export function LessonIntro({ id, label, title, description, poster }: LessonIntroProps) {
  const headingId = `${id}-title`;
  return (
    <section aria-labelledby={headingId} className="py-20 sm:py-28">
      <Container className="grid items-start gap-16 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-6">
          <Reveal>
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
              {label}
            </p>
            <h2 id={headingId} className="mt-3 text-title-3xl leading-none sm:text-title-4xl">
              {title}
            </h2>
          </Reveal>
          <Reveal order={1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl">
              {description}
            </p>
          </Reveal>
          <Reveal order={2}>
            <ButtonLink href={EVENTS_PAGE} variant="tertiary" className="mt-6">
              See all events &amp; courses
              <ArrowRightIcon />
            </ButtonLink>
          </Reveal>
        </div>
        <Reveal order={1} className="lg:col-span-6">
          {poster ? (
            <Image
              src={poster.src}
              alt={poster.alt}
              width={poster.width}
              height={poster.height}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="mx-auto w-full max-w-xl lg:mr-0 lg:ml-auto"
            />
          ) : (
            <div
              aria-hidden
              className="relative isolate mx-auto flex aspect-[5/7] w-full max-w-xl items-center justify-center overflow-hidden bg-primary-700 lg:mr-0 lg:ml-auto"
            >
              <div className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.07]" />
              <PeopleIcon className="size-40 text-secondary-300" strokeWidth={0.75} />
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
