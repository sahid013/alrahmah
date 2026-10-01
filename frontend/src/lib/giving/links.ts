/**
 * A campaign's donate link: the on-site donation page for that campaign. Stable per campaign,
 * used by the public cards and set automatically by the dashboard.
 */
export const checkoutHref = (campaignId: string) => `/donate/${campaignId}`;

/** Cause preselected on the general /donate page. */
export const DEFAULT_CAUSE = 'masjid-maintenance';
