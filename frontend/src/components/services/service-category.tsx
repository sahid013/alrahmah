import type { CSSProperties } from 'react';
import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { StaggerGroup } from '@/components/ui/stagger-group';
import { serviceAnchor, type Service } from '@/lib/services/data';
import { cn } from '@/lib/utils/cn';
import { CourseCard } from './course-card';

/**
 * One top-level service on the all-services page (`/services`): its number and title across the top,
 * then photo beside the summary, key facts and a link to its page; sub-services (Education's courses) follow as cards.
 * `index` alternates the photo side and the background.
 */
export function ServiceCategory({ service, index }: { service: Service; index: number }) {
  const id = serviceAnchor(service);
  const flip = index % 2 === 1;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn('scroll-mt-24 py-20 sm:py-24 lg:scroll-mt-40', flip && 'bg-primary-50')}
    >
      <Container>
        <Reveal className="mb-10 border-b border-neutral-200 pb-8 sm:mb-14">
          <p className="font-ui text-sm font-semibold text-secondary-700 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </p>
          <span aria-hidden className="mt-3 block h-0.5 w-12 bg-secondary-500" />
          <h2
            id={`${id}-title`}
            className="mt-5 text-title-3xl leading-none text-primary-900 sm:text-title-4xl"
          >
            {service.title}
          </h2>
        </Reveal>

        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          {service.image && (
            <Reveal className={cn('lg:col-span-6', flip && 'lg:order-last')}>
              <div className="relative aspect-[4/3] overflow-hidden bg-primary-100">
                <Image
                  src={service.image.src}
                  alt={service.image.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          <div className="lg:col-span-6">
            <Reveal order={1}>
              <p className="max-w-xl text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl">
                {service.summary}
              </p>
            </Reveal>
            {service.facts && (
              <Reveal order={2}>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {service.facts.map((fact) => (
                    <li
                      key={fact}
                      className="border border-secondary-300 bg-white px-3 py-1.5 font-label text-xs font-bold tracking-[0.12em] text-secondary-800 uppercase"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            <Reveal order={3}>
              <ButtonLink href={service.href} className="mt-8">
                {service.children ? `Explore ${service.title.toLowerCase()}` : 'Learn more'}
                <span className="sr-only"> about {service.title}</span>
                <ArrowRightIcon />
              </ButtonLink>
            </Reveal>
          </div>
        </div>

        {service.children && (
          <StaggerGroup>
            <ul className="mt-14 grid gap-8 md:grid-cols-3 lg:gap-10">
              {service.children.map((child, i) => (
                <CourseCard
                  key={child.href}
                  course={child}
                  className="stagger-item"
                  style={{ '--i': i } as CSSProperties}
                />
              ))}
            </ul>
          </StaggerGroup>
        )}
      </Container>
    </section>
  );
}
