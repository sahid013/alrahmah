import { siteConfig } from '@/config/site';

/**
 * Hero slideshow content. Kept as plain data so it can later come from the backend/CMS
 * (`api.get<HeroSlide[]>('/hero-slides')`) without touching the component.
 */
export interface HeroSlide {
  id: string;
  /** Short label for the slide tracker, e.g. "Welcome". */
  label: string;
  eyebrow: string;
  title: string;
  body: string[];
  /** Short supporting line shown above the buttons. */
  note?: string;
  primaryCta: { label: string; href: string; icon?: 'whatsapp' | 'heart' };
  secondaryCta?: { label: string; href: string };
  /** Full-bleed background photo. */
  background: { src: string; alt: string };
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
