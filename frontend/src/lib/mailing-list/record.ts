import 'server-only';
import { MARKETING_CONSENT_TEXT } from '@/lib/giving/consent';
import { adminClient } from '@/lib/supabase/server';

const opt = (v: string | undefined) => (v ? v : null);
const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : -Infinity);

export interface ConsentEvent {
  /** The donation's Stripe metadata (`donationMetadata` in `lib/giving/stripe-server.ts`). */
  meta: Record<string, string>;
  /** The email Stripe confirmed, if any (falls back to the form's `donor_email`). */
  email: string | null | undefined;
  /** When the Stripe event happened (ISO). */
  at: string;
  /** Payment / invoice / checkout session id: the donation the consent came with. */
  ref: string;
  livemode: boolean;
}

/**
 * Adds a donor who ticked "Keep me updated" to Supabase `mailing_list`, or subscribes them again
 * (a fresh tick is a fresh opt-in). Called once per donation form (one-off payment, first weekly
 * or monthly payment, daily cause's card saved) and never for renewals, so a regular gift never
 * re-subscribes someone who was unsubscribed. An unticked box changes nothing: it isn't a request
 * to unsubscribe. An older event (a Stripe retry or late delivery) never overrides a later opt-in
 * or unsubscribe. Server only, with the secret key.
 */
export async function recordMarketingConsent({ meta, email, at, ref, livemode }: ConsentEvent) {
  if (meta.marketing_consent !== 'yes') return;
  const mail = (email || meta.donor_email || '').trim().toLowerCase();
  if (!mail.includes('@')) return;

  const db = adminClient();
  const { data: existing, error: readError } = await db
    .from('mailing_list')
    .select('consented_at,unsubscribed_at')
    .eq('email', mail)
    .maybeSingle<{ consented_at: string; unsubscribed_at: string | null }>();
  if (readError) throw new Error(`Could not read the mailing list: ${readError.message}`);
  const when = time(at);
  if (existing && (time(existing.consented_at) >= when || time(existing.unsubscribed_at) >= when))
    return;

  const { error } = await db.from('mailing_list').upsert(
    {
      email: mail,
      first_name: meta.donor_first_name ?? '',
      last_name: meta.donor_last_name ?? '',
      organisation: opt(meta.donor_organisation),
      city: opt(meta.donor_city),
      country: opt(meta.donor_country_code),
      subscribed: true,
      consented_at: at,
      consent_campaign_id: opt(meta.campaign_id),
      consent_ref: ref,
      consent_text: MARKETING_CONSENT_TEXT,
      unsubscribed_at: null,
      livemode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' },
  );
  if (error) throw new Error(`Could not add to the mailing list: ${error.message}`);
}
