'use client';

import Image from 'next/image';
import { useId } from 'react';
import { useSalahCountdown } from '@/lib/hooks/use-salah-countdown';
import { formatSalahTime } from '@/lib/prayer-times';
import { usePrayerTimesDialog } from './prayer-times-provider';

/**
 * Fixed bottom-left round badge: "PRAYER TIMES" on a continuously rotating ring around the
 * Al-Rahmah building icon. Opens the shared prayer times popup. The circle is the design system's
 * deliberate exception to square corners (`.shape-round`).
 */
export function PrayerBadge() {
  const { next } = useSalahCountdown();
  const { open } = usePrayerTimesDialog();
  const ringId = useId();

  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      aria-label={
        next ? `Prayer times. Next: ${next.name} at ${formatSalahTime(next.time)}` : 'Prayer times'
      }
      className="btn-fill shape-round fixed bottom-4 left-4 z-40 flex size-20 items-center justify-center overflow-hidden border-[3px] border-primary-950 bg-secondary-500 text-primary-950 [--btn-fill:var(--color-secondary-300)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-400 sm:bottom-6 sm:left-6 sm:size-28 lg:bottom-8 lg:left-8"
    >
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="animate-ring pointer-events-none absolute inset-0 size-full"
      >
        <defs>
          <path id={ringId} d="M14,50 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text className="fill-current font-ui font-bold uppercase" fontSize="11.5">
          {/* textLength = full circumference (2π·36): letters spread evenly, no seam. */}
          <textPath href={`#${ringId}`} textLength="226.2" lengthAdjust="spacing">
            {'Prayer  times  •  Prayer  times  •  '}
          </textPath>
        </text>
      </svg>
      <Image
        src="/brand/building-icon.webp"
        alt=""
        width={500}
        height={364}
        className="relative w-[46%]"
      />
    </button>
  );
}
