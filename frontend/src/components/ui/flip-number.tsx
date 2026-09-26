'use client';

import { useState, type AnimationEvent, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/utils/cn';

/**
 * Split-flap number ("departure board" flip), used for every countdown.
 *
 * Each digit is four half-panels:
 *   - static TOP shows the NEW digit's top half (revealed as the leaf lifts)
 *   - static BOTTOM shows the OLD digit's bottom half (until the leaf lands)
 *   - the LEAF is the top half hinged on the seam: front = OLD digit, back = NEW digit.
 *     It rotates 0 → -180° about its bottom edge and settles with a tiny bounce.
 * Flat shade overlays track the leaf (no gradients, borders or seam line; square corners).
 * Sizes are in `em`, so set the font-size on the parent to scale the whole card.
 */

type Tone = 'light' | 'dark';

/**
 * Panels are light blue at 30% with no border or seam line. They must be OPAQUE (a solid mix of
 * light blue and the surface), otherwise the falling leaf would show the digit behind it.
 */
const tones: Record<Tone, { panel: string; digit: string }> = {
  /** On dark surfaces (hero, header over the hero, prayer popup). */
  dark: {
    panel: 'bg-[color-mix(in_oklab,var(--color-secondary-500)_30%,var(--color-primary-900))]',
    digit: 'text-white',
  },
  /** On white surfaces (solid header). */
  light: {
    panel: 'bg-[color-mix(in_oklab,var(--color-secondary-500)_30%,var(--color-white))]',
    digit: 'text-primary-600',
  },
};

function Half({
  position,
  face,
  tone,
  inLeaf = false,
  className,
  children,
}: {
  position: 'top' | 'bottom';
  face: string;
  tone: Tone;
  /** Faces of the moving leaf fill the leaf (which is itself the top half of the card). */
  inLeaf?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        'absolute overflow-hidden',
        inLeaf ? 'inset-0' : cn('inset-x-0 h-1/2', position === 'top' ? 'top-0' : 'top-1/2'),
        t.panel,
        className,
      )}
    >
      {/* Full-height glyph box, offset so each half shows its half of the digit. */}
      <span
        className={cn(
          'absolute inset-x-0 flex h-[200%] items-center justify-center font-ui leading-none font-semibold tabular-nums',
          position === 'top' ? 'top-0' : '-top-full',
          t.digit,
        )}
      >
        {face}
      </span>
      {children}
    </span>
  );
}

interface FlipState {
  current: string;
  previous: string;
  flipping: boolean;
  /** Increments per change, restarting the CSS animations. */
  id: number;
}

function FlipDigit({ value, tone }: { value: string; tone: Tone }) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<FlipState>({
    current: value,
    previous: value,
    flipping: false,
    id: 0,
  });

  // Derive the flip from the incoming value during render (no effect needed).
  if (value !== state.current) {
    const instant = reduced || state.current === '-';
    setState({ current: value, previous: state.current, flipping: !instant, id: state.id + 1 });
  }

  const { current, previous, id } = state;
  // With reduced motion the CSS animations don't run (so no animationend): always show the settled digit.
  const flipping = state.flipping && !reduced;
  const onLeafEnd = (event: AnimationEvent) => {
    if (event.target === event.currentTarget) setState((s) => ({ ...s, flipping: false }));
  };

  return (
    <span className="relative inline-block h-[1.55em] w-[1.3em] [perspective:5.4em]">
      <Half position="top" face={current} tone={tone}>
        {flipping && <span key={id} className="flap-cast-top absolute inset-0 bg-black" />}
      </Half>
      <Half position="bottom" face={flipping ? previous : current} tone={tone}>
        {flipping && <span key={id} className="flap-cast-bottom absolute inset-0 bg-black" />}
      </Half>

      {flipping && (
        <span
          key={id}
          onAnimationEnd={onLeafEnd}
          className="flap-leaf absolute inset-x-0 top-0 z-10 h-1/2 origin-bottom [transform-style:preserve-3d]"
        >
          {/* Front: old digit, top half. */}
          <Half
            position="top"
            face={previous}
            tone={tone}
            inLeaf
            className="[backface-visibility:hidden]"
          >
            <span className="flap-shade-front absolute inset-0 bg-black" />
          </Half>
          {/* Back: new digit, bottom half — flipped so it lands upright over the bottom. */}
          <Half
            position="bottom"
            face={current}
            tone={tone}
            inLeaf
            className="[transform:rotateX(180deg)] [backface-visibility:hidden]"
          >
            <span className="flap-shade-back absolute inset-0 bg-black" />
          </Half>
        </span>
      )}
    </span>
  );
}

/** A zero-padded number shown as split-flap digits. Screen readers get the plain value. */
export function FlipNumber({
  value,
  tone = 'dark',
  className,
}: {
  value: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex', className)}>
      <span aria-hidden className="inline-flex gap-[0.1em]">
        {value.split('').map((char, i) => (
          <FlipDigit key={i} value={char} tone={tone} />
        ))}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
