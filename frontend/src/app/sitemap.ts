import type { MetadataRoute } from 'next';
import { EVENTS_PAGE } from '@/lib/events';
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
  const pages = [
    ...staticRoutes,
    ...(await listEvents()).map((event) => `${EVENTS_PAGE}/${event.id}`),
  ];
  return pages.map((path) => ({
    url: `${siteConfig.url}${path === '/' ? '' : path}`,
    lastModified: new Date(),
  }));
}
