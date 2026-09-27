/** Copy for the /about page. Kept as data so it can come from the dashboard later. */

export interface AboutBlock {
  title: string;
  description: string;
}

export const aboutIntro = [
  'Al Rahmah Masjid Leeds, established in 2018, has been serving the Muslim community and the larger society with unwavering dedication. Over the years, it has grown to become one of the fastest-growing mosques in the vibrant city of Leeds.',
  'At Al Rahmah Masjid, the doors are open to visitors throughout the year, creating an atmosphere of inclusivity and brotherhood. Many individuals from diverse backgrounds and beliefs come with a desire to learn more about the mosque and the teachings of the Islamic faith.',
  'Comprising of two storeys, Al Rahmah Masjid provides ample space for prayer, gatherings, and educational activities. The mosque’s commitment to fostering interfaith dialogue and community engagement has further endeared it to the local population. By offering various services and programs, the mosque plays a crucial role in promoting understanding, tolerance, and unity among diverse communities.',
] as const;

/** Closing line of the intro, shown as a highlighted statement. */
export const aboutStatement =
  'As Al Rahmah Masjid Leeds continues to grow, it remains a beacon of spiritual guidance, cultural enrichment, and social support for all who seek it.';

export const floors: AboutBlock[] = [
  {
    title: 'Ground Floor',
    description:
      'Sisters’ prayer hall and wudhu/toilet facilities, additional prayer room and education hall, Imam’s office, disabled toilet facility.',
  },
  {
    title: 'First Floor',
    description: 'Main prayer hall, wudhu/toilet facilities, education classes.',
  },
];

export const floorsNote =
  'The masjid is a small building unit but do what we can by the permission of Allah to serve our community in all spheres.';

export const highlights: AboutBlock[] = [
  {
    title: 'Services',
    description:
      'We provide a broad range of services out of our centre. Prayers, lectures, lessons, madrasah, nikaah (marriages), counselling for individuals/families, youth activities, sister circles, and many other communal services.',
  },
  {
    title: 'Brotherhood',
    description:
      'Al-Rahmah Masjid has a very diverse community consisting of brothers and sisters from all types of backgrounds and walks of life. The atmosphere at the Masjid is welcoming to all and we take pride in the unity and brotherhood of our community.',
  },
  {
    title: 'Masjid History',
    description:
      'The fastest growing masjid in Leeds is Al Rahmah Masjid. Once a Congregational Church, it was bought in 2018 and turned into a mosque. Since its inception our congregation has been ever-growing.',
  },
];
