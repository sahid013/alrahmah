import { cn } from '@/lib/utils/cn';

/** Campaign lockup for "Make Space for Rahmah", set in live text so it stays crisp and indexable. */
export function AppealWordmark({ className }: { className?: string }) {
  return (
    <p className={cn('leading-none text-secondary-300', className)}>
      <span className="font-condensed text-5xl font-bold tracking-tight uppercase">Make</span>{' '}
      <span className="font-body text-4xl text-white italic">Space</span>
      <span className="block font-condensed text-5xl font-bold tracking-tight uppercase">
        for Rahmah
      </span>
    </p>
  );
}
