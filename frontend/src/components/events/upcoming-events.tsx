'use client';

import { useState } from 'react';
import { ChevronIcon } from '@/components/icons';
import { cn } from '@/lib/utils/cn';
import { EventCard } from './event-card';
import type { EventItem } from '@/lib/events';

/** Events shown per page. */
const PAGE_SIZE = 2;

const arrowButton =
  'inline-flex size-10 items-center justify-center border border-white/25 text-white transition-colors duration-300 hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400';

/**
 * Hero events strip for the dark hero: two events per page, with previous/next arrows that
 * slide to the next pair (wrapping round at the ends).
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
      <div className="flex items-center justify-between gap-6 border-t border-white/10 pt-6">
        <h2
          id="upcoming-events-title"
          className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm"
        >
          Upcoming events &amp; courses
        </h2>
        {pages.length > 1 && (
          <div className="flex shrink-0 items-center gap-3">
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

      {/* Sliding track: one full-width panel per page. */}
      <div className="mt-5 overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-(--ease-smooth) motion-reduce:transition-none"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((pair, i) => (
            <ul
              key={i}
              inert={i !== page}
              aria-hidden={i !== page}
              className="grid w-full shrink-0 gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-white/10"
            >
              {pair.map((event) => (
                <li key={event.id} className={cn('sm:px-6 sm:first:pl-0 sm:last:pr-0')}>
                  <EventCard event={event} tone="dark" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
