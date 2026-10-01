import type { DonationTracker as Tracker } from '@/lib/donations/types';
import { formatPercent, isComplete, trackerLabel, trackerProgress } from '@/lib/donations/format';
import { cn } from '@/lib/utils/cn';

/**
 * Reusable progress tracker: a flat, square bar with a label underneath. Reads as an amount,
 * a percentage or a donor count depending on `tracker.display`. `tone` matches the surface.
 */
export function DonationTracker({
  tracker,
  tone = 'light',
  className,
}: {
  tracker: Tracker;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const label = trackerLabel(tracker);
  const done = isComplete(tracker);
  const width = `${trackerProgress(tracker) * 100}%`;

  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={tracker.target}
        aria-valuenow={Math.min(tracker.current, tracker.target)}
        aria-valuetext={label}
        className={cn('h-2 overflow-hidden', tone === 'dark' ? 'bg-white/15' : 'bg-neutral-200')}
      >
        <div
          className={cn(
            'donation-fill h-full',
            done ? 'bg-primary-500' : tone === 'dark' ? 'bg-secondary-400' : 'bg-secondary-500',
          )}
          style={{ width }}
        />
      </div>
      <p
        className={cn(
          'mt-2 flex items-center justify-between gap-3 font-ui text-sm',
          tone === 'dark' ? 'text-primary-100' : 'text-neutral-500',
        )}
      >
        <span>{label}</span>
        {done ? (
          <span className="font-label text-[0.65rem] font-bold tracking-[0.15em] text-primary-500 uppercase">
            Target reached
          </span>
        ) : (
          tracker.display !== 'percent' && <span aria-hidden>{formatPercent(tracker)}</span>
        )}
      </p>
    </div>
  );
}
