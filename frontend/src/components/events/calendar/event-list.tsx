import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import {
  EVENT_CATEGORIES,
  eventScheduleText,
  formatTime,
  getEventHref,
  type EventOccurrence,
} from '@/lib/events';

const dayNum = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' });
const dayMeta = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  month: 'short',
  timeZone: 'UTC',
});
const fullDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Agenda of occurrences grouped by day (list view, and the month view on small screens). */
export function EventList({
  byDate,
  today,
}: {
  byDate: Map<string, EventOccurrence[]>;
  today: string;
}) {
  const days = [...byDate.entries()];
  if (!days.length) {
    return (
      <p className="border border-white/10 p-10 text-center text-primary-100">
        No events match this month and filter. Try another month or clear the search.
      </p>
    );
  }

  return (
    <ol className="space-y-6">
      {days.map(([date, items]) => {
        const d = new Date(`${date}T12:00:00Z`);
        return (
          <li
            key={date}
            id={`d-${date}`}
            className="grid scroll-mt-28 gap-4 border-t border-white/10 pt-6 sm:grid-cols-[6rem_1fr] sm:gap-8"
          >
            <h3 className="flex items-baseline gap-3 sm:flex-col sm:gap-1">
              <span className="sr-only">{fullDate.format(d)}</span>
              <span
                aria-hidden
                className={
                  date === today
                    ? 'font-ui text-4xl leading-none font-semibold text-secondary-300'
                    : 'font-ui text-4xl leading-none font-semibold text-white'
                }
              >
                {dayNum.format(d)}
              </span>
              <span
                aria-hidden
                className="font-label text-xs font-bold tracking-[0.15em] text-primary-200 uppercase"
              >
                {dayMeta.format(d)}
                {date === today && ' · Today'}
              </span>
            </h3>
            <ul className="divide-y divide-white/10">
              {items.map(({ event }) => {
                const time = formatTime(event.schedule);
                return (
                  <li key={event.id} className="flex gap-5 py-4 first:pt-0">
                    {event.image && (
                      <Image
                        src={event.image.src}
                        alt=""
                        width={event.image.width}
                        height={event.image.height}
                        sizes="80px"
                        className="aspect-[5/7] w-16 shrink-0 self-start object-cover sm:w-20"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {time && <span className="font-ui text-sm text-secondary-300">{time}</span>}
                        <span className="bg-white/10 px-2 py-0.5 font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-100 uppercase">
                          {EVENT_CATEGORIES[event.category]}
                        </span>
                      </p>
                      <p className="mt-1 font-heading text-title-lg leading-tight tracking-heading text-white uppercase">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm text-primary-200">
                        {eventScheduleText(event)}
                        {event.speaker && ` · With ${event.speaker}`}
                        {event.location && ` · ${event.location}`}
                      </p>
                      <ButtonLink
                        href={getEventHref(event)}
                        variant="tertiary-light"
                        size="xs"
                        className="mt-1"
                        aria-label={`Learn more about ${event.title}`}
                      >
                        Learn more
                        <ArrowRightIcon className="size-3.5" />
                      </ButtonLink>
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
