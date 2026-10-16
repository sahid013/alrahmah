import { cn } from '@/lib/utils/cn';

/**
 * Square loading spinner in the current text colour (square, like everything else). Stays still
 * for reduced motion; pair it with text or an `aria-busy` parent so the state is announced.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-4 shrink-0 animate-spin border-2 border-current/25 border-t-current motion-reduce:animate-none',
        className,
      )}
    />
  );
}
