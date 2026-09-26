'use client';

import { useState, type ComponentType, type SVGProps } from 'react';
import {
  AfternoonIcon,
  CalendarIcon,
  ChevronIcon,
  CloseIcon,
  MoonIcon,
  SunIcon,
  SunriseIcon,
  SunsetIcon,
} from '@/components/icons';
import { FlipNumber } from '@/components/ui/flip-number';
import { siteConfig } from '@/config/site';
import { useSalahCountdown } from '@/lib/hooks/use-salah-countdown';
import {
  addDays,
  formatHijriDate,
  formatLongDate,
  formatSalahTime,
  formatShortDate,
  getDayTimetable,
  getNextFriday,
  isSameLocalDay,
  type SalahId,
} from '@/lib/prayer-times';
import { cn } from '@/lib/utils/cn';

const salahIcons: Record<SalahId, ComponentType<SVGProps<SVGSVGElement>>> = {
  fajr: SunriseIcon,
  dhuhr: SunIcon,
  asr: AfternoonIcon,
  maghrib: SunsetIcon,
  isha: MoonIcon,
};

const squareButton =
  'inline-flex size-11 items-center justify-center border border-white/20 text-white transition-colors duration-300 hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400 disabled:pointer-events-none disabled:opacity-30';

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      {/* Sized so three units fit the countdown column at every breakpoint. */}
      <FlipNumber value={value} tone="dark" className="text-3xl lg:text-[1.375rem] xl:text-4xl" />
      <span className="mt-3 text-xs font-bold tracking-[0.25em] text-secondary-300">{label}</span>
    </div>
  );
}

/** Contents of the prayer times popup: live countdown + day-by-day timetable. */
export function PrayerTimesPanel({ onClose }: { onClose: () => void }) {
  const { now, next, hours, minutes, seconds } = useSalahCountdown();
  const [dayOffset, setDayOffset] = useState(0);

  if (!now || !next) return <div className="min-h-[36rem]" aria-busy="true" />;

  const selected = addDays(now, dayOffset);
  const day = getDayTimetable(selected);
  const friday = getNextFriday(now);
  const isToday = dayOffset === 0;
  const NextIcon = salahIcons[next.id];
  const hasJamaah = day.salah.some((s) => s.jamaah);

  return (
    <div className="relative grid lg:grid-cols-12">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close prayer times"
        className={cn(squareButton, 'absolute top-4 right-4 z-10 size-12')}
      >
        <CloseIcon />
      </button>

      {/* Countdown */}
      <section
        aria-label="Countdown to next salah"
        className="flex flex-col items-center justify-center bg-primary-800 px-6 py-12 text-center lg:col-span-4 lg:px-10"
      >
        <NextIcon className="size-16 text-secondary-400" />
        <p className="mt-6 text-sm text-primary-200">{formatLongDate(now)}</p>
        <p className="text-sm text-primary-200">{siteConfig.name}</p>
        <div className="mt-8 flex gap-4 xl:gap-5" role="timer" aria-live="off">
          <CountdownUnit value={hours} label="HRS" />
          <CountdownUnit value={minutes} label="MIN" />
          <CountdownUnit value={seconds} label="SEC" />
        </div>
        {/* Numbers must stay unambiguous: the title font's figures (3 vs 5) are too decorative for times. */}
        <p className="mt-8 font-ui text-xl font-semibold">
          Until {next.name} at {formatSalahTime(next.time)}
        </p>
        <p className="mt-1 text-primary-200">Current time: {formatSalahTime(now)}</p>
      </section>

      {/* Timetable */}
      <section className="px-6 py-10 sm:px-10 lg:col-span-8 lg:px-12 lg:py-12">
        <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase">
          Prayer times
        </p>
        <h2
          id="prayer-times-title"
          className="mt-3 pr-14 font-heading text-title-3xl leading-tight font-normal tracking-heading text-white uppercase sm:text-title-4xl"
        >
          {siteConfig.name}, {siteConfig.address.locality}
        </h2>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <p className="border border-white/20 px-4 py-2.5 font-label text-sm font-bold tracking-[0.12em] uppercase">
            {formatLongDate(day.date)}
          </p>
          <button
            type="button"
            onClick={() => setDayOffset((d) => d - 1)}
            disabled={dayOffset <= 0}
            aria-label="Previous day"
            className={squareButton}
          >
            <ChevronIcon direction="left" className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setDayOffset((d) => d + 1)}
            disabled={dayOffset >= 30}
            aria-label="Next day"
            className={squareButton}
          >
            <ChevronIcon direction="right" className="size-5" />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDayOffset(0)}
              className="px-3 py-2.5 font-label text-sm font-bold tracking-[0.12em] text-secondary-300 uppercase hover:text-white"
            >
              Today
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-primary-200">{formatHijriDate(day.date)}</p>

        <ul
          className="mt-8 border-y border-white/10"
          aria-label={`Prayer times, ${formatLongDate(day.date)}`}
        >
          {day.salah.map((salah) => {
            const Icon = salahIcons[salah.id];
            const isNext = isToday && isSameLocalDay(next.time, now) && salah.id === next.id;
            return (
              <li
                key={salah.id}
                className={cn(
                  'grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-l-2 border-b-white/10 px-4 py-4 last:border-b-0 sm:px-6',
                  isNext ? 'border-l-secondary-400 bg-white/5' : 'border-l-transparent',
                )}
              >
                <Icon
                  className={cn('size-7', isNext ? 'text-secondary-400' : 'text-primary-300')}
                />
                <div>
                  <p className="flex items-center gap-3 font-ui text-lg font-medium tracking-heading">
                    {salah.name}
                    {isNext && (
                      <span className="bg-secondary-500 px-2 py-0.5 font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-950 uppercase">
                        Next
                      </span>
                    )}
                  </p>
                  {salah.id === 'fajr' && (
                    <p className="text-sm text-primary-200">
                      Sunrise {formatSalahTime(day.sunrise)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-300 uppercase">
                      Begins
                    </p>
                    <p className="font-ui text-2xl font-medium tabular-nums">
                      {formatSalahTime(salah.time)}
                    </p>
                  </div>
                  {hasJamaah && (
                    <div className="border-l border-white/10 pl-8">
                      <p className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-secondary-300 uppercase">
                        Jama&apos;ah
                      </p>
                      <p className="font-ui text-2xl font-medium tabular-nums">
                        {salah.jamaah ? formatSalahTime(salah.jamaah) : '—'}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Next Friday */}
        <div className="mt-6 flex flex-wrap items-center gap-5 border border-white/10 bg-primary-950/40 px-4 py-4 sm:px-6">
          <CalendarIcon className="size-7 text-secondary-400" />
          <div className="flex-1">
            <p className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-300 uppercase">
              Next Friday · {formatShortDate(friday.date)}
            </p>
            <p className="font-ui text-lg font-medium tracking-heading">Jumu&apos;ah</p>
          </div>
          <div className="text-right">
            <p className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-300 uppercase">
              Dhuhr begins
            </p>
            <p className="font-ui text-2xl font-medium tabular-nums">
              {formatSalahTime(friday.salah[1]!.time)}
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-primary-300">
          Calculated start times for {siteConfig.address.locality}. Jama&apos;ah times may differ.
        </p>
      </section>
    </div>
  );
}
