import { cn } from '@/lib/utils/cn';

export const STEPS = ['Amount', 'Details', 'Payment', 'Thank you'] as const;

/** Progress line with square markers. Completed steps are buttons (go back); later ones aren't. */
export function Stepper({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (step: number) => void;
}) {
  return (
    <ol className="grid grid-cols-4" aria-label="Donation steps">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const canGoBack = done && current < STEPS.length - 1;
        const marker = (
          <>
            <span className="relative flex h-5 items-center">
              {/* Connector to the next step. */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-1/2 left-1/2 h-px w-full -translate-y-1/2',
                    done ? 'bg-secondary-500' : 'bg-neutral-300',
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  'relative mx-auto flex size-4 items-center justify-center border-2 transition-colors',
                  active && 'size-5 border-primary-500 bg-white',
                  done && 'border-secondary-500 bg-secondary-500',
                  !active && !done && 'border-neutral-300 bg-white',
                )}
              />
            </span>
            <span
              className={cn(
                'mt-3 block font-label text-[0.65rem] font-bold tracking-[0.15em] uppercase sm:text-xs',
                active ? 'text-primary-900' : done ? 'text-secondary-700' : 'text-neutral-400',
              )}
            >
              {label}
            </span>
          </>
        );
        return (
          <li key={label} className="text-center" aria-current={active ? 'step' : undefined}>
            {canGoBack ? (
              <button
                type="button"
                onClick={() => onSelect(i)}
                className="block w-full hover:opacity-80"
                aria-label={`Back to ${label}`}
              >
                {marker}
              </button>
            ) : (
              <div>{marker}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
