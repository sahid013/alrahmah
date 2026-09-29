import type { EventItem } from './types';

/**
 * Local seed data. The repository reads this until the dashboard/API exists; after that it can
 * be deleted (or kept as a fallback). Validated on read, so a typo here fails the build.
 */
export const seedEvents: EventItem[] = [
  {
    id: 'seerah-of-muhammad',
    category: 'course',
    title: 'Seerah of Muhammad ﷺ',
    schedule: { kind: 'weekly', weekday: 'Friday', time: 'After Asr' },
    scheduleLabel: 'Every Friday After Asr',
    summary:
      'Learn more about the life of our beloved messenger ﷺ and the lessons we can implement from his life.',
    speaker: 'Ustadh Umar Muqaddam',
    image: {
      src: '/images/events/seerah-of-muhammad-poster.webp',
      width: 1000,
      height: 1412,
      alt: 'Seal of the Prophets poster — Seerah of Prophet Muhammad ﷺ and lessons learned, by Ustadh Umar Muqaddam',
    },
  },
  {
    id: 'umdatul-ahkaam',
    category: 'course',
    title: 'Umdatul-Ahkaam',
    schedule: { kind: 'weekly', weekday: 'Monday', time: 'After Asr' },
    scheduleLabel: 'Monday after Asr',
    summary:
      'Join us as we go through the book Umdatul Ahkaam written by the esteemed Imam Abd al-Ghani al-Maqdisi. It is a chance to learn Fiqh and to ask questions you may have',
    speaker: 'Ustadh Hussain Sattar',
    image: {
      src: '/images/events/umdatul-ahkaam-poster.webp',
      width: 1000,
      height: 1416,
      alt: "'Umdatul-Ahkaam poster — a foundational guide to fiqh through authentic hadeeth, delivered by Ustadh Hussain Sattar",
    },
  },
  {
    id: 'names-of-allaah',
    category: 'course',
    title: 'Names of Allaah',
    schedule: { kind: 'weekly', weekday: 'Thursday', time: 'After Asr' },
    scheduleLabel: 'Thursday after Asr',
    summary:
      'Learn more about our Lord, verily when we increase in our knowledge of Him. We increase in our love for Him and our fear of Him also increases. We go through the book Fiqh Al-Asma Al-Husna – by Shaykh ‘Abd Al-Razzaq Al-Badr',
    speaker: 'Ustadh Umar Muqaddam',
    image: {
      src: '/images/events/names-of-allaah-poster.webp',
      width: 1000,
      height: 1399,
      alt: 'Understanding the Beautiful Names of Allaah poster, by Ustadh Umar Muqaddam',
    },
  },
];
