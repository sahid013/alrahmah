import { siteConfig } from '@/config/site';

/**
 * Website contact forms. Each one has its own inbox and email subject, decided here (never by
 * the browser), so the form can't be used to send email anywhere else.
 */
export const CONTACT_FORMS = {
  general: { label: 'General enquiry', subject: 'Website enquiry' },
  funerals: { label: 'Funeral query', subject: 'Funeral query' },
  // The madrasah now registers through its Google Form (November 2026); kept so earlier
  // registrations still show in the dashboard's Messages.
  'quran-academy': {
    label: 'Al-Rahmah Madrasah',
    subject: 'Al-Rahmah Madrasah: register interest',
  },
} as const;
export type ContactFormId = keyof typeof CONTACT_FORMS;
export const CONTACT_FORM_IDS = Object.keys(CONTACT_FORMS) as [ContactFormId, ...ContactFormId[]];

/** Inbox each form's messages are emailed to. */
export function inboxFor(form: ContactFormId): string | undefined {
  const { contact } = siteConfig;
  return form === 'funerals' ? contact.funeralsEmail : contact.email;
}
