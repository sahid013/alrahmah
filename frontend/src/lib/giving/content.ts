import { siteConfig } from '@/config/site';

/**
 * Copy for the donation page's left panel ("other ways to give").
 * TODO: confirm with the masjid: donation boxes, envelope details, and add cheque payee /
 * bank transfer details if they want them published.
 */
export const donatePanel = {
  background: {
    src: '/images/services/Al rahman quran academy.webp',
    alt: '',
  },
  title: siteConfig.name,
  heading: 'Other ways to give',
  paragraphs: [
    `Cash and cheques can be placed in the donation boxes inside the masjid at ${siteConfig.address.street}, ${siteConfig.address.locality} ${siteConfig.address.postalCode}.`,
    'Please put them in an envelope with your full name, address, email and phone number, so we can thank you and claim Gift Aid.',
  ],
  contact: {
    email: siteConfig.contact.email,
    phone: siteConfig.contact.phone,
  },
  closing: 'Jazakum Allahu khairan',
};
