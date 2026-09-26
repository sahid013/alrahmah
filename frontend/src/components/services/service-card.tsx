import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import type { Service } from '@/lib/services/data';
import { cn } from '@/lib/utils/cn';

const FALLBACK_IMAGE = { src: '/images/hero/al-rahmah-centre.webp', alt: 'Al-Rahmah Centre' };

/**
 * Service tile. At rest: tinted photo, subtle inset outline and the service name.
 * On hover/focus (see `.service-card` in globals.css): the outline rotates and fades out, the
 * name lifts and fades out, and the title + description rotate in over the same tint (no extra
 * overlay). Touch devices show the revealed state.
 */
export function ServiceCard({ service, className }: { service: Service; className?: string }) {
  const image = service.image ?? FALLBACK_IMAGE;

  return (
    <Link href={service.href} className={cn('service-card group block', className)}>
      {/* Media: full-bleed photo filling the whole tile. */}
      <div className="service-card__media absolute inset-0 -z-20">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <span aria-hidden className="service-card__tint" />
      <span aria-hidden className="service-card__frame" />

      <span
        aria-hidden
        className="service-card__name font-heading text-title-xl tracking-heading text-secondary-300 uppercase"
      >
        {service.title}
      </span>

      <span className="service-card__detail">
        <span className="block font-heading text-title-xl leading-tight tracking-heading text-white uppercase">
          {service.title}
        </span>
        <span className="mt-2 block max-w-lg text-sm leading-relaxed text-primary-100 sm:text-base">
          {service.summary}
        </span>
        <span className="mt-4 inline-flex items-center gap-2 border border-white/40 px-4 py-2 font-label text-xs font-bold tracking-[0.12em] text-white uppercase">
          Learn more
          <ArrowRightIcon className="size-3.5" />
        </span>
      </span>
    </Link>
  );
}
