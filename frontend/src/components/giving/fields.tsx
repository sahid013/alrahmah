import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Donation form controls, dark theme (the page sits on navy). Square, flat, sky focus ring.
 * The form wrapper sets `color-scheme: dark` so native selects/checkboxes render dark too.
 */
export const fieldClass =
  'block w-full border border-white/15 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-primary-200/60 transition-colors duration-300 hover:border-white/30 focus:border-secondary-400 focus:outline-2 focus:outline-offset-0 focus:outline-secondary-400 aria-invalid:border-error-300';

export const labelClass =
  'mb-2 block font-label text-sm font-bold tracking-[0.12em] text-white uppercase';

export function GiveField({
  label,
  optional,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  optional?: boolean;
  /** Shows a required marker after the label (screen readers get `aria-required` on the input). */
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className={labelClass}>
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-error-300">
            *
          </span>
        )}
        {optional && (
          <span className="ml-2 font-body text-xs tracking-normal text-primary-200 normal-case">
            (optional)
          </span>
        )}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-sm text-primary-200">{hint}</span>}
      {error && <span className="mt-1.5 block text-sm text-error-300">{error}</span>}
    </label>
  );
}

/** Every single-line control (inputs, selects, choice tiles, "Other amount") is 48px tall. */
export const controlHeight = 'h-12';

export const GiveInput = ({ className, ...props }: ComponentProps<'input'>) => (
  <input className={cn(fieldClass, controlHeight, 'py-0', className)} {...props} />
);
export const GiveTextarea = ({ className, ...props }: ComponentProps<'textarea'>) => (
  <textarea className={cn(fieldClass, 'min-h-24 resize-y', className)} {...props} />
);
export const GiveSelect = ({ className, ...props }: ComponentProps<'select'>) => (
  <select
    className={cn(fieldClass, controlHeight, 'py-0 pr-10 [&>option]:bg-primary-900', className)}
    {...props}
  />
);

/** Square toggle tile (frequency, preset amounts). Selected = sky with dark text. */
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
        'h-12 border font-ui text-lg font-semibold tabular-nums transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400',
        selected
          ? 'border-secondary-500 bg-secondary-500 text-primary-950'
          : 'border-white/15 bg-white/5 text-white hover:border-secondary-400',
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
    className="text-title-2xl leading-none text-white outline-none sm:text-title-3xl"
  >
    {children}
  </h2>
);

/** Error box for dark surfaces. */
export const ErrorBox = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="border-l-4 border-error-300 bg-error-700/20 px-4 py-3 text-error-300">
    {children}
  </p>
);
