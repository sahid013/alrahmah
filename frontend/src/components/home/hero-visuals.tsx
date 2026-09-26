import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const shapes = {
  /** Fills the visual column on desktop (square), compact portrait below. */
  square: 'aspect-[4/5] max-w-xs sm:max-w-sm lg:aspect-square lg:max-w-none',
  /** Matches the building cut-out (1227×868). On desktop it's 1.2x the column width,
   *  extending left into the gap beside the text and slightly into the right page gutter (safe because the image is a transparent cut-out). */
  landscape: 'aspect-[1227/868] max-w-sm lg:-ml-[14%] lg:w-[120%] lg:max-w-none',
} as const;

/** Plain image area: no outline, offset square or inner frame. Flat colour only. */
function Frame({
  children,
  shape = 'square',
  className,
}: {
  children: ReactNode;
  shape?: keyof typeof shapes;
  className?: string;
}) {
  return (
    <div
      className={cn('relative mx-auto w-full overflow-hidden lg:mr-0', shapes[shape], className)}
    >
      {children}
    </div>
  );
}

/** The masjid building (transparent cut-out) sitting directly on the dark hero. */
export function WelcomeVisual() {
  return (
    <Frame shape="landscape">
      <div className="hero-drift absolute inset-0">
        <Image
          src="/images/hero/al-rahmah-centre.webp"
          alt="Al-Rahmah Faith Centre, the masjid building in Leeds"
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 24rem"
          className="object-contain"
        />
      </div>
    </Frame>
  );
}

export function AppealVisual() {
  // Same frame as the Welcome slide so both slides match in width; the transparent
  // cut-out (1853×750) sits directly on the dark hero, scaled to fit.
  return (
    <Frame shape="landscape">
      <div className="hero-drift absolute inset-0">
        <Image
          src="/images/appeal/appeal-building.webp"
          alt="The building featured in the Make Space for Rahmah appeal"
          fill
          sizes="(min-width: 1024px) 48vw, 24rem"
          className="object-contain"
        />
      </div>
    </Frame>
  );
}

/** Campaign lockup for "Make Space for Rahmah", set in live text so it stays crisp and indexable. */
export function AppealWordmark({ className }: { className?: string }) {
  return (
    <p className={cn('leading-none text-secondary-300', className)}>
      <span className="font-condensed text-5xl font-bold tracking-tight uppercase">Make</span>{' '}
      <span className="font-body text-4xl text-white italic">Space</span>
      <span className="block font-condensed text-5xl font-bold tracking-tight uppercase">
        for Rahmah
      </span>
    </p>
  );
}
