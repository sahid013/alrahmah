import { siteConfig } from '@/config/site';
import { EVENTS_PAGE, eventScheduleText, getEventHref, type EventItem } from '@/lib/events';

/**
 * Hero slideshow content. Kept as plain data so it can later come from the backend/CMS
 * (`api.get<HeroSlide[]>('/hero-slides')`) without touching the component.
 */
export interface HeroSlide {
  id: string;
  /** Short label for the slide tracker, e.g. "Welcome". */
  label: string;
  eyebrow: string;
  /** Title text; `\n` forces a line break (e.g. to balance a two-line heading). */
  title: string;
  body: string[];
  /** Short supporting line shown above the buttons. */
  note?: string;
  primaryCta: { label: string; href: string; icon?: 'whatsapp' | 'heart' };
  secondaryCta?: { label: string; href: string };
  /** Full-bleed background photo. Without one the slide shows navy with the star pattern. */
  background?: { src: string; alt: string };
  /** Poster shown beside the text on desktop (event slides without a background photo). */
  poster?: { src: string; alt: string; width: number; height: number };
}

/** The event highlighted in the hero (falls back to the first event when it's gone). */
export const FEATURED_EVENT_ID = 'seerah-of-muhammad';

/**
 * Background photo for the featured event. Optimised copy of public/images/hero/Serah
 * Background.png (the Seerah poster's photo without its text). Only used for that event.
 */
const featuredEventBackground = {
  src: '/images/hero/seerah-background.webp',
  alt: 'Ornate arched entrance of a masjid with a hanging lantern and a carved golden door',
};

const fixedSlides: HeroSlide[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    eyebrow: `Leeds · Est. ${siteConfig.foundingYear}`,
    // Hyphen + word joiner keeps "Al-Rahmah" on one line in any title font.
    title: 'Welcome to Al-\u2060Rahmah Masjid',
    // Keep hero copy to one short line — the full story lives on /about.
    body: ['Serving the Muslim community and the wider society of Leeds since 2018.'],
    primaryCta: {
      label: 'Join our WhatsApp channel',
      href: siteConfig.links.whatsappChannel,
      icon: 'whatsapp',
    },
    secondaryCta: { label: 'About the masjid', href: '/about' },
    // Optimised copy of public/images/Common/Al-Rahmah Faith Centre at Night Hero Image.png.
    background: {
      src: '/images/hero/al-rahmah-centre-night.webp',
      alt: 'Al-Rahmah Faith Centre at night, with worshippers gathered outside the entrance',
    },
  },
  {
    id: 'appeal',
    label: 'Our Appeal',
    eyebrow: 'Our Appeal',
    title: 'Make Space for Rahmah',
    // Summary lives on /appeal; full details on the appeal website.
    body: ['We have outgrown our current premises. Help us move to a larger building.'],
    primaryCta: { label: 'Donate now', href: siteConfig.links.appealDonate, icon: 'heart' },
    secondaryCta: { label: 'About the appeal', href: siteConfig.links.appeal },
    background: {
      src: '/images/hero/new-mosque.webp',
      alt: 'Aerial view of the property proposed as Al-Rahmah Masjid’s new home',
    },
  },
];

/**
 * Balanced hero heading for an event title: "Seerah of Muhammad ﷺ" → "Seerah of" / "Muhammad ﷺ".
 * The name and ﷺ always stay together on the second line.
 */
const heroTitle = (title: string) => title.replace(/\s+Muhammad\s*ﷺ$/u, '\nMuhammad\u00a0ﷺ');

/**
 * Slide for one event: its schedule and speaker, title, summary, and the background photo when
 * there is one (otherwise its poster beside the text).
 */
function eventSlide(event: EventItem, background?: HeroSlide['background']): HeroSlide {
  return {
    id: `event-${event.id}`,
    label: 'Featured Event',
    eyebrow: [eventScheduleText(event), event.speaker].filter(Boolean).join(' · '),
    title: heroTitle(event.title),
    body: [event.summary],
    primaryCta: { label: 'Event details', href: getEventHref(event) },
    secondaryCta: { label: 'All events', href: EVENTS_PAGE },
    ...(background ? { background } : { poster: event.image }),
  };
}

/** Welcome, Our Appeal, then the featured event (left out when there are no events). */
export function buildHeroSlides(events: EventItem[]): HeroSlide[] {
  const featured = events.find((e) => e.id === FEATURED_EVENT_ID) ?? events[0];
  if (!featured) return fixedSlides;
  const background = featured.id === FEATURED_EVENT_ID ? featuredEventBackground : undefined;
  return [...fixedSlides, eventSlide(featured, background)];
}
