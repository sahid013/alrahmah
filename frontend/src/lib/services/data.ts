/**
 * Masjid services — the single source for the navbar "Services" menu and the home page
 * services section.
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
          'Structured Qur’an reading, tajweed and memorisation classes for children and adults.',
      },
      {
        title: 'Sunday Weekly Lessons',
        href: '/services/education/sunday-lessons',
        image: {
          src: '/images/services/Sunday weekly lesson.webp',
          alt: 'A teacher leading a lesson with a seated circle of students in the masjid',
        },
        icon: 'weekly',
        summary:
          'Weekly lessons every Sunday covering core Islamic knowledge for the whole community.',
      },
      {
        title: 'Sisters’ Only Lessons',
        href: '/services/education/sisters-lessons',
        image: {
          src: '/images/services/sisters only lesson.webp',
          alt: 'A sisters’ class, with a teacher reading to women seated in the prayer hall',
        },
        icon: 'sisters',
        summary: 'A welcoming space for sisters to learn, ask questions and grow together.',
      },
    ],
  },
  {
    title: 'Nikah (Marriage)',
    href: '/services/nikah',
    image: {
      src: '/images/services/Nikah.webp',
      alt: 'A nikah ceremony: the couple seated at a flower-covered table with the imam and family',
    },
    icon: 'nikah',
    summary:
      'Nikah ceremonies conducted at the masjid, with guidance for couples and their families.',
  },
];

/** Leaf services (parents replaced by their children), in display order. */
export const flattenServices = (list: Service[] = services): Service[] =>
  list.flatMap((s) => (s.children ? flattenServices(s.children) : [s]));
