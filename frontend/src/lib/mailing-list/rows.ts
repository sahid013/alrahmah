import { mailingContactSchema, type MailingContact } from './types';

/** Supabase `mailing_list` ↔ the dashboard's `MailingContact`. */
export const MAILING_COLUMNS =
  'email,first_name,last_name,organisation,city,country,subscribed,consented_at,consent_campaign_id,consent_ref,consent_text,unsubscribed_at,livemode';

export interface MailingRow {
  email: string;
  first_name: string;
  last_name: string;
  organisation: string | null;
  city: string | null;
  country: string | null;
  subscribed: boolean;
  consented_at: string;
  consent_campaign_id: string | null;
  consent_ref: string | null;
  consent_text: string;
  unsubscribed_at: string | null;
  livemode: boolean;
}

/** Null for a row the dashboard doesn't understand, so it's skipped. */
export function rowToContact(r: MailingRow): MailingContact | null {
  const parsed = mailingContactSchema.safeParse({
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    ...(r.organisation && { organisation: r.organisation }),
    ...(r.city && { city: r.city }),
    ...(r.country && { country: r.country }),
    subscribed: r.subscribed,
    consentedAt: r.consented_at,
    ...(r.consent_campaign_id && { consentCampaignId: r.consent_campaign_id }),
    ...(r.consent_ref && { consentRef: r.consent_ref }),
    consentText: r.consent_text,
    ...(r.unsubscribed_at && { unsubscribedAt: r.unsubscribed_at }),
    livemode: r.livemode,
  });
  return parsed.success ? parsed.data : null;
}
