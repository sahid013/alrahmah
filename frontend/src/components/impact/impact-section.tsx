import Image from 'next/image';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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
      <dl className="mt-6 space-y-9">
        {group.stats.map((stat, i) => (
          <div
            key={stat.caption}
            className="stagger-item flex flex-col"
            style={{ '--i': start + i } as CSSProperties}
          >
            {/* Visual order: number then caption; <dt>/<dd> keep the caption as the term. */}
            <dt className="order-2 mt-1 text-lg text-primary-100">{stat.caption}</dt>
            {stat.text ? (
              // Words in place of a figure: smaller, so they wrap neatly in the column.
              <dd className="order-1 font-heading text-title-2xl leading-tight tracking-heading text-balance text-white sm:text-title-3xl">
                {stat.text}
              </dd>
            ) : (
              // 20px under the title-4xl / title-5xl steps (client request, October 2026).
              <dd className="order-1 font-heading text-[length:calc(var(--text-title-4xl)-1.25rem)] leading-none tracking-heading text-white sm:text-[length:calc(var(--text-title-5xl)-1.25rem)]">
                {stat.prefix}
                {new Intl.NumberFormat('en-GB').format(stat.value ?? 0)}
                {stat.unit}
                {stat.suffix && (
                  <span className="ml-1 align-top text-title-2xl text-secondary-300">
                    {stat.suffix}
                  </span>
                )}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Yearly impact in numbers: intro + first group (left), middle figures above the Al-Rahmah
 * graphic (on the section's bottom edge), highlighted right panel. Same on the home page and `/impact-reports`.
 */
export function ImpactSection({ report }: { report: ImpactReport }) {
  // A report PDF opens in a new tab, as on /impact-reports.
  const pdf = !!report.reportUrl?.toLowerCase().endsWith('.pdf');
  const newTab = pdf ? { target: '_blank', rel: 'noopener' } : {};

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
            <Group group={report.primary} start={0} />
          </div>

          {/* Middle: secondary groups + the Al-Rahmah graphic */}
          <div className="flex flex-col lg:col-span-4">
            <div className={cn('grid gap-12', report.secondary.length > 1 && 'grid-cols-2')}>
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
            {/* Sits on the bottom edge (desktop) or on the panel below (phones); well into the left gap, with room on its right. */}
            <div className="mt-16 -mb-16 flex flex-1 items-end justify-center lg:mt-12 lg:mr-4 lg:mb-0 lg:-ml-12 xl:-ml-32">
              <Image
                src="/images/impact/al-rahmah-graphics.webp"
                alt="Illustration of the Al-Rahmah Faith Centre, its walls showing prayer, iftar and the community"
                width={1352}
                height={978}
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="block h-auto w-full max-w-lg lg:max-w-none"
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
