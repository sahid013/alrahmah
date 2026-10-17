import type { MetadataRoute } from 'next';
import { loadVisibleDonations } from '@/lib/donations/repository';
import { EVENTS_PAGE } from '@/lib/events';
import { checkoutHref } from '@/lib/giving/links';
import { listEvents } from '@/lib/events/repository';
import { siteConfig } from '@/config/site';

/** Refresh hourly so past one-off events drop out. */
export const revalidate = 3600;

/** Add every public page here. Dynamic content (e.g. articles) can be fetched from the API. */
const staticRoutes = [
  '/',
  '/about',
  '/contact',
  '/appeal',
  '/donations',
  '/services/education/quran-academy',
  '/services/education/sisters-lessons',
  '/services/education/sunday-lessons',
  '/services/funerals',
  '/services/nikah',
  '/team',
  '/vision-mission',
  '/volunteering',
  EVENTS_PAGE,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, { programs }] = await Promise.all([listEvents(), loadVisibleDonations()]);
  const pages = [
    ...staticRoutes,
    // With only one cause on, /donate redirects to its form (listed below), so leave it out.
    ...(programs.length === 1 ? [] : ['/donate']),
    // Only causes shown on the website (hidden ones say they aren't open).
    ...programs.map((p) => checkoutHref(p.id)),
    ...events.map((event) => `${EVENTS_PAGE}/${event.id}`),
  ];
  // No lastModified: there's no real "last changed" date per page, and stamping every URL with
  // the render time teaches search engines to ignore it.
  return pages.map((path) => ({ url: `${siteConfig.url}${path === '/' ? '' : path}` }));
}
