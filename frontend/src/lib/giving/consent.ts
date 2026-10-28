import { siteConfig } from '@/config/site';

/**
 * The donation form's optional "Keep me updated" checkbox. The same wording is stored with each
 * opt-in on the mailing list (`mailing_list.consent_text`) as the record of what the donor agreed
 * to, so change it here only, and the form and the record stay in step.
 */
export const MARKETING_CONSENT = {
  title: 'Keep me updated.',
  body: `I'd like to hear from ${siteConfig.name} by email about news, events and appeals. I can unsubscribe at any time.`,
};

export const MARKETING_CONSENT_TEXT = `${MARKETING_CONSENT.title} ${MARKETING_CONSENT.body}`;
