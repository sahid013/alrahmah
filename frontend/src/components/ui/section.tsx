import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Container } from './container';
import { Reveal } from './reveal';
import { Heading, Text } from './typography';

interface SectionProps {
  id?: string;
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

/** A page section with an optional heading. Uses `<h2>` — each page owns its single `<h1>`.
 *  Heading, description and content reveal from the left in sequence as they scroll into view. */
export function Section({ id, title, description, className, children }: SectionProps) {
  const headingId = id && title ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn('py-16', className)}>
      <Container>
        {title && (
          <Reveal>
            <Heading level={2} id={headingId}>
              {title}
            </Heading>
          </Reveal>
        )}
        {description && (
          <Reveal order={1}>
            <Text size="lead" className="mt-3 max-w-2xl">
              {description}
            </Text>
          </Reveal>
        )}
        {children && (
          <Reveal
            order={title || description ? 2 : 0}
            className={cn(title || description ? 'mt-8' : '')}
          >
            {children}
          </Reveal>
        )}
      </Container>
    </section>
  );
}
