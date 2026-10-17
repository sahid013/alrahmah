'use client';

import type { ComponentProps } from 'react';
import { useConsent } from './consent-provider';

/** Reopens the cookie preferences dialog, so visitors can change their choice at any time. */
export function CookieSettingsButton(props: Omit<ComponentProps<'button'>, 'onClick' | 'type'>) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences} {...props}>
      Cookie settings
    </button>
  );
}
