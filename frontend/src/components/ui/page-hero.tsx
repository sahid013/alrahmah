import type { ReactNode } from 'react';
import { Container } from './container';

interface PageHeroProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** The page's single `<h1>`. */
  title: string;
  children?: ReactNode;
}

/**
 * Dark title band for inner pages, pulled up under the transparent header — add the route to
 * `siteConfig.headerOverlayRoutes`. Flat indigo with the faint Islamic star pattern.
 */
export function PageHero({ eyebrow, title, children }: PageHeroProps) {
  return (
    <div className="relative isolate -mt-16 overflow-hidden bg-primary-900 pt-[calc(4rem+4rem)] pb-16 text-white lg:-mt-[8.5rem] lg:pt-[calc(8.5rem+5rem)] lg:pb-20">
      <div aria-hidden className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.06]" />
      <Container>
        {eyebrow && (
          <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 text-title-4xl leading-none text-white sm:text-title-5xl lg:text-title-6xl">
          {title}
        </h1>
        {children}
      </Container>
    </div>
  );
}
