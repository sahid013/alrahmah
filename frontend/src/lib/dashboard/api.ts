import type {
  DashboardUser,
  NewUser,
  Role,
  Session,
  SignInNext,
  TotpEnrollment,
} from './auth/types';
import type { Campaign, Donation, DonationQuery, PrayerDay } from './types';

/**
 * The ONE interface every dashboard screen talks to. Today it's implemented by
 * `createLocalDashboardApi()` (browser storage + sample data). When the backend is built,
 * add a Supabase / HTTP implementation of this same interface and swap it in
 * `dashboard-api-provider.tsx` — no screen needs to change.
 */
export interface DashboardApi {
  /**
   * Sign-in with password + authenticator app. Supabase: signInWithPassword, then
   * mfa.getAuthenticatorAssuranceLevel → mfa.enroll({ factorType: 'totp' }) for new users or
   * mfa.challengeAndVerify for returning ones. Pages are protected server-side (proxy.ts, aal2).
   */
  auth: {
    getSession(): Promise<Session | null>;
    /** Throws "Email or password is incorrect." on failure. */
    signIn(email: string, password: string): Promise<SignInNext>;
    /** Start authenticator setup for the signed-in (aal1) user. */
    enrollTotp(): Promise<TotpEnrollment>;
    /** Check a 6-digit code (finishes enrolment when `factorId` is given). */
    verifyTotp(code: string, factorId?: string): Promise<Session>;
    changePassword(current: string, next: string): Promise<void>;
    signOut(): Promise<void>;
  };
  /** Team accounts (admins only). Backend: service-role routes (auth.admin.*) + `profiles`. */
  users: {
    list(): Promise<DashboardUser[]>;
    create(user: NewUser): Promise<DashboardUser>;
    setRole(id: string, role: Role): Promise<void>;
    /** Removes their authenticator so they set it up again at next sign-in. */
    resetTwoFactor(id: string): Promise<void>;
    remove(id: string): Promise<void>;
  };
  prayer: {
    /** Stored overrides between two dates (inclusive). */
    listDays(from: string, to: string): Promise<PrayerDay[]>;
    saveDay(day: PrayerDay): Promise<PrayerDay>;
    /** Save the same timetable for many dates at once (bulk scheduling). */
    saveDays(days: PrayerDay[]): Promise<void>;
    /** Remove an override so the day reverts to calculated times. */
    deleteDay(date: string): Promise<void>;
  };
  campaigns: {
    list(): Promise<Campaign[]>;
    get(id: string): Promise<Campaign | undefined>;
    save(campaign: Campaign): Promise<Campaign>;
    remove(id: string): Promise<void>;
    /** Set the public display order: `ids` first to last (one call, one transaction). */
    reorder(ids: string[]): Promise<void>;
  };
  donations: {
    list(query?: DonationQuery): Promise<Donation[]>;
  };
  media: {
    /**
     * Store an image and return the URL to save on the record. Backend: upload to Supabase
     * Storage (bucket `posters`) and return its public URL (add the host to `images.remotePatterns`).
     */
    uploadImage(file: File): Promise<string>;
  };
}
