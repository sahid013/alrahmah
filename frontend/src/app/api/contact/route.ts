import { createHmac } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { sendContactEmail } from '@/lib/contact/email';
import { contactRequestSchema, inboxFor, looksLikeBot } from '@/lib/contact/types';
import { adminClient } from '@/lib/supabase/server';

/** At most this many messages from one sender in RATE_WINDOW_MINUTES. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MINUTES = 10;

/** Keyed hash of the sender's IP (never stored in the clear), only used for the rate limit. */
function ipHash(request: NextRequest): string | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const key = process.env.SUPABASE_SECRET_KEY;
  return ip && key ? createHmac('sha256', key).update(`contact:${ip}`).digest('hex') : null;
}

/**
 * POST a contact form message → saved in Supabase `contact_messages` (dashboard → Messages), then
 * emailed to that form's inbox (`lib/contact/email.ts`). The message counts as sent once it's
 * saved, even if the email fails (the dashboard shows why). Bots get a normal-looking reply.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' },
      { status: 400 },
    );
  const r = parsed.data;
  if (looksLikeBot(r)) return NextResponse.json({ ok: true });

  const db = adminClient();
  const hash = ipHash(request);
  if (hash) {
    const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await db
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', hash)
      .gte('created_at', since);
    if ((count ?? 0) >= RATE_LIMIT)
      return NextResponse.json(
        { error: 'You’ve sent several messages in a short time. Please try again later.' },
        { status: 429 },
      );
  }

  const { data: saved, error } = await db
    .from('contact_messages')
    .insert({
      form: r.form,
      name: r.name,
      email: r.email,
      message: r.message,
      page: r.page ?? null,
      ip_hash: hash,
    })
    .select('id')
    .single<{ id: string }>();

  const sent = await sendContactEmail(r);
  if (saved) {
    const { error: updateError } = await db
      .from('contact_messages')
      .update('sentTo' in sent ? { emailed_to: sent.sentTo } : { email_error: sent.error })
      .eq('id', saved.id);
    if (updateError) console.error('[contact] could not note email result', updateError.message);
  }
  if ('error' in sent) console.error('[contact] email not sent:', sent.error);

  // Neither saved nor emailed: tell the sender, so the message isn't lost.
  if (!saved && !('sentTo' in sent)) {
    console.error('[contact] could not save message', error?.message);
    const inbox = inboxFor(r.form);
    return NextResponse.json(
      {
        error: `Sorry, your message couldn’t be sent. Please email us${inbox ? ` at ${inbox}` : ''}.`,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
