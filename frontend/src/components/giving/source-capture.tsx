'use client';

import { useEffect } from 'react';
import { captureSource } from '@/lib/giving/attribution';

/** Records where the visitor came from on arrival (see `lib/giving/attribution.ts`). */
export function SourceCapture() {
  useEffect(() => captureSource(window.location, document.referrer), []);
  return null;
}
