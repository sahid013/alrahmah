import { siteConfig } from '@/config/site';

/**
 * Hero slideshow content. Kept as plain data so it can later come from the backend/CMS
 * (`api.get<HeroSlide[]>('/hero-slides')`) without touching the component.
 */
export interface HeroSlide {
  id: string;
  /** Short label for the slide tabs, e.g. "Welcome". */
  label: string;
  eyebrow: string;
  title: string;
  body: string[];
  /** Short supporting line shown above the buttons. */
  note?: string;
  primaryCta: { label: string; href: string; icon?: 'whatsapp' | 'heart' };
  secondaryCta?: { label: string; href: string };
  visual: 'welcome' | 'appeal';
}

export const heroSlides: HeroSlide[] = [
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
    visual: 'welcome',
  },
  {
    id: 'appeal',
    label: 'Our Appeal',
    eyebrow: 'Our Appeal',
    title: 'Make Space for Rahmah',
    // Full appeal text lives on /donate.
    body: ['We have outgrown our current premises. Help us move to a larger building.'],
    primaryCta: { label: 'Donate now', href: siteConfig.links.donate, icon: 'heart' },
    secondaryCta: { label: 'About the appeal', href: siteConfig.links.donate },
    visual: 'appeal',
  },
];
