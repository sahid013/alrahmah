'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronIcon } from '@/components/icons';
import { FlipNumber } from '@/components/ui/flip-number';
import { siteConfig } from '@/config/site';
import { useSalahCountdown } from '@/lib/hooks/use-salah-countdown';
import { formatSalahTime } from '@/lib/prayer-times';
import { usePrayerTimesDialog } from './prayer-times-provider';
import { salahIcons } from './salah-icons';

const ease = [0.22, 1, 0.36, 1] as const;

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <FlipNumber value={value} tone="dark" className="text-3xl" />
      <span className="mt-3 font-label text-[0.65rem] font-bold tracking-[0.25em] text-secondary-300">
        {label}
      </span>
    </div>
  );
}

/**
 * Mobile next-prayer section (under the hero accordion): next salah with its icon and time, a
 * link to the full prayer times popup, and a split-flap countdown. Fades up into view; the salah
 * name animates when the next prayer changes. Reduced motion: no animation.
 */
export function NextPrayerSection() {
  const { next, hours, minutes, seconds } = useSalahCountdown();
  const { open } = usePrayerTimesDialog();
  const reduceMotion = useReducedMotion();
  const Icon = next ? salahIcons[next.id] : null;

  return (
    <motion.section
      aria-labelledby="next-prayer-title"
      // Same initial state on server and client (the server can't know the reduced-motion
      // setting); reduced motion just makes the reveal instant.
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: reduceMotion ? 0 : 0.8, ease }}
      className="relative isolate overflow-hidden border-b border-white/10 bg-primary-900 px-4 py-10 text-center sm:px-8"
    >
      <div aria-hidden className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.06]" />

      <p className="text-sm text-primary-200">{siteConfig.name}</p>

      {/* Live region off: the countdown ticks every second; the name is announced via the title. */}
      <h2 id="next-prayer-title" className="mt-3 flex flex-col items-center gap-3">
        <span className="sr-only">Next prayer:</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={next?.id ?? 'loading'}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease }}
            className="flex flex-col items-center gap-3"
          >
            {Icon && <Icon className="size-10 text-secondary-400" />}
            <span className="font-ui text-xl font-semibold tracking-[0.08em] text-white uppercase">
              <span aria-hidden>Next prayer: </span>
              {next?.name ?? '—'}
              {next && (
                <span className="ml-2 font-normal tracking-normal text-primary-200 normal-case">
                  at {formatSalahTime(next.time)}
                </span>
              )}
            </span>
            {next?.jamaah && (
              <span className="font-ui text-sm text-secondary-300">
                Jama&apos;ah {formatSalahTime(next.jamaah)}
              </span>
            )}
          </motion.span>
        </AnimatePresence>
      </h2>

      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="mt-3 inline-flex items-center gap-1 font-label text-xs font-bold tracking-[0.2em] text-secondary-300 uppercase transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-400"
      >
        See prayer times
        <ChevronIcon direction="right" className="size-4" />
      </button>

      <div aria-hidden className="mt-7 flex justify-center gap-5">
        <Unit value={hours} label="HRS" />
        <Unit value={minutes} label="MIN" />
        <Unit value={seconds} label="SEC" />
      </div>
      {next && (
        <p className="sr-only">
          {Number(hours)} hours and {Number(minutes)} minutes until {next.name}.
        </p>
      )}
    </motion.section>
  );
}
