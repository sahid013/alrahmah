/**
 * Longest value kept for each part of a visit's source. Shared by the server's zod schema
 * (`sourceSchema`) and the browser's `attribution.ts`, which checks by hand so zod isn't sent to
 * every page.
 */
export const SOURCE_LIMITS = {
  utmSource: 100,
  utmMedium: 100,
  utmCampaign: 100,
  utmContent: 100,
  fbclid: 400,
  gclid: 200,
  gbraid: 200,
  wbraid: 200,
  referrer: 300,
  landingPage: 300,
} as const;
