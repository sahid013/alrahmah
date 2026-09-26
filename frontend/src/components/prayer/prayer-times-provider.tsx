'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { PrayerTimesPanel } from './prayer-times-panel';

interface PrayerTimesDialogApi {
  /** Opens the prayer times popup. */
  open: () => void;
}

const PrayerTimesContext = createContext<PrayerTimesDialogApi | null>(null);

/** Lets any component (header card, floating button, hero) open the shared prayer times popup. */
export function usePrayerTimesDialog(): PrayerTimesDialogApi {
  const api = useContext(PrayerTimesContext);
  if (!api) throw new Error('usePrayerTimesDialog must be used inside <PrayerTimesProvider>');
  return api;
}

/**
 * Hosts one native <dialog> for the whole site. `showModal()` gives focus trapping, Escape to
 * close, an inert background and focus restoration for free. Content only renders while open,
 * so its clock doesn't tick in the background.
 */
export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (dialogRef.current?.open) return;
    dialogRef.current?.showModal();
    setIsOpen(true);
  }, []);
  const close = useCallback(() => dialogRef.current?.close(), []);

  return (
    <PrayerTimesContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="prayer-times-title"
        onClose={() => setIsOpen(false)}
        // A click on the dialog element itself is a click on the backdrop.
        onClick={(event) => event.target === event.currentTarget && close()}
        className="prayer-dialog animate-fade m-auto max-h-[calc(100svh-2rem)] w-[min(76rem,calc(100%-2rem))] overflow-y-auto border border-white/10 bg-primary-900 p-0 text-white"
      >
        {isOpen && <PrayerTimesPanel onClose={close} />}
      </dialog>
    </PrayerTimesContext.Provider>
  );
}
