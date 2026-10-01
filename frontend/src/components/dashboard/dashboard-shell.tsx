'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import {
  ClockIcon,
  DownloadIcon,
  ExternalIcon,
  GearIcon,
  GridIcon,
  HeartIcon,
  LogoutIcon,
  MenuIcon,
  ReceiptIcon,
} from '@/components/icons';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils/cn';
import { useDashboardAuth } from './auth/auth-gate';

interface NavEntry {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Dashboard navigation. Add a module by adding an entry and a route under app/dashboard. */
export const DASHBOARD_NAV: NavEntry[] = [
  { label: 'Overview', href: '/dashboard', icon: GridIcon },
  { label: 'Prayer times', href: '/dashboard/prayer-times', icon: ClockIcon },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: HeartIcon },
  { label: 'Donations', href: '/dashboard/donations', icon: ReceiptIcon },
  { label: 'Donors & exports', href: '/dashboard/donors', icon: DownloadIcon },
  { label: 'Settings', href: '/dashboard/settings', icon: GearIcon },
];

const isActive = (pathname: string, href: string) =>
  href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { session, signOut } = useDashboardAuth();
  return (
    <nav aria-label="Dashboard" className="flex h-full flex-col bg-primary-900 text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Image
          src={siteConfig.logoLight}
          alt={siteConfig.legalName}
          width={600}
          height={149}
          className="h-9 w-auto"
        />
      </div>
      <p className="px-6 pt-6 pb-3 font-label text-[0.65rem] font-bold tracking-[0.3em] text-secondary-300 uppercase">
        Dashboard
      </p>
      <ul className="flex-1 space-y-1 px-3">
        {DASHBOARD_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 border-l-2 px-3 py-2.5 font-label text-sm font-bold tracking-[0.06em] transition-colors',
                  active
                    ? 'border-secondary-400 bg-white/10 text-white'
                    : 'border-transparent text-primary-100 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 font-label text-sm font-bold text-primary-100 hover:text-white"
        >
          <ExternalIcon className="size-5" />
          View website
        </Link>
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 px-6 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{session.user.name}</p>
          <p className="truncate text-xs text-primary-200">{session.user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex size-10 shrink-0 items-center justify-center text-primary-100 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogoutIcon className="size-5" />
        </button>
      </div>
    </nav>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-primary-950/60"
            onClick={() => setOpen(false)}
          />
          <aside className="animate-fade relative h-full w-72 max-w-[85vw]">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white px-4 sm:px-8 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex size-10 items-center justify-center text-primary-500 hover:bg-primary-50 lg:hidden"
          >
            <MenuIcon />
          </button>
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
