import type { ComponentProps, ElementType } from 'react';
import { cn } from '@/lib/utils/cn';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const headingSizes: Record<HeadingLevel, string> = {
  1: 'text-title-4xl sm:text-title-5xl lg:text-title-6xl',
  2: 'text-title-3xl sm:text-title-4xl',
  3: 'text-title-2xl sm:text-title-3xl',
  4: 'text-title-xl sm:text-title-2xl',
  5: 'text-title-lg sm:text-title-xl',
  6: 'text-title-base sm:text-title-lg',
};

type HeadingProps = ComponentProps<'h1'> & {
  /** Semantic level (h1–h6). Each page has exactly one level-1 heading. */
  level: HeadingLevel;
  /** Visual size, when it should differ from the semantic level. */
  size?: HeadingLevel;
};

/** Title text in Forum, all caps, brand indigo (title size scale = 1.1x body scale). */
export function Heading({ level, size, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        'font-heading leading-tight font-normal tracking-heading uppercase',
        headingSizes[size ?? level],
        className,
      )}
      {...props}
    />
  );
}

type TextSize = 'lead' | 'body' | 'small' | 'caption';

const textSizes: Record<TextSize, string> = {
  lead: 'text-lg sm:text-xl leading-relaxed',
  body: 'text-base leading-relaxed',
  small: 'text-sm leading-normal',
  caption: 'font-label text-xs leading-normal uppercase tracking-wide',
};

type TextProps<T extends ElementType> = {
  as?: T;
  size?: TextSize;
  muted?: boolean;
} & Omit<ComponentProps<T>, 'as'>;

/** Body and description text in Glacial Indifference, charcoal. */
export function Text<T extends ElementType = 'p'>({
  as,
  size = 'body',
  muted,
  className,
  ...props
}: TextProps<T>) {
  const Component: ElementType = as ?? 'p';
  return (
    <Component
      className={cn(
        'font-body',
        textSizes[size],
        muted ? 'text-neutral-400' : 'text-neutral-500',
        className,
      )}
      {...props}
    />
  );
}
