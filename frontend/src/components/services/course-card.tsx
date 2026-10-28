import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import type { Service } from '@/lib/services/data';
import { cn } from '@/lib/utils/cn';

/**
 * Bordered card for a sub-service (e.g. a course): photo, key facts in sky caps, title, summary
 * and "Learn more". Used on the Education overview and the all-services page.
 */
export function CourseCard({
  course,
  headingLevel: Heading = 'h3',
  className,
  style,
}: {
  course: Service;
  headingLevel?: 'h3' | 'h4';
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <li className={cn(className)} style={style}>
      <Link
        href={course.href}
        className="group flex h-full flex-col border border-neutral-200 bg-white transition-colors duration-500 hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-500"
      >
        {course.image && (
          <div className="relative aspect-[4/3] overflow-hidden bg-primary-50">
            <Image
              src={course.image.src}
              alt={course.image.alt}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-6 sm:p-8">
          {course.facts && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 font-label text-xs font-bold tracking-[0.12em] text-secondary-700 uppercase">
              {course.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}
          <Heading className="mt-3 text-title-2xl leading-tight text-primary-900">
            {course.title}
          </Heading>
          <p className="mt-3 leading-relaxed text-neutral-600">{course.summary}</p>
          <span className="mt-auto inline-flex items-center gap-2 pt-6 font-label text-sm font-bold tracking-[0.12em] text-primary-500 uppercase transition-colors group-hover:text-secondary-700">
            Learn more
            <ArrowRightIcon className="size-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}
