'use client';

import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { ChevronIcon } from '@/components/icons';
import { isActiveItem, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils/cn';
import { EventsMenu } from './events-menu';
import { SocialsMenu } from './socials-menu';
import { MegaMenu } from './mega-menu';

/** Delay before closing when the mouse leaves, so crossing small gaps doesn't close the menu. */
const CLOSE_DELAY_MS = 180;

interface NavDropdownProps {
  item: NavItem & { children: NonNullable<NavItem['children']> };
  pathname: string;
  /** Light text for the transparent header over dark heroes. */
  light: boolean;
  linkClassName: (current: boolean) => string;
}

/**
 * Disclosure-style dropdown: opens on mouse hover, or on click/Enter/Space (touch & keyboard).
 * Closes on Escape, outside click, focus leaving, or navigation.
 */
export function NavDropdown({ item, pathname, light, linkClassName }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();
  const current = isActiveItem(pathname, item);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const close = () => {
    cancelClose();
    setOpen(false);
  };

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    cancelClose();
    setOpen(true);
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  useEffect(() => cancelClose, []);

  return (
    // Full header height, so the pointer stays inside while moving down to the panel.
    <li
      ref={rootRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      // Compact panels (socials) anchor under their item; mega menus span the header.
      className={cn('flex h-full items-center', item.panel === 'socials' && 'relative')}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(linkClassName(current || open), 'flex items-center gap-1.5')}
      >
        {item.label}
        <ChevronIcon
          direction="right"
          className={cn(
            'size-4 transition-transform duration-300',
            // Points down when closed, up when open.
            open ? '-rotate-90' : 'rotate-90',
            light ? 'text-white/75' : 'text-neutral-400',
          )}
        />
      </button>
      {open &&
        (item.panel === 'socials' ? (
          <SocialsMenu id={panelId} onNavigate={close} />
        ) : item.panel === 'events' ? (
          <EventsMenu id={panelId} events={item.events ?? []} onNavigate={close} />
        ) : (
          <MegaMenu
            id={panelId}
            label={item.label}
            links={item.children}
            pathname={pathname}
            onNavigate={close}
          />
        ))}
    </li>
  );
}
