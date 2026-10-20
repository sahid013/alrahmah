import 'server-only';
import { CONTACT_FORMS, inboxFor, type ContactRequest } from './types';

/**
 * Email notification for a contact message, sent with Resend (https://resend.com, HTTP API, no
 * SDK). Server env:
 *  - RESEND_API_KEY: without it, messages are only saved to the dashboard.
 *  - CONTACT_EMAIL_FROM: sender, e.g. "Al-Rahmah Masjid website <website@alrahmah.org.uk>" once
 *    the domain is verified in Resend. Until then Resend's shared sender is used, which can only
 *    deliver to the Resend account owner's own address.
 *  - CONTACT_EMAIL_TO_OVERRIDE: send every message to this address instead (e.g. that owner
 *    address, while the domain isn't verified).
 */
const DEFAULT_FROM = 'Al-Rahmah Masjid website <onboarding@resend.dev>';

export interface ContactEmail {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
}

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
export async function sendContactEmail(
  r: ContactRequest,
): Promise<{ sentTo: string } | { error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: 'Email not set up (no RESEND_API_KEY)' };
  const email = buildContactEmail(r);
  if (!email) return { error: 'No inbox configured for this form' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
    if (res.ok) return { sentTo: email.to[0]! };
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { error: `Resend ${res.status}: ${body.message ?? res.statusText}`.slice(0, 300) };
  } catch (error) {
    return { error: error instanceof Error ? error.message.slice(0, 300) : 'Email failed' };
  }
}
