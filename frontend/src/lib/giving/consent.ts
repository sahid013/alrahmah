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

/**
 * The Gift Aid declaration, in HMRC's model wording for past, present and future donations (an
 * "enduring" declaration). The exact text the donor agreed to is stored with each donation
 * (`donations.gift_aid_declaration`, with `gift_aid_declared_at`) as the charity's record of the
 * declaration, so change it here only.
 */
export const GIFT_AID = {
  title: 'Boost your donation with Gift Aid',
  intro:
    'If you are a UK taxpayer, Gift Aid lets us claim an extra 25p for every £1 you give, at no extra cost to you. We need your home address to identify you as a UK taxpayer.',
  /** Shown in bold on the checkbox, with `declarationRest` after it. */
  declarationLead: 'I want to Gift Aid my donation',
  declarationRest: `and any donations I make in the future or have made in the past 4 years to ${siteConfig.legalName}.`,
  taxpayer:
    'I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.',
  changes:
    'Please tell us if you want to cancel this declaration, change your name or home address, or no longer pay sufficient tax on your income and/or capital gains.',
};

export const GIFT_AID_TEXT = `${GIFT_AID.declarationLead} ${GIFT_AID.declarationRest} ${GIFT_AID.taxpayer}`;
