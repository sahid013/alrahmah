import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import type { CSSProperties } from 'react';
import { Reveal } from '@/components/ui/reveal';
import { StaggerGroup } from '@/components/ui/stagger-group';
import { EventPosterCard } from './event-poster-card';
import { EVENTS_PAGE, type EventItem } from '@/lib/events';

/** Home-page grid of upcoming events and weekly courses (poster cards). */
export function EventsSection({ events: upcoming }: { events: EventItem[] }) {
  if (!upcoming.length) return null;

  return (
    <section aria-labelledby="events-section-title" className="bg-primary-900 py-20 sm:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <Reveal>
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
              Learn &amp; grow together
            </p>
            <h2
              id="events-section-title"
              className="mt-4 text-title-3xl text-white sm:text-title-4xl"
            >
              Events &amp; Courses
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-primary-100">
              Weekly classes and community gatherings at the masjid. Brothers and sisters are
              welcome.
            </p>
          </Reveal>
          <Reveal order={1}>
            <ButtonLink href={EVENTS_PAGE} variant="tertiary-light" size="sm">
              See all events
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </Reveal>
        </div>

        {/* Cards drop in from above, one after another (same motion as the impact figures). */}
        <StaggerGroup>
          <ul className="mt-12 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((event, i) => (
              <li key={event.id} className="stagger-item" style={{ '--i': i } as CSSProperties}>
                <EventPosterCard event={event} />
              </li>
            ))}
          </ul>
        </StaggerGroup>
      </Container>
    </section>
  );
}
