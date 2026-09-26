'use client';

import { ChevronIcon } from '@/components/icons';
import { FlipNumber } from '@/components/ui/flip-number';
import { useSalahCountdown } from '@/lib/hooks/use-salah-countdown';
import { formatSalahTime } from '@/lib/prayer-times';
import { cn } from '@/lib/utils/cn';
import { usePrayerTimesDialog } from './prayer-times-provider';

type Tone = 'light' | 'dark';

const tones: Record<
  Tone,
  { card: string; label: string; name: string; muted: string; link: string; divider: string }
> = {
  light: {
    card: 'bg-secondary-500/10 hover:bg-secondary-500/15',
    label: 'text-neutral-400',
    name: 'text-primary-500',
    muted: 'text-neutral-400',
    link: 'text-secondary-700',
    divider: 'bg-neutral-200',
  },
  dark: {
    card: 'bg-secondary-500/10 hover:bg-secondary-500/15',
    label: 'text-primary-200',
    name: 'text-white',
    muted: 'text-primary-200',
    link: 'text-secondary-300',
    divider: 'bg-white/15',
  },
};

function Unit({ value, label, tone }: { value: string; label: string; tone: Tone }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <FlipNumber value={value} tone={tone} className="text-[1.05em]" />
      <span
        className={cn('mt-[0.45em] text-[0.55em] font-bold tracking-[0.18em]', tones[tone].muted)}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * Compact next-salah card with a live countdown. Opens the full prayer times popup.
 * All sizes are in `em`: set a font-size via `className` to scale the whole card (e.g. the navbar uses 1.2x).
 */
export function NextSalah({ tone = 'light', className }: { tone?: Tone; className?: string }) {
  const { next, hours, minutes, seconds } = useSalahCountdown();
  const { open } = usePrayerTimesDialog();
  const t = tones[tone];

  const label = next
    ? `Next salah: ${next.name} at ${formatSalahTime(next.time)}, in ${Number(hours)} hours ${Number(minutes)} minutes. See prayer times.`
    : 'See prayer times';

  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      aria-label={label}
      className={cn(
        'group flex items-center gap-[1em] px-[1em] py-[0.375em] text-left transition-colors duration-500 ease-(--ease-smooth) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500',
        t.card,
        className,
      )}
    >
      <span className="flex flex-col leading-tight">
        <span
          className={cn('font-label text-[0.6em] font-bold tracking-[0.2em] uppercase', t.label)}
        >
          Next salah
        </span>
        <span
          className={cn('font-ui text-[0.95em] font-semibold tracking-heading uppercase', t.name)}
        >
          {next?.name ?? '—'}
          <span
            className={cn('ml-[0.55em] font-ui text-[0.92em] font-normal tracking-normal', t.muted)}
          >
            {next ? formatSalahTime(next.time) : '--:--'}
          </span>
        </span>
        <span
          className={cn(
            'flex items-center gap-[0.2em] font-label text-[0.6em] font-bold tracking-[0.18em] uppercase',
            t.link,
          )}
        >
          See prayer times
          <ChevronIcon direction="right" className="size-[1.25em]" />
        </span>
      </span>
      <span aria-hidden className={cn('h-[2.25em] w-px', t.divider)} />
      <span aria-hidden className="flex items-start gap-[0.5em]">
        <Unit value={hours} label="HRS" tone={tone} />
        <Unit value={minutes} label="MIN" tone={tone} />
        <Unit value={seconds} label="SEC" tone={tone} />
      </span>
    </button>
  );
}
