'use client';

import type { ReactNode } from 'react';
import { ExternalIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useConsent } from './consent-provider';

interface ConsentGateProps {
  /** Who provides the embed, e.g. "YouTube". */
  service: string;
  /** What it shows, e.g. "the latest khutbah". */
  content: string;
  /** Works without cookies: the same content on the provider's own site. */
  fallback: { href: string; label: string };
  /** Background the placeholder sits on. */
  tone?: 'dark' | 'light';
  /** The embed (an absolutely positioned iframe), rendered only with "External media" consent. */
  children: ReactNode;
}

/**
 * Holds back a third-party embed (YouTube, Google Maps) until the visitor allows external media,
 * since loading it lets the provider set cookies. Until then it fills the embed's box with a short
 * explanation, a button to allow it, and a link to the same content on the provider's site.
 * The server always renders the placeholder; the embed appears once the saved choice is read.
 */
export function ConsentGate({
  service,
  content,
  fallback,
  tone = 'light',
  children,
}: ConsentGateProps) {
  const { allows, save, choices } = useConsent();
  if (allows('media')) return children;

  const dark = tone === 'dark';
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center sm:gap-4 sm:p-6',
        dark ? 'text-primary-100' : 'text-neutral-600',
      )}
    >
      <p className="max-w-sm text-sm leading-relaxed sm:text-base">
        To show {content} here, {service} needs to set cookies. Allow external media, or open it on{' '}
        {service}.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <Button
          variant={dark ? 'white' : 'primary'}
          size="sm"
          onClick={() => save({ analytics: choices?.analytics ?? false, media: true })}
        >
          Allow external media
        </Button>
        <a
          href={fallback.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-2 font-label text-sm font-bold tracking-[0.12em] uppercase',
            dark
              ? 'text-secondary-300 hover:text-white'
              : 'text-primary-500 hover:text-secondary-700',
          )}
        >
          {fallback.label}
          <ExternalIcon className="size-4" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
