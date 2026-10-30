import { z } from 'zod';
import { CONTACT_FORM_IDS, CONTACT_FORMS, inboxFor, type ContactFormId } from './forms';

/** The forms themselves live in `./forms` (no zod), so the contact page's JavaScript stays small. */
export { CONTACT_FORM_IDS, CONTACT_FORMS, inboxFor, type ContactFormId };

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
