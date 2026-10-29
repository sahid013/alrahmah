import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  ArrowRightIcon,
  CalendarIcon,
  MoonIcon,
  MosqueIcon,
  PeopleIcon,
  SunIcon,
} from '@/components/icons';
import { Container } from '@/components/ui/container';
import type { DonationProgram } from '@/lib/donations/types';
import { checkoutHref } from '@/lib/giving/links';
import { chargeTimes, dailyStatus, dateRange } from '@/lib/giving/schedule';
import { formatGbp } from '@/lib/giving/types';
import { cn } from '@/lib/utils/cn';

const ICONS: Record<
  NonNullable<DonationProgram['icon']>,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  mosque: MosqueIcon,
  people: PeopleIcon,
  moon: MoonIcon,
  sun: SunIcon,
  calendar: CalendarIcon,
};

/** The short "how you give" line under each cause, e.g. "£5 per person · one-off". */
export function causeTerms(program: DonationProgram, now = new Date()): string {
  const g = program.giving;
  if (g.kind === 'regular') return 'One-off, weekly or monthly';
  if (g.kind === 'per-person') return `${formatGbp(g.unitAmount)} per person · one-off`;
  if (g.kind === 'jumuah') return 'Every Friday · until you cancel';
  const range = dateRange(chargeTimes(g));
  return dailyStatus(g, now) === 'closed'
    ? `Closed · returns next year`
    : `Every ${g.unit} for ${g.count} ${g.unit}s · ${range}`;
}

/**
 * /donate: "Select your cause". A title, then one text-and-icon tile per cause in two columns
 * (no photos or side panel, client request), each opening that cause's own form at
 * /donate/<id>. Closed daily causes stay listed but can't be opened.
 */
export function SelectCause({ programs }: { programs: DonationProgram[] }) {
  const now = new Date();
  return (
    <section aria-labelledby="select-cause-title" className="bg-primary-950 text-white">
      <Container className="py-16 sm:py-20 lg:py-24">
        <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
          Donate
        </p>
        <h1
          id="select-cause-title"
          className="mt-3 text-title-3xl leading-none text-white sm:text-title-4xl"
        >
          Select your cause
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-primary-100">
          Choose where your donation goes. Each cause has its own simple form.
        </p>

        {programs.length === 0 && (
          <p className="mt-12 max-w-2xl border border-white/15 p-6 text-lg text-primary-100">
            Online donations aren&apos;t open at the moment. Please check back soon, or speak to us
            at the masjid.
          </p>
        )}
        <ul className="mt-12 grid gap-4 empty:hidden md:grid-cols-2 lg:gap-6">
          {programs.map((program) => {
            const Icon = program.icon ? ICONS[program.icon] : null;
            const closed =
              program.giving.kind === 'daily' && dailyStatus(program.giving, now) === 'closed';
            const body = (
              <>
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center border border-white/15 bg-white/5 text-secondary-300 sm:size-14"
                >
                  {Icon && <Icon className="size-7" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-title-lg tracking-heading text-white uppercase">
                    {program.title}
                  </span>
                  {program.summary && (
                    <span className="mt-1.5 block text-primary-100">{program.summary}</span>
                  )}
                  <span className="mt-3 block font-ui text-sm text-secondary-300">
                    {causeTerms(program, now)}
                  </span>
                </span>
                {!closed && (
                  <ArrowRightIcon className="hidden size-5 shrink-0 self-center text-secondary-300 sm:block" />
                )}
              </>
            );
            const tile = 'flex h-full items-start gap-4 border p-5 sm:gap-5 sm:p-8';
            return (
              <li key={program.id}>
                {closed ? (
                  <div aria-disabled className={cn(tile, 'border-white/10 opacity-60')}>
                    {body}
                  </div>
                ) : (
                  <Link
                    href={checkoutHref(program.id)}
                    className={cn(
                      tile,
                      'border-white/15 bg-white/[0.02] transition-colors hover:border-secondary-400 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400',
                    )}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
