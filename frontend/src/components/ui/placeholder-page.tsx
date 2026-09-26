import type { ReactNode } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from './button';
import { Container } from './container';
import { Heading, Text } from './typography';

/**
 * Standard "coming soon" page for routes linked from the nav before their content exists.
 * Pair with `noindex: true` metadata; replace with real content when available.
 */
export function PlaceholderPage({
  eyebrow,
  title,
  children = 'More information is coming soon.',
  back,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <Container className="py-16 lg:py-24">
      {back && (
        <ButtonLink href={back.href} variant="tertiary" size="xs" className="mb-8">
          <ArrowRightIcon className="size-3.5 rotate-180" />
          {back.label}
        </ButtonLink>
      )}
      {eyebrow && (
        <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
          {eyebrow}
        </p>
      )}
      <Heading level={1} className={eyebrow ? 'mt-4' : undefined}>
        {title}
      </Heading>
      <Text size="lead" className="mt-6 max-w-2xl">
        {children}
      </Text>
    </Container>
  );
}
