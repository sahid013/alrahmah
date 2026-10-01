'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useState } from 'react';
import { ChevronIcon, MenuIcon } from '@/components/icons';
import { isActivePath, type NavItem, type NavLink } from '@/config/navigation';
import { cn } from '@/lib/utils/cn';

interface MobileNavProps {
  nav: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Light icon for the transparent header over dark heroes. */
  light?: boolean;
}

const rowClass =
  'font-label flex w-full items-center justify-between py-3 text-sm font-bold tracking-[0.12em] uppercase transition-colors';

function MobileLink({
  link,
  pathname,
  onNavigate,
  small = false,
}: {
  link: NavLink;
  pathname: string;
  onNavigate: () => void;
  small?: boolean;
}) {
  const current = isActivePath(pathname, link.href);
  return (
    <Link
      href={link.href}
      {...(link.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
      onClick={onNavigate}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'block py-2.5 pl-4 font-ui font-medium tracking-heading',
        small ? 'text-sm' : 'text-base',
        current ? 'text-secondary-300' : 'text-white hover:text-secondary-300',
      )}
    >
      {link.label}
    </Link>
  );
}

function MobileGroup({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const groupId = useId();

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={groupId}
        className={cn(rowClass, 'text-primary-100 hover:text-white')}
      >
        {item.label}
        <ChevronIcon
          direction="right"
          className={cn(
            'size-4 transition-transform duration-300',
            // Points down when closed, up when open.
            expanded ? '-rotate-90' : 'rotate-90',
          )}
        />
      </button>
      <ul
        id={groupId}
        hidden={!expanded}
        className="animate-fade mb-3 border-l-2 border-secondary-500"
      >
        {item.children?.map((child) => (
          <li key={child.href}>
            <MobileLink link={child} pathname={pathname} onNavigate={onNavigate} />
            {child.children && (
              <ul className="ml-4 border-l border-white/15">
                {child.children.map((grandchild) => (
                  <li key={grandchild.href}>
                    <MobileLink
                      link={grandchild}
                      pathname={pathname}
                      onNavigate={onNavigate}
                      small
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function MobileNav({ nav, open, onOpenChange, light = false }: MobileNavProps) {
  const close = () => onOpenChange(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className={cn(
          'inline-flex size-10 items-center justify-center transition-colors duration-500',
          light ? 'text-white hover:bg-white/10' : 'text-primary-500 hover:bg-primary-50',
        )}
      >
        <MenuIcon open={open} />
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        className="animate-fade absolute inset-x-0 top-full border-b border-white/10 bg-primary-900"
      >
        <nav aria-label="Mobile" className="px-4 pt-2 pb-6">
          <ul className="divide-y divide-white/10">
            {nav.map((item) =>
              item.children?.length ? (
                <MobileGroup key={item.href} item={item} onNavigate={close} />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(rowClass, 'text-primary-100 hover:text-white')}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
