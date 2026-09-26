import Image from 'next/image';
import { ArrowRightIcon, MosqueIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';
import type { ImpactGroup, ImpactReport } from '@/lib/impact/data';
import { cn } from '@/lib/utils/cn';
import { StaggerGroup } from '@/components/ui/stagger-group';
import type { CSSProperties } from 'react';

/** `start` = this group's first position in the section-wide drop-in sequence. */
function Group({
  group,
  start,
  align = 'left',
}: {
  group: ImpactGroup;
  start: number;
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn(align === 'center' && 'text-center')}>
      <h3 className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
        {group.label}
      </h3>
      <dl className="mt-6 space-y-12">
        {group.stats.map((stat, i) => (
          <div
            key={stat.caption}
            className="stagger-item flex flex-col"
            style={{ '--i': start + i } as CSSProperties}
          >
            {/* Visual order: number then caption; <dt>/<dd> keep the caption as the term. */}
            <dt className="order-2 mt-1 text-lg text-primary-100">{stat.caption}</dt>
            <dd className="order-1 font-heading text-title-4xl leading-none tracking-heading text-white sm:text-title-5xl">
              {new Intl.NumberFormat('en-GB').format(stat.value)}
              {stat.suffix && (
                <span className="ml-1 align-top text-title-2xl text-secondary-300">
                  {stat.suffix}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Yearly impact in numbers: intro + volunteering, middle figures, highlighted community panel. */
export function ImpactSection({ report }: { report: ImpactReport }) {
  return (
    <section
      aria-labelledby="impact-title"
      className="relative isolate overflow-hidden bg-primary-700 text-white"
    >
      {/* Highlighted right panel runs full height on desktop. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 -z-10 hidden w-1/3 bg-primary-800 lg:block"
      />

      <StaggerGroup>
        <Container className="grid gap-16 py-20 sm:py-28 lg:grid-cols-12 lg:gap-12">
          {/* Left: intro + primary group */}
          <div className="flex flex-col gap-16 lg:col-span-4">
            <Reveal>
              <h2 id="impact-title" className="text-title-3xl text-white sm:text-title-4xl">
                {report.year} Impact
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-pretty text-primary-100">
                {report.intro}
              </p>
              {report.reportUrl && (
                <ButtonLink
                  href={report.reportUrl}
                  variant="outline-light"
                  size="sm"
                  className="mt-8"
                >
                  View {report.year} report
                  <ArrowRightIcon className="size-4" />
                </ButtonLink>
              )}
            </Reveal>
            <Group group={report.primary} start={0} />
          </div>

          {/* Middle: secondary groups + brand emblem */}
          <div className="flex flex-col lg:col-span-4">
            <div className="grid grid-cols-2 gap-12">
              {report.secondary.map((group, i) => (
                <Group
                  key={group.label}
                  group={group}
                  start={
                    report.primary.stats.length +
                    report.secondary.slice(0, i).reduce((n, g) => n + g.stats.length, 0)
                  }
                />
              ))}
            </div>
            {/* Emblem sits at the bottom of the column. */}
            <div className="mt-16 flex flex-1 items-end justify-center lg:mt-12">
              <Image
                src={siteConfig.logoMarkLight}
                alt=""
                width={168}
                height={134}
                className="pointer-events-none w-3/5 max-w-sm opacity-15 lg:w-[80%] lg:max-w-none"
              />
            </div>
          </div>

          {/* Right: highlighted panel */}
          <div className="-mx-4 flex flex-col items-center bg-primary-800 px-4 py-14 sm:-mx-8 sm:px-8 lg:col-span-4 lg:mx-0 lg:justify-center lg:bg-transparent lg:px-0 lg:py-0">
            <div className="flex flex-col items-center">
              <MosqueIcon className="h-16 w-20 text-primary-200" />
              <div className="mt-10">
                <Group
                  group={report.featured}
                  align="center"
                  start={
                    report.primary.stats.length +
                    report.secondary.reduce((n, g) => n + g.stats.length, 0)
                  }
                />
              </div>
            </div>
          </div>
        </Container>
      </StaggerGroup>
    </section>
  );
}
