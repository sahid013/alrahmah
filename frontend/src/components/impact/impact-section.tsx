import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';
import type { ImpactGroup, ImpactReport } from '@/lib/impact/data';
import type { PublishedReport } from '@/lib/impact/reports';
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
              {stat.prefix}
              {new Intl.NumberFormat('en-GB').format(stat.value)}
              {stat.unit}
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

/**
 * Yearly impact in numbers: intro + first group, middle figures, highlighted right panel.
 * `emblem`: where the brand emblem sits in the space under the middle figures.
 * `cover`: the report's first page, shown at the top of the left column above the details
 * (home page), linking to `report.reportUrl` (a PDF opens in a new tab); the first group then sits in the middle column.
 */
export function ImpactSection({
  report,
  emblem = 'bottom',
  cover,
}: {
  report: ImpactReport;
  emblem?: 'bottom' | 'middle';
  cover?: PublishedReport['cover'];
}) {
  // With the cover, the left column is cover + intro, so the first group moves to the middle
  // column (under the other figures) to keep the columns balanced.
  const primaryInMiddle = !!cover;
  // A report PDF opens in a new tab, as on /impact-reports.
  const pdf = !!report.reportUrl?.toLowerCase().endsWith('.pdf');
  const newTab = pdf ? { target: '_blank', rel: 'noopener' } : {};
  // Middle column groups, side by side when there are two or more.
  const middle = primaryInMiddle ? [...report.secondary, report.primary] : report.secondary;

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
        <Container className="grid gap-16 pt-20 sm:pt-28 lg:grid-cols-12 lg:gap-12">
          {/* Left: intro + primary group */}
          <div className="flex flex-col gap-16 lg:col-span-4 lg:pb-28">
            <Reveal>
              {cover && (
                <a
                  href={report.reportUrl ?? '/impact-reports'}
                  {...newTab}
                  className="mb-10 block border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-300"
                >
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    width={cover.width}
                    height={cover.height}
                    sizes="(min-width: 1536px) 480px, (min-width: 1024px) 30vw, 100vw"
                    className="h-auto w-full"
                  />
                  {pdf && <span className="sr-only">(opens the PDF in a new tab)</span>}
                </a>
              )}
              <h2 id="impact-title" className="text-title-3xl text-white sm:text-title-4xl">
                {report.year} Impact
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-pretty text-primary-100">
                {report.intro}
              </p>
              {report.note && <p className="mt-4 text-sm text-primary-200">{report.note}</p>}
              {report.reportUrl && (
                <ButtonLink
                  href={report.reportUrl}
                  {...newTab}
                  variant="outline-light"
                  size="sm"
                  className="mt-8"
                >
                  View {report.year} report
                  {pdf && <span className="sr-only"> (opens the PDF in a new tab)</span>}
                  <ArrowRightIcon className="size-4" />
                </ButtonLink>
              )}
            </Reveal>
            {!primaryInMiddle && <Group group={report.primary} start={0} />}
          </div>

          {/* Middle: secondary groups (+ the first group with a cover) + brand emblem */}
          <div className="flex flex-col lg:col-span-4">
            <div className={cn('grid gap-12', middle.length > 1 && 'grid-cols-2')}>
              {middle.map((group, i) => (
                <Group
                  key={group.label}
                  group={group}
                  start={
                    (primaryInMiddle ? 0 : report.primary.stats.length) +
                    middle.slice(0, i).reduce((n, g) => n + g.stats.length, 0)
                  }
                />
              ))}
            </div>
            <div
              className={cn(
                'mt-16 flex flex-1 justify-center lg:mt-12',
                emblem === 'bottom' ? 'items-end' : 'items-center lg:pb-28',
              )}
            >
              <Image
                src={siteConfig.logoMarkLight}
                alt=""
                width={168}
                height={134}
                className="pointer-events-none w-3/5 max-w-sm opacity-15 lg:w-[80%] lg:max-w-none"
              />
            </div>
          </div>

          {/* Right: highlighted panel, centred in the section (same bottom space as the top). */}
          <div className="-mx-4 flex flex-col items-center bg-primary-800 px-4 py-14 sm:-mx-8 sm:px-8 lg:col-span-4 lg:mx-0 lg:justify-center lg:bg-transparent lg:px-0 lg:py-0 lg:pb-28">
            <div className="flex flex-col items-center">
              {/* The prayer badge's building icon (navy), shown white on the dark panel. */}
              <Image
                src="/brand/building-icon.webp"
                alt=""
                width={500}
                height={364}
                sizes="96px"
                className="w-24 brightness-0 invert"
              />
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
