import type { ComponentType, SVGProps } from 'react';
import { AfternoonIcon, MoonIcon, SunIcon, SunriseIcon, SunsetIcon } from '@/components/icons';
import type { SalahId } from '@/lib/prayer-times';

/** One line icon per salah (shared by the prayer popup and the mobile next-prayer section). */
export const salahIcons: Record<SalahId, ComponentType<SVGProps<SVGSVGElement>>> = {
  fajr: SunriseIcon,
  dhuhr: SunIcon,
  asr: AfternoonIcon,
  maghrib: SunsetIcon,
  isha: MoonIcon,
};
