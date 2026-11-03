'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ErrorBox } from './fields';

/**
 * Cloudflare Turnstile before the payment session starts (card-testing protection,
 * `lib/giving/protection.ts`). Most donors see nothing: the check runs in the background and a
 * puzzle appears only when Cloudflare asks for one (`appearance: interaction-only`). Turnstile sets
 * no tracking cookies, so it needs no cookie consent. Without `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
 * (local, preview) it renders the payment form straight away.
 *
 * `children(token, retry)`: the token goes with the session request (single use); `retry` runs a
 * fresh check, e.g. when the server rejected the token.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface Turnstile {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      theme: 'dark';
      appearance: 'interaction-only';
      size: 'flexible';
      action: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
    },
  ) => string;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let script: Promise<Turnstile> | undefined;
function loadTurnstile(): Promise<Turnstile> {
  script ??= new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing'));
    el.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(el);
  }).catch((error: unknown) => {
    script = undefined; // let a retry load it again
    throw error;
  });
  return script;
}

export function HumanCheck({
  children,
}: {
  children: (token: string | null, retry: () => void) => ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!SITE_KEY || token) return;
    let id: string | undefined;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !box.current) return;
        id = turnstile.render(box.current, {
          sitekey: SITE_KEY,
          theme: 'dark',
          appearance: 'interaction-only',
          size: 'flexible',
          action: 'donate',
          callback: setToken,
          'error-callback': () => setFailed(true),
          'expired-callback': () => setToken(null),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [token, round]);

  const retry = useCallback(() => {
    setFailed(false);
    setToken(null);
    setRound((n) => n + 1);
  }, []);

  if (!SITE_KEY) return children(null, retry);
  if (token) return children(token, retry);

  return (
    <div className="space-y-3">
      {failed ? (
        <ErrorBox>
          We couldn’t check your connection is secure.{' '}
          <button type="button" onClick={retry} className="underline hover:text-white">
            Try again
          </button>
        </ErrorBox>
      ) : (
        <div aria-busy="true" className="space-y-3">
          <span className="sr-only">Checking your connection is secure…</span>
          <div className="h-12 animate-pulse bg-white/10 motion-reduce:animate-none" />
          <div className="h-12 animate-pulse bg-white/10 motion-reduce:animate-none" />
        </div>
      )}
      {/* Turnstile's widget: empty unless Cloudflare asks the donor to tick a box. */}
      <div ref={box} />
    </div>
  );
}
