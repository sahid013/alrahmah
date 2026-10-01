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
    id: 'ustadh-umar-muqaddam',
    name: 'Ustadh Umar Muqaddam',
    role: 'Coordinator',
    bio: [
      'Ustadh Umar Muqaddam is an experienced educational leader and coordinator with a strong commitment to the holistic development of children and young adults.',
      'His diverse background includes founding an online Islamic Studies Academy, coordinating academic programs in Saudi Arabia, and contributing to digital content design for educational institutions. With a passion for teaching and a focus on educational leadership, Ustadh Umar Muqaddam brings a wealth of knowledge and skills to his role as the Coordinator at Al-Rahmah Faith Centre.',
    ],
    image: {
      src: '/images/team/ustadh-umar-muqaddam-2026.webp',
      alt: 'Portrait of Ustadh Umar Muqaddam',
      width: 900,
      height: 900,
    },
  },
  {
    id: 'ustadh-hussain-sattar',
    name: 'Ustadh Hussain Sattar',
    // TODO: PLACEHOLDER — temporarily copied from Ustadh Umar Muqaddam's bio (name swapped).
    // Replace with Ustadh Hussain's own bio as soon as it arrives; the claims below are Umar's.
    bio: [
      'Ustadh Hussain Sattar is an experienced educational leader and coordinator with a strong commitment to the holistic development of children and young adults.',
      'His diverse background includes founding an online Islamic Studies Academy, coordinating academic programs in Saudi Arabia, and contributing to digital content design for educational institutions. With a passion for teaching and a focus on educational leadership, Ustadh Hussain Sattar brings a wealth of knowledge and skills to his role as the Coordinator at Al-Rahmah Faith Centre.',
    ],
    image: {
      src: '/images/team/ustadh-hussain-sattar.webp',
      alt: 'Portrait of Ustadh Hussain Sattar',
      width: 900,
      height: 900,
    },
  },
];
