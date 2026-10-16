'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronIcon, CloseIcon } from '@/components/icons';
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
} from '@/lib/prayer-times';
import { cn } from '@/lib/utils/cn';
import { salahIcons } from './salah-icons';

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
        className="flex flex-col items-center justify-center bg-primary-800 px-6 py-8 text-center lg:col-span-4 lg:px-10 lg:py-12"
      >
        <NextIcon className="size-12 text-secondary-400 lg:size-16" />
        <p className="mt-4 text-sm text-primary-200 lg:mt-6">{formatLongDate(now)}</p>
        <p className="text-sm text-primary-200">{siteConfig.name}</p>
        <div className="mt-5 flex gap-4 lg:mt-8 xl:gap-5" role="timer" aria-live="off">
          <CountdownUnit value={hours} label="HRS" />
          <CountdownUnit value={minutes} label="MIN" />
          <CountdownUnit value={seconds} label="SEC" />
        </div>
        {/* Numbers must stay unambiguous: the title font's figures (3 vs 5) are too decorative for times. */}
        <p className="mt-5 font-ui text-xl font-semibold lg:mt-8">
          Until {next.name} at {formatSalahTime(next.time)}
        </p>
        <p className="mt-1 text-primary-200">Current time: {formatSalahTime(now)}</p>
      </section>

      {/* Timetable */}
      <section className="px-5 py-8 sm:px-10 lg:col-span-8 lg:px-10 lg:py-9">
        <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase">
          Prayer times
        </p>
        <h2
          id="prayer-times-title"
          className="mt-3 pr-14 font-heading text-title-2xl leading-tight font-normal tracking-heading text-white uppercase sm:text-title-4xl"
        >
          {siteConfig.name}, {siteConfig.address.locality}
        </h2>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <p className="border border-white/20 px-3 py-2.5 font-label text-xs font-bold tracking-[0.04em] whitespace-nowrap uppercase sm:px-4 sm:text-sm sm:tracking-[0.12em]">
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

        {/* Two columns: the five salah plus Jumu'ah fill a 2 × 3 grid. */}
        <ul
          className="mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2"
          aria-label={`Prayer times, ${formatLongDate(day.date)}`}
        >
          {day.salah.map((salah) => {
            const Icon = salahIcons[salah.id];
            const isNext = isToday && isSameLocalDay(next.time, now) && salah.id === next.id;
            return (
              <li
                key={salah.id}
                className={cn(
                  'grid grid-cols-[auto_1fr_auto] items-center gap-3 border-l-2 px-4 py-3',
                  isNext
                    ? 'border-l-secondary-400 bg-primary-800'
                    : 'border-l-transparent bg-primary-900',
                )}
              >
                <Icon
                  className={cn('size-6', isNext ? 'text-secondary-400' : 'text-primary-300')}
                />
                {/* Name, with sunrise or the "Next" tag underneath so cells stay narrow. */}
                <div className="min-w-0">
                  <p className="font-ui text-base font-medium tracking-heading">{salah.name}</p>
                  {salah.id === 'fajr' && (
                    <p className="text-xs text-primary-200">
                      Sunrise {formatSalahTime(day.sunrise)}
                    </p>
                  )}
                  {isNext && (
                    <span className="mt-1 inline-block bg-secondary-500 px-1.5 py-px font-label text-[0.6rem] font-bold tracking-[0.15em] text-primary-950 uppercase">
                      Next
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-300 uppercase">
                      Begins
                    </p>
                    <p className="font-ui text-xl font-medium tabular-nums">
                      {formatSalahTime(salah.time)}
                    </p>
                  </div>
                  {hasJamaah && (
                    <div className="border-l border-white/10 pl-4">
                      <p className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-secondary-300 uppercase">
                        Jama&apos;ah
                      </p>
                      <p className="font-ui text-xl font-medium tabular-nums">
                        {salah.jamaah ? formatSalahTime(salah.jamaah) : '—'}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          {/* Sixth cell: next Friday's Jumu'ah. */}
          <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-l-2 border-l-transparent bg-primary-950/60 px-4 py-3">
            <CalendarIcon className="size-6 text-secondary-400" />
            <div>
              <p className="font-ui text-base font-medium tracking-heading">Jumu&apos;ah</p>
              <p className="text-xs text-primary-200">
                Next Friday · {formatShortDate(friday.date)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-300 uppercase">
                {friday.jumuah?.length ? 'Khutbah' : 'Dhuhr begins'}
              </p>
              <p className="font-ui text-xl font-medium tabular-nums">
                {(friday.jumuah?.length ? friday.jumuah : [friday.salah[1]!.time])
                  .map(formatSalahTime)
                  .join(' · ')}
              </p>
            </div>
          </li>
        </ul>

        {day.note && (
          <p className="mt-4 border-l-2 border-secondary-400 bg-primary-950/60 px-4 py-2 text-sm text-primary-100">
            {day.note}
          </p>
        )}
        <p className="mt-4 text-xs text-primary-300">
          {day.source === 'published'
            ? `From ${siteConfig.name}'s ${day.date.getFullYear()} prayer timetable.`
            : `Calculated start times for ${siteConfig.address.locality}. Jama'ah times may differ.`}
        </p>
      </section>
    </div>
  );
}
