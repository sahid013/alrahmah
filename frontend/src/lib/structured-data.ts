import { siteConfig } from '@/config/site';
import { nextOccurrence, type EventItem } from '@/lib/events';
import { todayAtMasjid } from '@/lib/events/calendar';

/**
 * Schema.org nodes (JSON-LD), rendered with `JsonLd`. Every node points back to the masjid by
 * its `@id`, and every URL is built from `siteConfig.url`, so the domain switch is one env var.
 */

const CONTEXT = 'https://schema.org';

/** Absolute URL for a site path, matching the canonical URLs (no trailing slash on the home page). */
const absolute = (path: string) => `${siteConfig.url}${path === '/' ? '' : path}`;

const MOSQUE_ID = `${siteConfig.url}/#mosque`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

const address = {
  '@type': 'PostalAddress',
  streetAddress: siteConfig.address.street,
  addressLocality: siteConfig.address.locality,
  addressRegion: siteConfig.address.region,
  postalCode: siteConfig.address.postalCode,
  addressCountry: siteConfig.address.country,
};

const areaServed = { '@type': 'City', name: siteConfig.address.locality };

/** The masjid and the website, rendered once on every page by the root layout. */
export const siteJsonLd = () => ({
  '@context': CONTEXT,
  '@graph': [
    {
      '@type': 'Mosque',
      '@id': MOSQUE_ID,
      name: siteConfig.name,
      alternateName: siteConfig.legalName,
      description: siteConfig.description,
      url: absolute('/'),
      logo: absolute(siteConfig.logo.src),
      image: absolute(siteConfig.photo),
      foundingDate: String(siteConfig.foundingYear),
      email: siteConfig.contact.email,
      address,
      areaServed,
      // Public profiles only: not placeholders, and not the WhatsApp group's invite link.
      sameAs: siteConfig.socials
        .filter((s) => !('placeholder' in s) && s.platform !== 'whatsapp')
        .map((s) => s.href),
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: absolute('/'),
      name: siteConfig.name,
      inLanguage: 'en-GB',
      publisher: { '@id': MOSQUE_ID },
    },
  ],
});

export interface Crumb {
  name: string;
  path: string;
}

const breadcrumbs = (trail: Crumb[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((crumb, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: crumb.name,
    item: absolute(crumb.path),
  })),
});

/** Breadcrumb trail below Home, e.g. `[{ name: 'Events', path: '/events' }, …]`. */
export const breadcrumbJsonLd = (trail: Crumb[]) => ({
  '@context': CONTEXT,
  ...breadcrumbs(trail),
});

interface ServicePage {
  /** Short name, also used as the breadcrumb, e.g. "Nikah". */
  name: string;
  serviceType: string;
  description: string;
  path: string;
}

/** A service the masjid offers (nikah, funerals, classes), with its breadcrumb. */
export const servicePageJsonLd = ({ name, serviceType, description, path }: ServicePage) => ({
  '@context': CONTEXT,
  '@graph': [
    {
      '@type': 'Service',
      name,
      serviceType,
      description,
      url: absolute(path),
      provider: { '@id': MOSQUE_ID },
      areaServed,
    },
    breadcrumbs([{ name, path }]),
  ],
});

/** UTC offset of UK time on a date, e.g. "+01:00" in summer. */
function londonOffset(date: string, time: string): string {
  const zone = new Intl.DateTimeFormat('en-GB', {
    timeZone: siteConfig.prayer.timeZone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(`${date}T${time}:00Z`))
    .find((part) => part.type === 'timeZoneName')?.value;
  return zone && zone !== 'GMT' ? zone.slice(3) : '+00:00';
}

const dateTime = (date: string, time?: string) =>
  time ? `${date}T${time}:00${londonOffset(date, time)}` : date;

/**
 * An event's next occurrence (weekly classes) or its date (one-off events). Returns null when a
 * weekly class has finished, since Google needs a real start date.
 */
export function eventJsonLd(event: EventItem, today = todayAtMasjid()) {
  const { schedule } = event;
  const date = nextOccurrence(schedule, today) ?? (schedule.kind === 'once' ? schedule.date : null);
  if (!date) return null;

  return {
    '@context': CONTEXT,
    '@type': 'Event',
    name: event.title,
    description: event.description ?? event.summary,
    url: absolute(`/events/${event.id}`),
    image: event.image && absolute(event.image.src),
    startDate: dateTime(date, schedule.startTime),
    endDate: schedule.endTime && dateTime(date, schedule.endTime),
    eventStatus: `${CONTEXT}/EventScheduled`,
    eventAttendanceMode: `${CONTEXT}/OfflineEventAttendanceMode`,
    location: { '@type': 'Place', name: siteConfig.name, address },
    organizer: { '@id': MOSQUE_ID },
    performer: event.speaker && { '@type': 'Person', name: event.speaker },
  };
}
