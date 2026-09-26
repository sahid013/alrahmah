import type { ComponentProps, ElementType } from 'react';
import { cn } from '@/lib/utils/cn';

type ContainerProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, 'as'>;

/**
 * Full-width content area with the site gutter (16px mobile, 32px tablet, 64px desktop),
 * capped at 96rem on very large screens. Header, hero and sections all share it so their
 * edges line up.
 */
export function Container<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      className={cn('mx-auto w-full max-w-[96rem] px-4 sm:px-8 lg:px-16', className)}
      {...props}
    />
  );
}
