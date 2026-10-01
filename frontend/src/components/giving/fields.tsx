import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/** Public form styles (same as the contact form): square, flat, brand focus ring. */
export const fieldClass =
  'block w-full border border-neutral-300 bg-white px-4 py-3 text-lg text-primary-900 placeholder:text-neutral-400 transition-colors duration-300 hover:border-primary-300 focus:border-primary-500 focus:outline-2 focus:outline-offset-0 focus:outline-secondary-500 aria-invalid:border-error-700';

export function GiveField({
  label,
  optional,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block font-label text-sm font-bold tracking-[0.12em] text-primary-900 uppercase">
        {label}
        {optional && (
          <span className="ml-2 font-body text-xs tracking-normal text-neutral-400 normal-case">
            (optional)
          </span>
        )}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-sm text-neutral-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-sm text-error-700">{error}</span>}
    </label>
  );
}

export const GiveInput = ({ className, ...props }: ComponentProps<'input'>) => (
  <input className={cn(fieldClass, className)} {...props} />
);
export const GiveSelect = ({ className, ...props }: ComponentProps<'select'>) => (
  <select className={cn(fieldClass, 'pr-10', className)} {...props} />
);

/** Square toggle tile (frequency, preset amounts). */
export function Choice({
  selected,
  className,
  ...props
}: ComponentProps<'button'> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'h-14 border font-ui text-lg font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500',
        selected
          ? 'border-primary-500 bg-primary-500 text-white'
          : 'border-neutral-300 bg-white text-primary-900 hover:border-primary-500 hover:bg-primary-50',
        className,
      )}
      {...props}
    />
  );
}

export const StepTitle = ({ children, id }: { children: ReactNode; id: string }) => (
  <h2
    id={id}
    tabIndex={-1}
    className="text-title-2xl leading-none text-primary-900 outline-none sm:text-title-3xl"
  >
    {children}
  </h2>
);
