import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  ArrowRightIcon,
  CalendarIcon,
  MoonIcon,
  PeopleIcon,
  QuranIcon,
  RingsIcon,
} from '@/components/icons';
import type { Service, ServiceIcon } from '@/lib/services/data';
import { cn } from '@/lib/utils/cn';

const icons: Record<ServiceIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  funeral: MoonIcon,
  nikah: RingsIcon,
  quran: QuranIcon,
  weekly: CalendarIcon,
  sisters: PeopleIcon,
  education: QuranIcon,
};

/**
 * Service tile. At rest: tinted media, inset outline and the service name.
 * On hover/focus (see `.service-card` in globals.css): the tint clears, the outline rotates and
 * fades out, the name lifts and fades out, and the title + description rotate in the opposite
 * way over a dark panel. Touch devices show the revealed state.
 */
export function ServiceCard({ service, className }: { service: Service; className?: string }) {
  const Icon = icons[service.icon];

  return (
    <Link href={service.href} className={cn('service-card group block', className)}>
      {/* Media: photo when supplied, otherwise a brand panel with a line icon. */}
      <div className="service-card__media absolute inset-0 -z-20">
        {service.image ? (
          <Image
            src={service.image.src}
            alt={service.image.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary-700">
            <div aria-hidden className="bg-islamic-pattern absolute inset-0 opacity-[0.07]" />
            <Icon className="relative size-28 text-secondary-300/70 sm:size-32" />
          </div>
        )}
      </div>

      <span aria-hidden className="service-card__tint" />
      <span aria-hidden className="service-card__frame" />

      <span
        aria-hidden
        className="service-card__name font-heading text-title-xl tracking-heading text-secondary-300 uppercase"
      >
        {service.title}
      </span>

      <span aria-hidden className="service-card__shade" />
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
