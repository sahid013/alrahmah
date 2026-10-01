import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ArrowRightIcon, HeartIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { formatPrice } from '@/lib/donations/format';
import type { DonationProgram } from '@/lib/donations/types';
import { cn } from '@/lib/utils/cn';
import { DonationTracker } from './donation-tracker';

const isExternal = (href: string) => /^https?:\/\//.test(href);

/**
 * Reusable donation programme card: square poster, title, optional price, summary, optional
 * tracker and a full-width call to action. Everything comes from the programme data, so cards
 * can be added, removed or reordered from the dashboard without code changes.
 */
export function DonationCard({
  program,
  className,
  style,
}: {
  program: DonationProgram;
  className?: string;
  style?: CSSProperties;
}) {
  const external = isExternal(program.cta.href);

  return (
    <article
      id={program.id}
      aria-labelledby={`${program.id}-title`}
      className={cn(
        'group flex h-full scroll-mt-28 flex-col border border-neutral-200 bg-white',
        className,
      )}
      style={style}
    >
      <div className="relative aspect-square overflow-hidden bg-primary-50">
        <Image
          src={program.image.src}
          alt={program.image.alt}
          fill
          sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-700 ease-(--ease-smooth) group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3
          id={`${program.id}-title`}
          className="font-heading text-title-lg leading-tight tracking-heading text-primary-900 uppercase"
        >
          {program.title}
        </h3>
        {program.price && (
          <p className="mt-2 font-ui text-base font-semibold text-secondary-700">
            {formatPrice(program.price)}
          </p>
        )}
        {program.summary && (
          <p className="mt-3 text-base leading-relaxed text-neutral-500">{program.summary}</p>
        )}
        {program.tracker && <DonationTracker tracker={program.tracker} className="mt-6" />}
        <div className="mt-auto pt-6">
          <ButtonLink
            href={program.cta.href}
            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
            className="w-full"
            aria-label={`${program.cta.label}: ${program.title}${external ? ' (opens in a new tab)' : ''}`}
          >
            <HeartIcon className="size-4 text-secondary-300" />
            {program.cta.label}
            {external && <ArrowRightIcon className="size-4" />}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
