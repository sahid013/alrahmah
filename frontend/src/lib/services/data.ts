/**
 * Masjid services — the single source for the navbar "Services" menu and the home page
 * services section.
 *
 * TODO: summaries are DRAFTS (replace with the masjid's wording), and add a real `image`
 * (photo) for each service; cards fall back to a brand panel with a line icon until then.
 */

export type ServiceIcon = 'funeral' | 'nikah' | 'quran' | 'weekly' | 'sisters' | 'education';

export interface Service {
  title: string;
  href: string;
  summary: string;
  icon: ServiceIcon;
  image?: { src: string; alt: string };
  children?: Service[];
}

export const services: Service[] = [
  {
    title: 'Funerals',
    href: '/services/funerals',
    icon: 'funeral',
    summary:
      'Support for families at a difficult time, from washing and shrouding to the janazah prayer and burial arrangements.',
  },
  {
    title: 'Education',
    href: '/services/education',
    icon: 'education',
    summary: 'Qur’an, Islamic studies and weekly classes for all ages.',
    children: [
      {
        title: 'Al-Rahmah Quran Academy',
        href: '/services/education/quran-academy',
        icon: 'quran',
        summary:
          'Structured Qur’an reading, tajweed and memorisation classes for children and adults.',
      },
      {
        title: 'Sunday Weekly Lessons',
        href: '/services/education/sunday-lessons',
        icon: 'weekly',
        summary:
          'Weekly lessons every Sunday covering core Islamic knowledge for the whole community.',
      },
      {
        title: 'Sisters’ Only Lessons',
        href: '/services/education/sisters-lessons',
        icon: 'sisters',
        summary: 'A welcoming space for sisters to learn, ask questions and grow together.',
      },
    ],
  },
  {
    title: 'Nikah (Marriage)',
    href: '/services/nikah',
    icon: 'nikah',
    summary:
      'Nikah ceremonies conducted at the masjid, with guidance for couples and their families.',
  },
];

/** Leaf services (parents replaced by their children), in display order. */
export const flattenServices = (list: Service[] = services): Service[] =>
  list.flatMap((s) => (s.children ? flattenServices(s.children) : [s]));
