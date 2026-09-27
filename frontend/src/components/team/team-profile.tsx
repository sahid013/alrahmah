import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import type { TeamMember } from '@/lib/team/data';
import { cn } from '@/lib/utils/cn';

/**
 * One team member: square photo beside the name and bio. `flip` puts the photo on the right
 * on desktop, so consecutive profiles alternate.
 */
export function TeamProfile({ member, flip = false }: { member: TeamMember; flip?: boolean }) {
  const headingId = `${member.id}-name`;
  return (
    <article
      id={member.id}
      aria-labelledby={headingId}
      className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-12 lg:gap-16"
    >
      <Reveal className={cn('lg:col-span-5', flip && 'lg:order-last')}>
        <div className="relative aspect-square overflow-hidden bg-primary-50">
          <Image
            src={member.image.src}
            alt={member.image.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </Reveal>
      <div className="lg:col-span-7">
        <Reveal order={1}>
          {member.role && (
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
              {member.role}
            </p>
          )}
          <h2
            id={headingId}
            className={cn('text-title-3xl leading-none sm:text-title-4xl', member.role && 'mt-3')}
          >
            {member.name}
          </h2>
          <span aria-hidden className="mt-6 block h-0.5 w-10 bg-secondary-500" />
        </Reveal>
        <div className="mt-6 max-w-3xl space-y-5">
          {member.bio.map((paragraph, i) => (
            <Reveal key={paragraph} order={i + 2}>
              <p className="text-lg leading-relaxed text-pretty text-neutral-600">{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </article>
  );
}
