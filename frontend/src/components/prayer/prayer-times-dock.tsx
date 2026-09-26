import { NextSalah } from './next-salah';

/**
 * The site's single prayer-time widget: the next-salah card, fixed bottom-right on every page.
 * A solid indigo base keeps it legible over both dark and white sections.
 * Opens the shared prayer times popup.
 */
export function PrayerTimesDock() {
  return (
    <div className="fixed right-4 bottom-4 z-40 bg-primary-900 sm:right-6 sm:bottom-6 lg:right-8 lg:bottom-8">
      <NextSalah tone="dark" className="text-[0.9rem] sm:text-base lg:text-[1.2rem]" />
    </div>
  );
}
