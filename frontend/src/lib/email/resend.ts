import 'server-only';

/**
 * Sends an email with Resend (https://resend.com, HTTP API, no SDK). Used by the contact forms and
 * the donation receipts. Server env:
 *  - RESEND_API_KEY: without it nothing is sent.
 *  - CONTACT_EMAIL_FROM: sender, `Al-Rahmah Masjid website <website@info.alrahmahmasjid.co.uk>`
 *    (that domain is verified in Resend). Without it Resend's shared sender is used, which can
 *    only deliver to the Resend account owner's own address.
 */
export const DEFAULT_FROM = 'Al-Rahmah Masjid website <onboarding@resend.dev>';

export interface Email {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  html?: string;
}

export type SendResult = { sentTo: string } | { error: string };

/** `idempotencyKey`: Resend sends an email with the same key only once (within 24 hours). */
export async function sendEmail(email: Email, idempotencyKey?: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: 'Email not set up (no RESEND_API_KEY)' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
      },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { sentTo: email.to[0]! };
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { error: `Resend ${res.status}: ${body.message ?? res.statusText}`.slice(0, 300) };
  } catch (error) {
    return { error: error instanceof Error ? error.message.slice(0, 300) : 'Email failed' };
  }
}
