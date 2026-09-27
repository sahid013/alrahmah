/** Team profiles for /team. Kept as data so they can come from the dashboard later. */

export interface TeamMember {
  /** URL-safe id, also used as the profile's anchor (`/team#<id>`). */
  id: string;
  name: string;
  /** Role label shown above the name, when known. */
  role?: string;
  bio: string[];
  image: { src: string; alt: string; width: number; height: number };
}

export const teamMembers: TeamMember[] = [
  {
    id: 'sheikh-abu-usamah',
    name: 'Sheikh Abu Usamah',
    bio: [
      'Abu Usamah was born in New Jersey in 1964. He embraced Islam in 1986 and went onto studying in the Islamic University of Madinah for eight years where he graduated from the College of Da’wah and Usool-ad-Din.',
      'Abu Usamah has been very active in da’wah since the day he embraced Islam. He has been the Imam of various mosques in the United States and in the United Kingdom.',
      'Abu Usamah zeal and eagerness in conveying the true message of Islam has lead him to many parts of the world, delivering lectures and seminars, as well as translating for many scholars and du’aat from the Arab world.',
      'Abu Usamah has been blessed in studying with some of the greatest scholars of our time, to name a few, Sheikh Umar Fulaatah at the Rawdah of the Prophets Mosque, Sheikh Muhammad ‘Atiyyah Saalim (author of Tafsir ‘Adwaa ul-Bayaan’), Sheikh Abdullah Muhammad al-Ghunaymaan, Sheikh Muhammad al-Jaami, Sheikh Saalih al-Fawzaan and many more. He was also very fortunate to have spent two summers in intensive study under Sheikh Ibn Baaz and Sheikh Ibn Uthaymin.',
    ],
    image: {
      src: '/images/team/sheikh-abu-usamah.webp',
      alt: 'Portrait of Sheikh Abu Usamah',
      width: 664,
      height: 638,
    },
  },
  {
    id: 'ustadh-umar-muqaddam',
    name: 'Ustadh Umar Muqaddam',
    role: 'Coordinator',
    bio: [
      'Ustadh Umar Muqaddam is an experienced educational leader and coordinator with a strong commitment to the holistic development of children and young adults.',
      'His diverse background includes founding an online Islamic Studies Academy, coordinating academic programs in Saudi Arabia, and contributing to digital content design for educational institutions. With a passion for teaching and a focus on educational leadership, Ustadh Umar Muqaddam brings a wealth of knowledge and skills to his role as the Coordinator at Al-Rahmah Faith Centre.',
    ],
    image: {
      src: '/images/team/ustadh-umar-muqaddam.webp',
      alt: 'Portrait of Ustadh Umar Muqaddam',
      width: 716,
      height: 524,
    },
  },
];
