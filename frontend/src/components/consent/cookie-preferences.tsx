'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  ACCEPT_ALL,
  CONSENT_CATEGORIES,
  CONSENT_CATEGORY_IDS,
  REJECT_ALL,
  type ConsentChoices,
} from '@/lib/consent/consent';
import { cn } from '@/lib/utils/cn';
import { useConsent } from './consent-provider';

/** On/off switch for one category (a real button with `role="switch"`). */
function Toggle({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500',
        checked ? 'border-primary-500 bg-primary-500' : 'border-neutral-300 bg-neutral-100',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-1 left-1 size-[1.125rem] bg-white transition-transform duration-300 ease-(--ease-smooth)',
          checked ? 'translate-x-5' : 'border border-neutral-300',
        )}
      />
    </button>
  );
}

/**
 * Contents of the cookie preferences dialog: necessary cookies (always on) and one switch per
 * optional category, starting from the visitor's current choice (all off if they haven't chosen).
 */
export function CookiePreferences({ onClose }: { onClose: () => void }) {
  const { choices, save } = useConsent();
  const [draft, setDraft] = useState<ConsentChoices>(choices ?? REJECT_ALL);

  const saveAndClose = (next: ConsentChoices) => {
    save(next);
    onClose();
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <h2 id="cookie-preferences-title" className="text-title-2xl leading-none text-primary-900">
          Cookie preferences
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close cookie preferences"
          className="-m-2 p-2 text-neutral-500 transition-colors hover:text-primary-900 focus-visible:outline-2 focus-visible:outline-secondary-500"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <p className="mt-4 leading-relaxed">
        Choose which cookies we can use. You can change this at any time from &ldquo;Cookie
        settings&rdquo; at the bottom of every page.{' '}
        <Link
          href="/cookies"
          onClick={onClose}
          className="text-primary-500 underline underline-offset-4 hover:text-secondary-700"
        >
          Read the cookie policy
        </Link>
        .
      </p>

      <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
        <li className="flex items-start justify-between gap-6 py-5">
          <div>
            <h3 className="font-label text-sm font-bold tracking-[0.12em] text-primary-900 uppercase">
              Necessary
            </h3>
            <p className="mt-1 text-sm leading-relaxed">
              Make the site work: remembering this choice, and Stripe&apos;s fraud checks when you
              pay a donation. These can&apos;t be switched off.
            </p>
          </div>
          <span className="shrink-0 font-label text-xs font-bold tracking-[0.12em] text-secondary-700 uppercase">
            Always on
          </span>
        </li>
        {CONSENT_CATEGORY_IDS.map((id) => (
          <li key={id} className="flex items-start justify-between gap-6 py-5">
            <div>
              <h3
                id={`consent-${id}`}
                className="font-label text-sm font-bold tracking-[0.12em] text-primary-900 uppercase"
              >
                {CONSENT_CATEGORIES[id].title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed">{CONSENT_CATEGORIES[id].description}</p>
            </div>
            <Toggle
              checked={draft[id]}
              onChange={(checked) => setDraft((d) => ({ ...d, [id]: checked }))}
              labelledBy={`consent-${id}`}
            />
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button variant="outline" size="sm" onClick={() => saveAndClose(REJECT_ALL)}>
          Reject all
        </Button>
        <Button variant="outline" size="sm" onClick={() => saveAndClose(ACCEPT_ALL)}>
          Accept all
        </Button>
        <Button size="sm" onClick={() => saveAndClose(draft)}>
          Save choices
        </Button>
      </div>
    </div>
  );
}
