import { z } from 'zod';
import { siteConfig } from '@/config/site';

/**
 * Website contact forms. Each one has its own inbox and email subject, decided here (never by
 * the browser), so the form can't be used to send email anywhere else.
 */
export const CONTACT_FORMS = {
  general: { label: 'General enquiry', subject: 'Website enquiry' },
  funerals: { label: 'Funeral query', subject: 'Funeral query' },
  'quran-academy': { label: 'Quran Academy', subject: 'Quran Academy: register interest' },
} as const;
export type ContactFormId = keyof typeof CONTACT_FORMS;
export const CONTACT_FORM_IDS = Object.keys(CONTACT_FORMS) as [ContactFormId, ...ContactFormId[]];

/** Inbox each form's messages are emailed to. */
export function inboxFor(form: ContactFormId): string | undefined {
  const { contact } = siteConfig;
  return form === 'funerals' ? contact.funeralsEmail : contact.email;
}

/** What the form posts to `POST /api/contact`. */
export const contactRequestSchema = z.object({
  form: z.enum(CONTACT_FORM_IDS),
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name')
    .max(100, 'Please shorten your name')
    // Goes into the email subject: no line breaks.
    .refine((v) => !/[\r\n]/.test(v), 'Enter your name on one line'),
  email: z.email('Enter a valid email address').max(254),
  message: z
    .string()
    .trim()
    .min(1, 'Enter your message')
    .max(5000, 'Please keep your message under 5,000 characters'),
  page: z.string().max(300).optional(),
  /** Hidden field people never see; anything in it means a bot. */
  website: z.string().max(500).optional(),
  /** Milliseconds between the form appearing and being sent (bots are instant). */
  elapsedMs: z.number().int().nonnegative().optional(),
});
export type ContactRequest = z.infer<typeof contactRequestSchema>;

/** Quietly accepted but not stored: filled honeypot, or sent faster than a person could type. */
export const looksLikeBot = (r: Pick<ContactRequest, 'website' | 'elapsedMs'>) =>
  !!r.website?.trim() || (r.elapsedMs !== undefined && r.elapsedMs < 2000);

export const MESSAGE_STATUSES = ['new', 'read', 'archived'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

/** A stored message, as the dashboard shows it. */
export interface ContactMessage {
  id: string;
  createdAt: string;
  form: ContactFormId;
  name: string;
  email: string;
  message: string;
  page?: string;
  status: MessageStatus;
  /** Inbox the notification went to; unset when it wasn't emailed (see `emailError`). */
  emailedTo?: string;
  emailError?: string;
}
