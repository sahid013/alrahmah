import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { eventScheduleText, getEventHref, type EventItem, type EventSchedule } from '@/lib/events';

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });

/** Light-blue tinted date box — fallback when an event has no poster. */
export function ScheduleBox({
  schedule,
  tone,
}: {
  schedule: EventSchedule;
  tone: 'light' | 'dark';
}) {
  const big =
    schedule.kind === 'once'
      ? dayFormat.format(new Date(`${schedule.date}T12:00:00Z`))
      : schedule.weekday.slice(0, 3);
  const small =
    schedule.kind === 'once'
      ? monthFormat.format(new Date(`${schedule.date}T12:00:00Z`))
      : 'Weekly';
  return (
    <span className="flex w-16 shrink-0 flex-col items-center self-start bg-secondary-500/8 p-1">
      <span
        className={cn(
          'font-ui text-2xl leading-none font-semibold uppercase',
          tone === 'dark' ? 'text-secondary-300' : 'text-primary-500',
        )}
      >
        {big}
      </span>
      <span
        className={cn(
          'mt-1.5 font-label text-[0.65rem] font-bold tracking-[0.15em] uppercase',
          tone === 'dark' ? 'text-primary-200' : 'text-neutral-500',
        )}
      >
        {small}
      </span>
    </span>
  );
}

function LearnMore({ event, tone }: { event: EventItem; tone: 'light' | 'dark' }) {
  return (
    <ButtonLink
      href={getEventHref(event)}
      variant={tone === 'dark' ? 'tertiary-light' : 'tertiary'}
      size="xs"
      className="self-start"
      aria-label={`Learn more about ${event.title}`}
    >
      Learn more
      <ArrowRightIcon className="size-3.5" />
    </ButtonLink>
  );
}

/**
 * One event or course.
 * - `dark`: compact row for the hero strip — poster thumbnail, title, schedule.
 * - `light`: full card for listing pages — poster, schedule, title, summary.
 */
export function EventCard({
  event,
  tone = 'light',
}: {
  event: EventItem;
  tone?: 'light' | 'dark';
}) {
  const schedule = eventScheduleText(event);

  if (tone === 'dark') {
    return (
      <article className="flex h-full gap-5 py-1">
        {event.image ? (
          <Image
            src={event.image.src}
            alt=""
            width={event.image.width}
            height={event.image.height}
            sizes="64px"
            className="aspect-[5/7] w-16 shrink-0 self-start object-cover"
          />
        ) : (
          <ScheduleBox schedule={event.schedule} tone="dark" />
        )}
        <div className="flex min-w-0 flex-col">
          <h3 className="font-heading text-title-sm leading-snug font-normal tracking-[0.05em] text-white uppercase">
            {event.title}
          </h3>
          <p className="mt-1 font-ui text-sm text-primary-200">{schedule}</p>
          <div className="mt-1">
            <LearnMore event={event} tone="dark" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col bg-white">
      {event.image ? (
        <Image
          src={event.image.src}
          alt={event.image.alt}
          width={event.image.width}
          height={event.image.height}
          sizes="(min-width: 1024px) 28rem, (min-width: 640px) 45vw, 100vw"
          className="h-auto w-full"
        />
      ) : (
        <div className="p-6 pb-0">
          <ScheduleBox schedule={event.schedule} tone="light" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-title-xl leading-tight font-normal tracking-heading text-primary-900 uppercase xl:text-title-2xl">
          {event.title}
        </h3>
        <p className="mt-2 font-ui text-base font-medium text-secondary-700">{schedule}</p>
        <p className="mt-4 text-base leading-relaxed text-neutral-500">{event.summary}</p>
        <div className="mt-auto pt-4">
          <LearnMore event={event} tone="light" />
        </div>
      </div>
    </article>
  );
}
