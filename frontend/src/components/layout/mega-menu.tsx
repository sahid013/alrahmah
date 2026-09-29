'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRightIcon, ChevronIcon, HeartIcon, WhatsAppIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { isActiveItem, isActivePath, type NavLink } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils/cn';

interface MegaMenuProps {
  id: string;
  label: string;
  links: NavLink[];
  pathname: string;
  onNavigate: () => void;
}

/**
 * Three-column dropdown panel: a feature call-to-action, the section's links, and masjid info.
 * Links with `children` (e.g. Education) show a chevron; hovering/focusing one swaps the info
 * column for its sub-pages. Square, flat, brand colours only; opacity fade (no movement).
 */
export function MegaMenu({ id, label, links, pathname, onNavigate }: MegaMenuProps) {
  const [openParent, setOpenParent] = useState<NavLink | null>(null);

  const linkRow = (link: NavLink, opts: { active?: boolean; sub?: boolean } = {}) => {
    const current = link.children
      ? isActiveItem(pathname, link)
      : isActivePath(pathname, link.href);
    const highlighted = current || opts.active;
    return (
      <Link
        href={link.href}
        onClick={onNavigate}
        aria-current={current ? 'page' : undefined}
        {...(link.children && { 'aria-controls': `${id}-sub`, 'aria-expanded': opts.active })}
        className={cn(
          'group/link flex items-center justify-between border-l-2 py-5 pl-4 font-ui font-medium tracking-heading transition-colors duration-300',
          opts.sub ? 'text-base lg:text-lg' : 'text-lg lg:text-xl',
          highlighted
            ? 'border-secondary-500 text-primary-500'
            : 'border-transparent text-primary-900 hover:border-secondary-500 hover:text-primary-500',
        )}
      >
        {link.label}
        {link.children ? (
          <ChevronIcon direction="right" className="size-5 text-secondary-600" />
        ) : (
          <ArrowRightIcon
            className={cn(
              'text-secondary-600 transition-opacity duration-300',
              current ? 'opacity-100' : 'opacity-0 group-hover/link:opacity-100',
            )}
          />
        )}
      </Link>
    );
  };

  return (
    <div
      id={id}
      className="animate-fade absolute inset-x-4 top-full z-50 grid border border-neutral-200 bg-white sm:inset-x-8 md:grid-cols-2 lg:inset-x-16 lg:grid-cols-12"
    >
      {/* Links — first in the DOM so keyboard users reach them first. */}
      <nav aria-label={label} className="px-6 py-4 lg:col-span-4 lg:px-10 lg:py-6">
        <ul className="divide-y divide-neutral-200">
          {links.map((link) => (
            <li
              key={link.href}
              onPointerEnter={() => setOpenParent(link.children ? link : null)}
              onFocus={() => setOpenParent(link.children ? link : null)}
            >
              {linkRow(link, { active: openParent?.href === link.href })}
            </li>
          ))}
        </ul>
      </nav>

      {/* Feature */}
      <div className="relative hidden overflow-hidden bg-primary-800 p-10 text-white lg:order-first lg:col-span-4 lg:flex lg:flex-col lg:justify-end">
        <Image
          src={siteConfig.logoMarkLight}
          alt=""
          width={168}
          height={134}
          className="absolute -top-6 -right-10 w-64 opacity-10"
        />
        <p className="relative font-heading text-title-3xl font-normal tracking-heading uppercase">
          Get Involved
        </p>
        <p className="relative mt-3 max-w-xs text-primary-100">
          Support the new masjid appeal or stay up to date with the community.
        </p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <ButtonLink
            href={siteConfig.links.donate}
            variant="secondary"
            size="sm"
            onClick={onNavigate}
          >
            <HeartIcon className="size-4" />
            Donate
          </ButtonLink>
          <ButtonLink
            href={siteConfig.links.whatsappChannel}
            variant="outline-light"
            size="sm"
            onClick={onNavigate}
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </ButtonLink>
        </div>
      </div>

      {/* Sub-pages of the hovered parent (e.g. Education)… */}
      {openParent?.children ? (
        <nav
          id={`${id}-sub`}
          aria-label={openParent.label}
          className="animate-fade bg-primary-50 px-6 py-6 lg:col-span-4 lg:px-10"
        >
          <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase">
            {openParent.label}
          </p>
          <ul className="mt-2 divide-y divide-neutral-200">
            {openParent.children.map((child) => (
              <li key={child.href}>{linkRow(child, { sub: true })}</li>
            ))}
          </ul>
        </nav>
      ) : (
        /* …otherwise masjid info */
        <div className="flex flex-col bg-primary-50 p-6 lg:col-span-4 lg:p-10">
          <Image
            src={siteConfig.logoMark}
            alt=""
            width={168}
            height={134}
            className="h-16 w-auto"
          />
          <p className="mt-6 font-heading text-title-2xl font-normal tracking-heading text-primary-900">
            {siteConfig.name}
          </p>
          <p className="mt-1 text-neutral-500">
            {siteConfig.address.locality} · Est. {siteConfig.foundingYear}
          </p>
          <div className="my-6 h-px bg-neutral-200" />
          <p className="text-neutral-500">
            Our doors are open to visitors throughout the year. Everyone is welcome.
          </p>
          <div className="mt-auto pt-8">
            <ButtonLink href={siteConfig.links.whatsappChannel} size="sm" onClick={onNavigate}>
              <WhatsAppIcon className="size-4" />
              Join our channel
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
