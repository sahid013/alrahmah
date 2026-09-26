'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};

const getSnapshot = () => Math.floor(Date.now() / 1000);
const getServerSnapshot = () => null;

/**
 * Current time in whole seconds, updated every second. Returns `null` during server rendering
 * and hydration so clocks never cause hydration mismatches.
 */
export function useNowSeconds(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
