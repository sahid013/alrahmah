/**
 * A campaign's donate link: the on-site donation page for that campaign. Stable per campaign,
 * used by the public cards and set automatically by the dashboard.
 */
export const checkoutHref = (campaignId: string) => `/give/${campaignId}`;
