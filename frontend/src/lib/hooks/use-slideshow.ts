'use client';

import { useCallback, useEffect, useState } from 'react';

interface UseSlideshowOptions {
  count: number;
  /** Time each slide stays on screen, in ms. */
  interval: number;
  initialIndex?: number;
}

/**
 * Index + autoplay for any slideshow/carousel. Autoplay pauses while `paused` is true and is
 * disabled entirely for visitors who prefer reduced motion.
 */
export function useSlideshow({ count, interval, initialIndex = 0 }: UseSlideshowOptions) {
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  /** True once the slide has changed at least once (first slide animates in without waiting). */
  const [advanced, setAdvanced] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      setAdvanced(true);
      setIndex(((i % count) + count) % count);
    },
    [count],
  );
  const next = useCallback(() => {
    setAdvanced(true);
    setIndex((i) => (i + 1) % count);
  }, [count]);
  const prev = useCallback(() => {
    setAdvanced(true);
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setTimeout(next, interval);
    return () => clearTimeout(id);
  }, [index, paused, count, interval, next]);

  return { index, advanced, goTo, next, prev, paused, setPaused };
}
