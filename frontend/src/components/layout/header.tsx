'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { HeartIcon } from '@/components/icons';
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
 * Site header. Transparent over dark heroes (see `siteConfig.headerOverlayRoutes`) until the
 * page scrolls; slides out of view when scrolling down and back in when scrolling up.
 */
export function Header({ latestEvents }: { latestEvents: EventItem[] }) {
  const nav = buildMainNav(latestEvents);
  const pathname = usePathname();
  const { atTop, hidden } = useHeaderScroll();
  const [menuOpen, setMenuOpen] = useState(false);

  const overlayRoute = (siteConfig.headerOverlayRoutes as readonly string[]).includes(pathname);
  const transparent = overlayRoute && atTop && !menuOpen;
  const concealed = hidden && !menuOpen;

  return (
    <header
      data-transparent={transparent}
      className={cn(
        'sticky top-0 z-50 border-b transition-[translate,background-color,border-color] duration-500 ease-(--ease-smooth) motion-reduce:transition-none',
        transparent ? 'border-white/10 bg-transparent' : 'border-neutral-200 bg-white',
        concealed ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      {/* Three columns (logo · nav · actions) with equal outer tracks, so the nav sits at the true centre. */}
      <Container className="relative grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-6 lg:h-[4.5rem]">
        <Link
          href="/"
          className="relative shrink-0 justify-self-start transition-opacity duration-300 hover:opacity-80"
          aria-label={`${siteConfig.name} — home`}
        >
          <Image
            src={siteConfig.logo.src}
            alt={siteConfig.legalName}
            width={siteConfig.logo.width}
            height={siteConfig.logo.height}
            priority
            className={cn(
              'h-9 w-auto transition-opacity duration-500 lg:h-11',
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
              'absolute inset-0 h-9 w-auto transition-opacity duration-500 lg:h-11',
              !transparent && 'opacity-0',
            )}
          />
        </Link>

        <nav aria-label="Main" className="hidden justify-center self-stretch md:flex">
          <NavLinks nav={nav} light={transparent} />
        </nav>

        <div className="col-start-3 flex items-center gap-3 justify-self-end">
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
          <MobileNav nav={nav} open={menuOpen} onOpenChange={setMenuOpen} light={transparent} />
        </div>
      </Container>
    </header>
  );
}
