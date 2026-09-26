/**
 * Public environment variables. Only `NEXT_PUBLIC_*` values are exposed to the browser —
 * never put secrets here.
 */
export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
} as const;
