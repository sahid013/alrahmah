'use client';

import { useEffect, useState } from 'react';

/** Ignore tiny scroll jitters (trackpads, momentum) smaller than this. */
const DIRECTION_THRESHOLD = 6;
/** Never hide while still near the top of the page. */
const HIDE_AFTER = 120;

/**
 * Header scroll state: `atTop` while the page is (nearly) unscrolled, and `hidden` while the
 * visitor scrolls down — scrolling up reveals the header again.
 */
export function useHeaderScroll() {
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      setAtTop(y < 10);
      if (Math.abs(y - lastY) < DIRECTION_THRESHOLD) return;
      setHidden(y > lastY && y > HIDE_AFTER);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return { atTop, hidden };
}
