import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { eventScheduleText, getEventHref, type EventItem } from '@/lib/events';

/**
 * Poster-first event card. Shows only the poster (at its natural height). On hover or keyboard
 * focus a deep navy overlay fades in, then its content fades in line by line (opacity only — no
 * movement). Devices without hover get a caption under the poster instead.
 */
export function EventPosterCard({ event }: { event: EventItem }) {
  const schedule = eventScheduleText(event);
  // Staggered fade for overlay content; delays only apply while fading in.
  const fade =
    'opacity-0 transition-opacity duration-500 ease-(--ease-smooth) group-hover:opacity-100 group-focus-within:opacity-100';

  return (
    <article className="group relative border border-secondary-500/0 bg-primary-900 transition-colors duration-500 ease-(--ease-smooth) focus-within:border-secondary-500/10 hover:border-secondary-500/10">
      {event.image ? (
        <Image
          src={event.image.src}
          alt={event.image.alt}
          width={event.image.width}
          height={event.image.height}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
          className="block h-auto w-full"
        />
      ) : (
        <div className="aspect-[5/7] bg-primary-800" />
      )}

      {/* Hover overlay (pointer devices). */}
      <div className="absolute inset-0 hidden flex-col justify-end bg-primary-950 p-6 opacity-0 transition-opacity duration-500 ease-(--ease-smooth) group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:flex">
        <p
          className={`${fade} font-ui text-sm font-medium text-secondary-300 group-hover:delay-100`}
        >
          {schedule}
        </p>
        <h3
          className={`${fade} mt-2 font-heading text-title-xl leading-tight tracking-heading text-white uppercase group-hover:delay-150`}
        >
          {event.title}
        </h3>
        {event.speaker && (
          <p
            className={`${fade} mt-2 font-label text-xs font-bold tracking-[0.12em] text-primary-200 uppercase group-hover:delay-200`}
          >
            With {event.speaker}
          </p>
        )}
        <p
          className={`${fade} mt-3 line-clamp-4 text-sm leading-relaxed text-primary-100 group-hover:delay-250`}
        >
          {event.summary}
        </p>
        <div className={`${fade} mt-5 group-hover:delay-300`}>
          <ButtonLink
            href={getEventHref(event)}
            variant="secondary"
            size="sm"
            aria-label={`Learn more about ${event.title}`}
          >
            Learn more
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>

      {/* Caption (touch devices, no hover). */}
      <div className="bg-white p-5 [@media(hover:hover)]:hidden">
        <p className="font-ui text-sm font-medium text-secondary-700">{schedule}</p>
        <h3 className="mt-1 font-heading text-title-lg leading-tight tracking-heading text-primary-900 uppercase">
          {event.title}
        </h3>
        <ButtonLink
          href={getEventHref(event)}
          variant="tertiary"
          size="xs"
          className="mt-2"
          aria-label={`Learn more about ${event.title}`}
        >
          Learn more
          <ArrowRightIcon className="size-3.5" />
        </ButtonLink>
      </div>
    </article>
  );
}
