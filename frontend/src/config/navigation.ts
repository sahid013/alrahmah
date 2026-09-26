import { EVENTS_PAGE, getEventHref, type EventItem } from '@/lib/events';
import { impactReport } from '@/lib/impact/data';
import { flattenServices, services, type Service } from '@/lib/services/data';
import { siteConfig } from './site';

/** Site navigation. Items with `children` render as a dropdown (desktop) / expandable group (mobile). */
export interface NavLink {
  label: string;
  href: string;
  /** Sub-pages (shown in the mega menu's side column and indented in the mobile menu). */
  children?: NavLink[];
}

export interface NavItem extends NavLink {
  children?: NavLink[];
  /** Desktop dropdown panel to render instead of the default link mega menu. */
  panel?: 'events' | 'socials';
  /** Events shown in the `events` panel. */
  events?: EventItem[];
}

const toNavLink = (service: Service): NavLink => ({
  label: service.title,
  href: service.href,
  ...(service.children && { children: service.children.map(toNavLink) }),
});

/**
 * Main navigation. Built at render time because the Events dropdown lists the latest events
 * (passed in from the server, so it updates when the dashboard changes).
 */
export const buildMainNav = (latestEvents: EventItem[]): NavItem[] => [
  { label: 'Home', href: '/' },
  {
    label: 'About Us',
    href: '/about',
    children: [
      { label: 'About', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Vision & Mission', href: '/vision-mission' },
      { label: 'Meet The Team', href: '/team' },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    children: services.map(toNavLink),
  },
  {
    label: 'Events',
    href: EVENTS_PAGE,
    panel: 'events',
    events: latestEvents,
    // Mobile menu list; desktop shows the richer events panel.
    children: [
      ...latestEvents.map((event) => ({ label: event.title, href: getEventHref(event) })),
      { label: 'View all events', href: EVENTS_PAGE },
    ],
  },
  {
    label: 'Follow Us',
    href: siteConfig.socials[0].href,
    panel: 'socials',
    children: siteConfig.socials.map((social) => ({ label: social.name, href: social.href })),
  },
];

/** Footer link columns. Services come from the same list as the navbar menu. */
export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: 'About',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Vision & Mission', href: '/vision-mission' },
      { label: 'Meet The Team', href: '/team' },
      { label: 'Impact Report', href: `/impact/${impactReport.year}` },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      ...flattenServices().map((service) => ({ label: service.title, href: service.href })),
      { label: 'All Services', href: '/services' },
    ],
  },
  {
    title: 'Get Involved',
    links: [
      { label: 'Events', href: EVENTS_PAGE },
      { label: 'Donate', href: siteConfig.links.donate },
      { label: 'WhatsApp Channel', href: siteConfig.links.whatsappChannel },
    ],
  },
];

/** Whether `href` is the current page (or, for sections, contains it). */
export const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Whether a nav item or any of its (nested) children is the current page. */
export const isActiveItem = (pathname: string, item: NavLink): boolean =>
  isActivePath(pathname, item.href) ||
  (item.children?.some((child) => isActiveItem(pathname, child)) ?? false);
