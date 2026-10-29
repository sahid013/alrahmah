/**
 * Masjid services — the single source for the navbar "Services" menu, the home page services
 * section and the all-services page (`/services`, one section per top-level service).
 *
 * TODO: summaries are DRAFTS (replace with the masjid's wording), and swap the placeholder
 * masjid photos below for a real photo of each service.
 */

export type ServiceIcon = 'funeral' | 'nikah' | 'quran' | 'weekly' | 'sisters' | 'education';

export interface Service {
  title: string;
  href: string;
  summary: string;
  icon: ServiceIcon;
  image?: { src: string; alt: string };
  /** Key facts shown on overview pages, e.g. "Every Sunday evening" (keep in step with the page). */
  facts?: string[];
  children?: Service[];
}

export const services: Service[] = [
  {
    title: 'Funerals',
    href: '/services/funerals',
    image: {
      src: '/images/services/funeral Image.webp',
      alt: 'Mourners standing in prayer beside a shrouded body at a Muslim graveside at sunset',
    },
    icon: 'funeral',
    summary:
      'Support for families at a difficult time, from washing and shrouding to the janazah prayer and burial arrangements.',
    facts: ['Washing & shrouding', 'Janazah prayer', 'Burial arrangements'],
  },
  {
    title: 'Education',
    href: '/services/education',
    image: {
      src: '/images/services/Al rahman quran academy.webp',
      alt: 'Children and families arriving at Al-Rahmah Faith Centre for classes',
    },
    icon: 'education',
    summary: 'Qur’an, Islamic studies and weekly classes for all ages.',
    children: [
      {
        title: 'Al-Rahmah Quran Academy',
        href: '/services/education/quran-academy',
        image: {
          src: '/images/services/Al rahman quran academy.webp',
          alt: 'Children and families arriving at Al-Rahmah Faith Centre for Quran classes',
        },
        icon: 'quran',
        summary:
          'Qur’an and Islamic studies for children aged 5 to 15, taught by male and female teachers under Imam Umar Muqaddam.',
        facts: ['Ages 5–15', 'Mon–Thu, 5pm–7pm', 'Waiting list'],
      },
      {
        title: 'Sunday Weekly Lessons',
        href: '/services/education/sunday-lessons',
        image: {
          src: '/images/services/Sunday weekly lesson.webp',
          alt: 'An open Qur’an on a carved wooden stand in the lamp-lit prayer hall',
        },
        icon: 'weekly',
        summary:
          'Weekly lessons every Sunday covering core Islamic knowledge for the whole community.',
        facts: ['Every Sunday evening', 'Open to all'],
      },
      {
        title: 'Sisters’ Only Lessons',
        href: '/services/education/sisters-lessons',
        image: {
          src: '/images/services/sisters only lesson.webp',
          alt: 'An open Qur’an on a stand among cushions, notebooks and flowers in a warmly lit prayer hall',
        },
        icon: 'sisters',
        summary: 'A welcoming space for sisters to learn, ask questions and grow together.',
        facts: ['Every Sunday afternoon', 'Sisters only'],
      },
    ],
  },
  {
    title: 'Nikah (Marriage)',
    href: '/services/nikah',
    image: {
      src: '/images/services/Nikah Image.webp',
      alt: 'A groom in white placing a ring on his bride’s finger in warm evening light',
    },
    icon: 'nikah',
    summary:
      'Nikah ceremonies conducted at the masjid, with guidance for couples and their families.',
    facts: ['At the masjid', 'Book 4 weeks ahead'],
  },
];

/** Leaf services (parents replaced by their children), in display order. */
export const flattenServices = (list: Service[] = services): Service[] =>
  list.flatMap((s) => (s.children ? flattenServices(s.children) : [s]));

/** In-page anchor for a service on `/services`, from the last part of its URL ("funerals"). */
export const serviceAnchor = (service: Service) => service.href.split('/').pop()!;
