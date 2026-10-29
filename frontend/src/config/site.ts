import { env } from './env';

/** Single source of truth for site-wide branding, links and SEO defaults. Navigation lives in `navigation.ts`. */
export const siteConfig = {
  name: 'Al-Rahmah Masjid',
  /** Name as shown in the logo. */
  legalName: 'Al-Rahmah Faith Centre',
  description:
    'Al-Rahmah Masjid Leeds, established in 2018 — a welcoming mosque serving the Muslim community and the wider society of Leeds.',
  url: env.siteUrl,
  locale: 'en_GB',
  foundingYear: 2018,
  address: {
    street: '6 Sheepscar Way',
    locality: 'Leeds',
    region: 'West Yorkshire',
    postalCode: 'LS7 3JB',
    country: 'GB',
  },
  logo: { src: '/brand/Logo.svg', width: 600, height: 149 },
  /** Photo of the building, used in structured data (the home hero's first slide). */
  photo: '/images/hero/al-rahmah-centre-night.webp',
  /** Full logo in white + sky, for the transparent header over dark heroes. */
  logoLight: '/brand/logo-light.svg',
  logoMarkLight: '/brand/logo-mark-light.svg',
  /** Emblem in brand colours (light backgrounds) and mono navy (on light blue). */
  logoMark: '/brand/logo-mark.svg',
  logoMarkDark: '/brand/logo-mark-dark.svg',
  /** Pages whose first section is dark: the header starts transparent over it. */
  headerOverlayRoutes: [
    '/',
    '/about',
    '/contact',
    '/appeal',
    '/donations',
    '/events',
    '/services',
    '/services/education',
    '/services/education/quran-academy',
    '/services/education/sisters-lessons',
    '/services/education/sunday-lessons',
    '/services/funerals',
    '/services/nikah',
    '/team',
    '/impact-reports',
    '/vision-mission',
    '/volunteering',
    '/cookies',
  ],
  /**
   * Prayer-time calculation settings for the masjid's location.
   * TODO: confirm the calculation method and Asr madhab with the masjid, or replace the
   * calculation with the masjid's own timetable from the backend.
   */
  prayer: {
    latitude: 53.8008,
    longitude: -1.5491,
    timeZone: 'Europe/London',
    method: 'MoonsightingCommittee',
    madhab: 'hanafi',
  },
  /** Contact details shown in the footer and on /contact. Optional fields render only when set.
   * No phone number anywhere on the site (client request, October 2026): email and the forms only. */
  contact: {
    addressLines: ['6 Sheepscar Way', 'Leeds LS7 3JB'] as readonly string[],
    email: 'info@alrahmahmasjid.co.uk' as string | undefined,
    /** Funeral (janazah) queries; same inbox as everything else for now, kept separate to change later. */
    funeralsEmail: 'info@alrahmahmasjid.co.uk',
    /** Google Maps embed (no API key needed) and directions link for the address. */
    mapEmbedUrl:
      'https://maps.google.com/maps?q=6%20Sheepscar%20Way%2C%20Leeds%20LS7%203JB&z=14&output=embed',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=6%20Sheepscar%20Way%2C%20Leeds%20LS7%203JB',
  },
  links: {
    /** On-site donation flow; site-wide "Donate" buttons point here. */
    donate: '/donate',
    /** Donation programmes page (all causes). */
    donations: '/donations',
    appeal: '/appeal',
    /** Official "Make Space for Rahmah" appeal website (full details). */
    appealWebsite: 'https://makespaceforrahmah.com/',
    /** Official online donation page for the appeal. */
    appealDonate: 'https://fundraising.alrahmah.org.uk/makespace',
    // TODO: replace with the real WhatsApp channel invite link.
    /** The masjid's WhatsApp community (invite link); every WhatsApp button uses it. */
    whatsappChannel: 'https://chat.whatsapp.com/JBmHavm9v7qBeDlEzItaGk',
    /** External Google Form for volunteer applications. */
    volunteerForm:
      'https://docs.google.com/forms/d/e/1FAIpQLSf5V-Dtcq81qOWISDskeZNn5htAAoJboX9Zg7-qurTkz-KZvQ/viewform',
    /** External Google Form for nikah bookings (the nikah certificate details). */
    nikahBooking:
      'https://docs.google.com/forms/d/e/1FAIpQLSeEoYMAjxOIh11N9MqCvBy0GGGSkPsCnSoXGZaDHTQma3jOVg/viewform?usp=header',
  },
  /** YouTube channel, and its "Weekly Khutbah Videos" playlist (newest first) shown on the home page. */
  youtube: {
    channel: 'https://www.youtube.com/@alrahmahmasjid',
    khutbahPlaylistId: 'PLATxZb7uoh6DSDhYSsk6TsaNSWYTQ5rUA',
  },
  /**
   * Social channels promoted in the "Follow Us" nav dropdown.
   * All real (October 2026); the dropdown adapts to however many there are. Mark a link that
   * isn't real yet with `placeholder: true` to keep it out of the structured data (`sameAs`).
   */
  socials: [
    { platform: 'tiktok', name: 'TikTok', href: 'https://www.tiktok.com/@alrahmahmasjid_' },
    { platform: 'youtube', name: 'YouTube', href: 'https://www.youtube.com/@alrahmahmasjid' },
    {
      platform: 'instagram',
      name: 'Instagram',
      href: 'https://www.instagram.com/alrahmahmasjid_/',
    },
    {
      platform: 'whatsapp',
      name: 'WhatsApp',
      href: 'https://chat.whatsapp.com/JBmHavm9v7qBeDlEzItaGk',
    },
  ],
} as const;

export type SocialLink = (typeof siteConfig.socials)[number];
