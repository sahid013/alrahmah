import { MARKETING_CONSENT_TEXT } from '@/lib/giving/consent';
import type { MailingContact } from '@/lib/mailing-list/types';
import type { Donation } from './types';

/** Mailing list tabs. */
export const MAILING_VIEWS = {
  subscribed: 'Subscribed',
  unsubscribed: 'Unsubscribed',
  all: 'All',
} as const;
export type MailingView = keyof typeof MAILING_VIEWS;

/** Contacts in a tab whose name, email, organisation or town matches `search`, as given. */
export function filterContacts(list: MailingContact[], view: MailingView, search = '') {
  const q = search.trim().toLowerCase();
  return list.filter(
    (c) =>
      (view === 'all' || c.subscribed === (view === 'subscribed')) &&
      (!q ||
        [c.firstName, c.lastName, c.email, c.organisation, c.city]
          .join(' ')
          .toLowerCase()
          .includes(q)),
  );
}

/**
 * The mailing list the webhook would have built from these donations: each donor's latest
 * donation with consent, newest first. Used for the dashboard preview (sample data).
 */
export function contactsFromDonations(list: Donation[]): MailingContact[] {
  const latest = new Map<string, Donation>();
  for (const d of list) {
    const email = d.donor.email.toLowerCase();
    const seen = latest.get(email);
    if (d.marketingConsent && (!seen || d.createdAt > seen.createdAt)) latest.set(email, d);
  }
  return [...latest.entries()]
    .map(([email, d]) => ({
      email,
      firstName: d.donor.firstName,
      lastName: d.donor.lastName,
      ...(d.donor.organisation && { organisation: d.donor.organisation }),
      city: d.donor.city,
      country: d.donor.country,
      subscribed: true,
      consentedAt: d.createdAt,
      consentCampaignId: d.campaignId,
      ...(d.paymentRef && { consentRef: d.paymentRef }),
      consentText: MARKETING_CONSENT_TEXT,
      livemode: true,
    }))
    .sort((a, b) => b.consentedAt.localeCompare(a.consentedAt));
}
