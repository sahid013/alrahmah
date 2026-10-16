import type {
  DashboardUser,
  NewUser,
  Role,
  UserUpdate,
  Session,
  SignInNext,
  TotpEnrollment,
} from './auth/types';
import type { KhutbahEntry } from '@/lib/khutbahs/types';
import type { Campaign, DashboardEvent, Donation, DonationQuery, PrayerDay } from './types';

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
    /** Change someone's name or email, or set them a new password (admins). */
    update(id: string, changes: UserUpdate): Promise<DashboardUser>;
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
  /**
   * Events & courses (Supabase `events`; published = on the website). Posters go to Storage
   * (`event-posters`, public read, staff write).
   */
  events: {
    /** All events, published and draft, in display order. */
    list(): Promise<DashboardEvent[]>;
    get(id: string): Promise<DashboardEvent | undefined>;
    /** Adds, or updates the event with the same id. */
    save(event: DashboardEvent): Promise<DashboardEvent>;
    remove(id: string): Promise<void>;
    /** Set the display order: `ids` first to last. */
    reorder(ids: string[]): Promise<void>;
    /** Uploads a poster (already resized in the browser); returns its public URL. */
    uploadPoster(file: Blob, name: string): Promise<{ src: string }>;
  };
  /**
   * Khutbahs posted by link for the home page (newest by date = "This week"). Supabase: a
   * `khutbahs` table keyed by `video_id`, public read, write for signed-in staff only.
   */
  khutbahs: {
    /** Newest first. */
    list(): Promise<KhutbahEntry[]>;
    /**
     * Adds, or updates the entry with the same video. `previousVideoId` (when editing) moves that
     * entry to a new video link; refused if the new video is already posted.
     */
    save(entry: KhutbahEntry, previousVideoId?: string): Promise<KhutbahEntry>;
    remove(videoId: string): Promise<void>;
  };
}
