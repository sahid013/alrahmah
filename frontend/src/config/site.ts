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
    postalCode: 'LS7 3JB',
    country: 'GB',
  },
  logo: { src: '/brand/Logo.svg', width: 600, height: 149 },
  /** Full logo in white + sky, for the transparent header over dark heroes. */
  logoLight: '/brand/logo-light.svg',
  logoMarkLight: '/brand/logo-mark-light.svg',
  /** Pages whose first section is dark: the header starts transparent over it. */
  headerOverlayRoutes: [
    '/',
    '/about',
    '/contact',
    '/donate',
    '/events',
    '/services/funerals',
    '/services/nikah',
    '/team',
    '/vision-mission',
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
  /** Contact details shown in the footer and on /contact. Optional fields render only when set. */
  contact: {
    addressLines: ['6 Sheepscar Way', 'Leeds LS7 3JB'] as readonly string[],
    phone: '07508 044680' as string | undefined,
    email: 'alrahmahleeds@gmail.com' as string | undefined,
    /** Funeral (janazah) queries go to a separate inbox. */
    funeralsEmail: 'info@alrahmah.org.uk',
    /** Google Maps embed (no API key needed) and directions link for the address. */
    mapEmbedUrl:
      'https://maps.google.com/maps?q=6%20Sheepscar%20Way%2C%20Leeds%20LS7%203JB&z=14&output=embed',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=6%20Sheepscar%20Way%2C%20Leeds%20LS7%203JB',
  },
  links: {
    donate: '/donate',
    // TODO: replace with the real WhatsApp channel invite link.
    whatsappChannel: 'https://whatsapp.com/channel/',
    // TODO: replace with the nikah booking / certificate form link.
    nikahBooking: '/contact',
  },
  /**
   * Social channels promoted in the "Follow Us" nav dropdown.
   * TODO: replace every placeholder URL with Al-Rahmah's real profile links (remove any the
   * masjid doesn't use — the dropdown adapts to however many remain).
   */
  socials: [
    {
      platform: 'whatsapp',
      name: 'WhatsApp',

      href: 'https://whatsapp.com/channel/',
    },
    {
      platform: 'instagram',
      name: 'Instagram',

      href: 'https://www.instagram.com/',
    },
    {
      platform: 'facebook',
      name: 'Facebook',

      href: 'https://www.facebook.com/',
    },
    {
      platform: 'youtube',
      name: 'YouTube',

      href: 'https://www.youtube.com/',
    },
    { platform: 'tiktok', name: 'TikTok', href: 'https://www.tiktok.com/' },
  ],
} as const;

export type SocialLink = (typeof siteConfig.socials)[number];
