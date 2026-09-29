'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowRightIcon, ChevronIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { eventScheduleText, getEventHref, type EventItem } from '@/lib/events';
import { ScheduleBox } from './event-card';

/** Events shown per page. */
const PAGE_SIZE = 2;

const arrowButton =
  'inline-flex size-9 items-center justify-center border border-white/30 text-white transition-colors duration-300 hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400';

/**
 * Hero events panel: a label + arrows over the photo, then a solid white panel with two events
 * per page (poster thumbnail, title, schedule, Learn more). Arrows slide to the next pair,
 * wrapping round at the ends. On desktop the hero anchors it to the bottom-right edge.
 */
export function UpcomingEvents({ events, className }: { events: EventItem[]; className?: string }) {
  const pages = Array.from({ length: Math.ceil(events.length / PAGE_SIZE) }, (_, i) =>
    events.slice(i * PAGE_SIZE, i * PAGE_SIZE + PAGE_SIZE),
  );
  const [page, setPage] = useState(0);

  if (!events.length) return null;

  const go = (delta: number) => setPage((p) => (p + delta + pages.length) % pages.length);

  return (
    <section aria-labelledby="upcoming-events-title" className={className}>
      <div className="flex items-center gap-4 px-4 pb-4 sm:px-8 lg:px-8">
        <h2
          id="upcoming-events-title"
          className="font-label text-xs font-bold tracking-[0.3em] text-white uppercase sm:text-sm"
        >
          Upcoming events &amp; courses
        </h2>
        {pages.length > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous events"
              className={arrowButton}
            >
              <ChevronIcon direction="left" className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next events"
              className={arrowButton}
            >
              <ChevronIcon direction="right" className="size-4" />
            </button>
          </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        Showing events {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, events.length)}{' '}
        of {events.length}
      </p>

      {/* Solid panel with a sliding track: one full-width page per pair. */}
      <div className="overflow-hidden bg-white">
        <div
          className="flex transition-transform duration-700 ease-(--ease-smooth) motion-reduce:transition-none"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((pair, i) => (
            <ul
              key={i}
              inert={i !== page}
              aria-hidden={i !== page}
              className="grid w-full shrink-0 divide-y divide-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
            >
              {pair.map((event) => (
                <li key={event.id} className="flex gap-5 p-5 sm:p-6">
                  {event.image ? (
                    <Image
                      src={event.image.src}
                      alt=""
                      width={event.image.width}
                      height={event.image.height}
                      sizes="72px"
                      className="aspect-[5/7] w-[4.5rem] shrink-0 self-start object-cover"
                    />
                  ) : (
                    <ScheduleBox schedule={event.schedule} tone="light" />
                  )}
                  <div className="flex min-w-0 flex-col">
                    <h3 className="font-heading text-title-sm leading-snug font-normal tracking-[0.05em] text-primary-900 uppercase">
                      {event.title}
                    </h3>
                    <p className="mt-1 font-ui text-sm text-secondary-700">
                      {eventScheduleText(event)}
                    </p>
                    <ButtonLink
                      href={getEventHref(event)}
                      variant="tertiary"
                      size="xs"
                      className="mt-1 self-start"
                      aria-label={`Learn more about ${event.title}`}
                    >
                      Learn more
                      <ArrowRightIcon className="size-3.5" />
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
