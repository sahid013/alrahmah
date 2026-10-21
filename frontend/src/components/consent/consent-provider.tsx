'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  consentCookie,
  readConsent,
  type ConsentCategory,
  type ConsentChoices,
} from '@/lib/consent/consent';
import { CookieBanner } from './cookie-banner';
import { CookiePreferences } from './cookie-preferences';

interface ConsentApi {
  /** False on the server and the first client render, until the saved choice has been read. */
  ready: boolean;
  /** The visitor's choice, or null if they haven't made one yet (everything optional is off). */
  choices: ConsentChoices | null;
  allows: (category: ConsentCategory) => boolean;
  save: (choices: ConsentChoices) => void;
  /** Opens the cookie preferences dialog (footer "Cookie settings", embed placeholders). */
  openPreferences: () => void;
}

const ConsentContext = createContext<ConsentApi | null>(null);

export function useConsent(): ConsentApi {
  const api = useContext(ConsentContext);
  if (!api) throw new Error('useConsent must be used inside <ConsentProvider>');
  return api;
}

// The saved choice, as an external store over `document.cookie` (undefined on the server).
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
let cached: { raw: string; choices: ConsentChoices | null } | undefined;
function getSnapshot(): ConsentChoices | null {
  const raw = document.cookie;
  if (cached?.raw !== raw) {
    const stored = readConsent(raw);
    cached = {
      raw,
      choices: stored && {
        source: stored.source,
        analytics: stored.analytics,
        marketing: stored.marketing,
      },
    };
  }
  return cached.choices;
}
const getServerSnapshot = () => undefined;

/**
 * Reads and saves the visitor's cookie choice, shows the banner until they make one, and hosts
 * the preferences dialog (one native <dialog>, like the prayer times popup). The choice lives in
 * a first-party cookie (`lib/consent/consent.ts`), read only in the browser so pages stay static.
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = snapshot !== undefined;
  const choices = snapshot ?? null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const save = useCallback((next: ConsentChoices) => {
    document.cookie = consentCookie(next, new Date(), window.location.protocol === 'https:');
    listeners.forEach((listener) => listener());
  }, []);

  const openPreferences = useCallback(() => {
    if (dialogRef.current?.open) return;
    dialogRef.current?.showModal();
    setIsOpen(true);
  }, []);
  const close = useCallback(() => dialogRef.current?.close(), []);

  const allows = useCallback((category: ConsentCategory) => !!choices?.[category], [choices]);

  return (
    <ConsentContext.Provider value={{ ready, choices, allows, save, openPreferences }}>
      {children}
      {ready && !choices && <CookieBanner />}
      <dialog
        ref={dialogRef}
        aria-labelledby="cookie-preferences-title"
        onClose={() => setIsOpen(false)}
        // A click on the dialog element itself is a click on the backdrop.
        onClick={(event) => event.target === event.currentTarget && close()}
        className="consent-dialog animate-fade m-auto max-h-[calc(100svh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto border border-neutral-200 bg-white p-0 text-neutral-600"
      >
        {isOpen && <CookiePreferences onClose={close} />}
      </dialog>
    </ConsentContext.Provider>
  );
}
