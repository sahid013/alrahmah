import 'server-only';
import { DEFAULT_FROM, sendEmail, type Email, type SendResult } from '@/lib/email/resend';
import { CONTACT_FORMS, inboxFor, type ContactRequest } from './types';

/**
 * Email notification for a contact message, sent with Resend (`lib/email/resend.ts`).
 *  - CONTACT_EMAIL_TO_OVERRIDE: send every message to this address instead of the form's inbox.
 */
export type ContactEmail = Email;

export function buildContactEmail(
  r: ContactRequest,
  env: Record<string, string | undefined> = process.env,
): ContactEmail | null {
  const to = env.CONTACT_EMAIL_TO_OVERRIDE || inboxFor(r.form);
  if (!to) return null;
  const { label, subject } = CONTACT_FORMS[r.form];
  return {
    from: env.CONTACT_EMAIL_FROM || DEFAULT_FROM,
    to: [to],
    // "Reply" in the masjid's inbox answers the sender directly.
    reply_to: r.email,
    subject: `${subject} from ${r.name}`,
    text: [
      r.message,
      '',
      '—',
      `From: ${r.name} <${r.email}>`,
      `Form: ${label}${r.page ? ` (${r.page})` : ''}`,
      'Sent from the Al-Rahmah Masjid website. Reply to this email to answer them.',
    ].join('\n'),
  };
}

/** Sends the notification. Returns the inbox it went to, or why it wasn't sent. */
export async function sendContactEmail(r: ContactRequest): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) return { error: 'Email not set up (no RESEND_API_KEY)' };
  const email = buildContactEmail(r);
  if (!email) return { error: 'No inbox configured for this form' };
  return sendEmail(email);
}
