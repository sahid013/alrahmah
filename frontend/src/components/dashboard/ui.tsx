import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Shared dashboard building blocks. Same design system as the public site (square corners,
 * flat brand colours, Forum titles, Poppins numbers) tuned for dense admin screens.
 */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6">
      <div>
        <h1 className="text-title-2xl leading-none text-primary-900 sm:text-title-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border border-neutral-200 bg-white', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          {title && (
            <h2 className="font-label text-xs font-bold tracking-[0.2em] text-primary-900 uppercase">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-5">
      <p className="font-label text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
        {label}
      </p>
      <p className="mt-3 font-ui text-3xl font-semibold text-primary-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-neutral-500">{hint}</p>}
    </div>
  );
}

type BadgeTone = 'neutral' | 'sky' | 'indigo' | 'success' | 'warning' | 'error';
const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-600',
  sky: 'bg-secondary-100 text-secondary-800',
  indigo: 'bg-primary-100 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
};
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 font-label text-[0.65rem] font-bold tracking-[0.12em] uppercase',
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const fieldBase =
  'block w-full border border-neutral-300 bg-white px-3 py-2 font-body text-base text-primary-950 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-2 focus:outline-offset-0 focus:outline-secondary-400 disabled:bg-neutral-50 disabled:text-neutral-400';

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block font-label text-xs font-bold tracking-[0.12em] text-primary-900 uppercase">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-sm text-neutral-400">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-error-700">{error}</span>}
    </label>
  );
}

export const Input = ({ className, ...props }: ComponentProps<'input'>) => (
  <input className={cn(fieldBase, className)} {...props} />
);
export const Select = ({ className, ...props }: ComponentProps<'select'>) => (
  <select className={cn(fieldBase, 'pr-8', className)} {...props} />
);
export const Textarea = ({ className, ...props }: ComponentProps<'textarea'>) => (
  <textarea className={cn(fieldBase, 'min-h-24', className)} {...props} />
);

/** Square icon-only button (pair with an aria-label). */
export const iconButton =
  'inline-flex size-10 shrink-0 items-center justify-center border border-neutral-300 bg-white text-primary-700 transition-colors hover:border-primary-500 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500 disabled:opacity-40';

/** Table cell classes (data tables are plain semantic <table>s). */
export const th =
  'border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-left font-label text-[0.7rem] font-bold tracking-[0.12em] text-neutral-500 uppercase';
export const td = 'border-b border-neutral-100 px-4 py-3 align-middle text-sm text-neutral-600';

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-5 py-12 text-center text-neutral-500">{children}</p>;
}

export function LoadingRows() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-2 p-5">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-8 animate-pulse bg-neutral-100" />
      ))}
    </div>
  );
}

export const gbp = (n: number, decimals = 2) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

/** "1 Oct 2026" from an ISO date or timestamp (masjid time zone). */
export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
