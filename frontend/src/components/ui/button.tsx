import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant =
  'primary' | 'secondary' | 'outline' | 'outline-light' | 'ghost' | 'tertiary' | 'tertiary-light';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white [--btn-fill:var(--color-primary-700)]',
  secondary: 'bg-secondary-500 text-primary-950 [--btn-fill:var(--color-secondary-300)]',
  outline:
    'border border-primary-500 text-primary-500 hover:text-white [--btn-fill:var(--color-primary-500)]',
  /** For dark (primary-700+) backgrounds. */
  'outline-light':
    'border border-white/40 text-white hover:border-white hover:text-primary-900 [--btn-fill:var(--color-white)]',
  ghost: 'text-primary-500 [--btn-fill:var(--color-primary-50)]',
  /** Text-only action: no outline or fill; colour change on hover. */
  tertiary: 'text-primary-500 hover:text-secondary-700',
  /** Text-only action for dark backgrounds. */
  'tertiary-light': 'text-secondary-300 hover:text-white',
};

const isTertiary = (variant: Variant) => variant === 'tertiary' || variant === 'tertiary-light';

const sizes: Record<Size, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-base tracking-wide',
};

/** Tertiary buttons have no box, so no horizontal padding. */
const tertiarySizes: Record<Size, string> = {
  xs: 'h-8 text-xs tracking-[0.12em]',
  sm: 'h-10 text-sm tracking-[0.12em]',
  md: 'h-12 text-base tracking-[0.12em]',
  lg: 'h-14 text-base tracking-[0.12em]',
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

export const buttonStyles = ({ variant = 'primary', size = 'md' }: StyleProps = {}) =>
  cn(
    'group/btn relative inline-flex items-center justify-center gap-2 font-label font-bold uppercase',
    !isTertiary(variant) && 'btn-fill',
    // Micro-interactions: a flat colour fills in from the left on hover, press-down on click.
    'transition-[color,border-color,transform] duration-500 ease-(--ease-smooth) active:scale-[0.98]',
    '[&_svg]:transition-transform [&_svg]:duration-500 hover:[&_svg]:scale-110',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    isTertiary(variant) ? tertiarySizes[size] : sizes[size],
  );

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & StyleProps) {
  return (
    <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />
  );
}

/** Same look as `Button`, but renders a crawlable `<a>` for navigation. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
