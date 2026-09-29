'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { HeartIcon } from '@/components/icons';
import { NextSalah } from '@/components/prayer/next-salah';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { buildMainNav } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import type { EventItem } from '@/lib/events';
import { useHeaderScroll } from '@/lib/hooks/use-header-scroll';
import { cn } from '@/lib/utils/cn';
import { MobileNav } from './mobile-nav';
import { NavLinks } from './nav-links';

/**
 * Site header. Desktop (lg+): logo on the left; on the right a utility row (next salah + Donate)
 * above the nav, which keeps its dropdowns. Below lg: logo, Donate and the menu button.
 * Transparent over dark heroes (see `siteConfig.headerOverlayRoutes`) until the page scrolls;
 * slides out of view when scrolling down and back in when scrolling up.
 */
export function Header({ latestEvents }: { latestEvents: EventItem[] }) {
  const nav = buildMainNav(latestEvents);
  const pathname = usePathname();
  const { atTop, hidden } = useHeaderScroll();
  const [menuOpen, setMenuOpen] = useState(false);

  const overlayRoute = (siteConfig.headerOverlayRoutes as readonly string[]).includes(pathname);
  const transparent = overlayRoute && atTop && !menuOpen;
  const concealed = hidden && !menuOpen;

  const donate = (
    <ButtonLink
      href={siteConfig.links.donate}
      size="sm"
      variant={transparent ? 'secondary' : 'primary'}
    >
      <HeartIcon
        className={cn('size-4', transparent ? 'text-primary-900' : 'text-secondary-300')}
      />
      Donate
    </ButtonLink>
  );

  return (
    <header
      data-transparent={transparent}
      className={cn(
        'sticky top-0 z-50 border-b transition-[translate,background-color,border-color] duration-500 ease-(--ease-smooth) motion-reduce:transition-none',
        transparent ? 'border-white/10 bg-transparent' : 'border-neutral-200 bg-white',
        concealed ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <Container className="relative flex h-16 items-center justify-between gap-6 lg:h-[8.5rem] lg:items-stretch">
        <Link
          href="/"
          className="relative shrink-0 self-center transition-opacity duration-300 hover:opacity-80"
          aria-label={`${siteConfig.name} — home`}
        >
          <Image
            src={siteConfig.logo.src}
            alt={siteConfig.legalName}
            width={siteConfig.logo.width}
            height={siteConfig.logo.height}
            priority
            className={cn(
              'h-9 w-auto transition-opacity duration-500 lg:h-16',
              transparent && 'opacity-0',
            )}
          />
          <Image
            src={siteConfig.logoLight}
            alt=""
            width={siteConfig.logo.width}
            height={siteConfig.logo.height}
            priority
            className={cn(
              'absolute inset-0 h-9 w-auto transition-opacity duration-500 lg:h-16',
              !transparent && 'opacity-0',
            )}
          />
        </Link>

        {/* Desktop: utility row above the nav, both right-aligned. */}
        <div className="hidden flex-col items-end justify-between pt-3 lg:flex">
          <div className="flex items-center gap-4">
            <NextSalah tone={transparent ? 'dark' : 'light'} className="text-[1.1rem]" />
            {donate}
          </div>
          <nav aria-label="Main" className="flex h-12">
            <NavLinks nav={nav} light={transparent} />
          </nav>
        </div>

        {/* Mobile / tablet */}
        <div className="flex items-center gap-3 lg:hidden">
          {donate}
          <MobileNav nav={nav} open={menuOpen} onOpenChange={setMenuOpen} light={transparent} />
        </div>
      </Container>
    </header>
  );
}
