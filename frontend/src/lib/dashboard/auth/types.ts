import { z } from 'zod';

/**
 * Dashboard team accounts. Maps to Supabase Auth users plus a `profiles` row (name, role).
 * Two-step verification (authenticator app, TOTP) is built in; see `TWO_FACTOR_REQUIRED`.
 */
export const ROLES = ['admin', 'editor'] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin — everything, including users',
  editor: 'Editor — prayer times, campaigns, donations',
};

export const dashboardUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Enter a name'),
  email: z.email('Enter a valid email address'),
  role: z.enum(ROLES),
  /** True once the user has set up their authenticator app. */
  mfaEnrolled: z.boolean(),
  createdAt: z.string(),
  lastSignInAt: z.string().optional(),
});
export type DashboardUser = z.infer<typeof dashboardUserSchema>;

/** `aal2` = signed in with password AND authenticator code (Supabase assurance levels). */
export interface Session {
  user: DashboardUser;
  aal: 'aal1' | 'aal2';
}

/**
 * Dashboard sign-in switch. OFF for now (client request): every dashboard page is open without
 * signing in, the sign-in page redirects to the dashboard, and Settings (users/account) is
 * hidden. Set to `true` to require sign-in again; the login code is untouched.
 */
export const AUTH_ENABLED = false;

/**
 * Two-step verification switch. Off for now (client request); set to `true` to require an
 * authenticator code for every sign-in again. Nothing else needs to change.
 */
export const TWO_FACTOR_REQUIRED = false;

/** What the sign-in screen does after a correct password. */
export type SignInNext = 'signed-in' | 'mfa-verify' | 'mfa-enroll';

export interface TotpEnrollment {
  factorId: string;
  /** Image (data URI) of the QR code to scan. */
  qrCode: string;
  /** Same secret as text, for typing in manually. */
  secret: string;
}

export const MIN_PASSWORD = 10;
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters`);

export const newUserSchema = z.object({
  name: dashboardUserSchema.shape.name,
  email: dashboardUserSchema.shape.email,
  role: z.enum(ROLES),
  password: passwordSchema,
});
export type NewUser = z.infer<typeof newUserSchema>;

/** Readable random password for new accounts (no look-alike characters). */
export function generatePassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
