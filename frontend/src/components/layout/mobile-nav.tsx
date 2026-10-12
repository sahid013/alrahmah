'use client';

import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
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

const ease = [0.22, 1, 0.36, 1] as const;

/** Group links fade and slide in one after another as the group opens. */
const listVariants: Variants = {
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
  closed: {},
};
const itemVariants: Variants = {
  open: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
  closed: { opacity: 0, x: -12 },
};

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

/** One expandable menu group. Expansion is controlled by `MobileNav`, so only one is open. */
function MobileGroup({
  item,
  expanded,
  onToggle,
  onNavigate,
}: {
  item: NavItem;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const groupId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={groupId}
        className={cn(rowClass, expanded ? 'text-white' : 'text-primary-100 hover:text-white')}
      >
        {item.label}
        {/* Points down when closed, up when open. */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ rotate: expanded ? -90 : 90 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease }}
          className={cn('inline-flex', expanded && 'text-secondary-300')}
        >
          <ChevronIcon direction="right" className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            id={groupId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease }}
            className="overflow-hidden"
          >
            <motion.ul
              variants={reduceMotion ? undefined : listVariants}
              initial="closed"
              animate="open"
              className="mb-3 border-l-2 border-secondary-500"
            >
              {item.children?.map((child) => (
                <motion.li key={child.href} variants={reduceMotion ? undefined : itemVariants}>
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
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function MobileNav({ nav, open, onOpenChange, light = false }: MobileNavProps) {
  const close = () => onOpenChange(false);
  // Accordion: at most one group open at a time; opening another collapses the previous one.
  const [expandedHref, setExpandedHref] = useState<string | null>(null);

  // Start collapsed each time the menu reopens (state adjusted during render, no effect).
  if (!open && expandedHref !== null) setExpandedHref(null);

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
                <MobileGroup
                  key={item.href}
                  item={item}
                  expanded={expandedHref === item.href}
                  onToggle={() =>
                    setExpandedHref((current) => (current === item.href ? null : item.href))
                  }
                  onNavigate={close}
                />
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
