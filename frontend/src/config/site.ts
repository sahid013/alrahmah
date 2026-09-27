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
  address: { locality: 'Leeds', country: 'GB' },
  logo: { src: '/brand/Logo.svg', width: 600, height: 149 },
  /** Full logo in white + sky, for the transparent header over dark heroes. */
  logoLight: '/brand/logo-light.svg',
  logoMarkLight: '/brand/logo-mark-light.svg',
  /** Pages whose first section is dark: the header starts transparent over it. */
  headerOverlayRoutes: ['/', '/donate', '/events', '/volunteering'],
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
  /**
   * Contact details shown in the footer. Optional fields render only when set.
   * TODO: add the masjid's full street address, phone number and email.
   */
  contact: {
    addressLines: ['Leeds', 'United Kingdom'] as readonly string[],
    phone: undefined as string | undefined,
    email: undefined as string | undefined,
  },
  links: {
    donate: '/donate',
    // TODO: replace with the real WhatsApp channel invite link.
    whatsappChannel: 'https://whatsapp.com/channel/',
    /** External Google Form for volunteer applications. */
    volunteerForm:
      'https://docs.google.com/forms/d/e/1FAIpQLSf5V-Dtcq81qOWISDskeZNn5htAAoJboX9Zg7-qurTkz-KZvQ/viewform',
  },
  /**
   * Social channels promoted in the "Follow Us" nav dropdown.
   * TODO: replace every placeholder URL with Al-Rahmah's real profile links (remove any the
   * masjid doesn't use — the dropdown adapts to however many remain).
   */
  socials: [
    { platform: 'facebook', name: 'Facebook', href: 'https://www.facebook.com/' },
    { platform: 'youtube', name: 'YouTube', href: 'https://www.youtube.com/' },
    { platform: 'instagram', name: 'Instagram', href: 'https://www.instagram.com/' },
    { platform: 'whatsapp', name: 'WhatsApp', href: 'https://whatsapp.com/channel/' },
  ],
} as const;

export type SocialLink = (typeof siteConfig.socials)[number];
