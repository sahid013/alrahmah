import Image from 'next/image';
import { EVENTS_PAGE, eventScheduleText, getEventHref, type EventItem } from '@/lib/events';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';

/**
 * "Events" nav dropdown: an intro column with a "View all events" button, and the latest
 * 4 events (small poster preview, title, schedule, Learn more). Same frame and fade as `MegaMenu`.
 */
export function EventsMenu({
  id,
  events,
  onNavigate,
}: {
  id: string;
  events: EventItem[];
  onNavigate: () => void;
}) {
  return (
    <div
      id={id}
      className="animate-fade absolute inset-x-4 top-full z-50 grid border border-neutral-200 bg-white sm:inset-x-8 lg:inset-x-16 lg:grid-cols-12"
    >
      <div className="flex flex-col bg-primary-50 p-8 lg:col-span-3 lg:p-10">
        <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase">
          Upcoming
        </p>
        <p className="mt-3 font-heading text-title-2xl leading-tight tracking-heading text-primary-900 uppercase">
          Events &amp; Courses
        </p>
        <p className="mt-3 text-neutral-500">
          Weekly classes and community gatherings. Brothers and sisters are welcome.
        </p>
        <div className="mt-auto pt-8">
          <ButtonLink href={EVENTS_PAGE} size="sm" onClick={onNavigate}>
            View all events
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>

      <nav aria-label="Latest events" className="lg:col-span-9">
        <ul className="grid divide-y divide-neutral-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {events.map((event) => (
            <li key={event.id} className="flex gap-4 p-6 lg:flex-col lg:p-8">
              {event.image && (
                <Image
                  src={event.image.src}
                  alt=""
                  width={event.image.width}
                  height={event.image.height}
                  sizes="64px"
                  className="aspect-[5/7] w-16 shrink-0 self-start object-cover"
                />
              )}
              <div className="flex min-w-0 flex-col">
                <p className="font-heading text-title-base leading-snug tracking-[0.05em] text-primary-900 uppercase">
                  {event.title}
                </p>
                <p className="mt-1 font-ui text-sm text-secondary-700">
                  {eventScheduleText(event)}
                </p>
                <ButtonLink
                  href={getEventHref(event)}
                  variant="tertiary"
                  size="xs"
                  className="mt-1 self-start"
                  onClick={onNavigate}
                  aria-label={`Learn more about ${event.title}`}
                >
                  Learn more
                  <ArrowRightIcon className="size-3.5" />
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
