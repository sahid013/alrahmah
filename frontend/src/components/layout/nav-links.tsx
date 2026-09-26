'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActiveItem, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils/cn';
import { NavDropdown } from './nav-dropdown';

const hasChildren = (
  item: NavItem,
): item is NavItem & { children: NonNullable<NavItem['children']> } =>
  Boolean(item.children?.length);

/** Desktop navigation. Underline grows in on hover and marks the current page/section. */
export function NavLinks({ nav, light = false }: { nav: NavItem[]; light?: boolean }) {
  const pathname = usePathname();

  const linkClassName = (current: boolean) =>
    cn(
      'font-label relative py-2 text-sm font-bold tracking-[0.12em] uppercase transition-colors duration-300',
      'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-500',
      'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-secondary-500',
      'after:transition-transform after:duration-500 after:ease-(--ease-smooth)',
      current
        ? cn('after:scale-x-100', light ? 'text-white' : 'text-primary-500')
        : cn(
            'after:scale-x-0 hover:after:scale-x-100',
            light ? 'text-white/75 hover:text-white' : 'text-neutral-500 hover:text-primary-500',
          ),
    );

  return (
    <ul className="flex h-full items-center gap-8">
      {nav.map((item) =>
        hasChildren(item) ? (
          <NavDropdown
            key={item.href}
            item={item}
            pathname={pathname}
            light={light}
            linkClassName={linkClassName}
          />
        ) : (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActiveItem(pathname, item) ? 'page' : undefined}
              className={linkClassName(isActiveItem(pathname, item))}
            >
              {item.label}
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}
