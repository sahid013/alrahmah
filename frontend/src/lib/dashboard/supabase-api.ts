import type { User } from '@supabase/supabase-js';
import {
  CAMPAIGN_COLUMNS,
  programToRow,
  rowToProgram,
  type CampaignRow,
} from '@/lib/donations/rows';
import { EVENT_COLUMNS, eventToRow, rowToEvent, type EventRow } from '@/lib/events/rows';
import { MESSAGE_COLUMNS, rowToMessage, type MessageRow } from '@/lib/contact/rows';
import { khutbahEntrySchema, type KhutbahEntry } from '@/lib/khutbahs/types';
import { MAILING_COLUMNS, rowToContact, type MailingRow } from '@/lib/mailing-list/rows';
import { fromRow, PRAYER_DAY_COLUMNS, toRow, type PrayerDayRow } from '@/lib/prayer/rows';
import { accessToken, getSupabase } from '@/lib/supabase/client';
import type { DashboardApi } from './api';
import {
  newUserSchema,
  passwordSchema,
  TWO_FACTOR_REQUIRED,
  userUpdateSchema,
  type DashboardUser,
  type Role,
  type Session,
} from './auth/types';
import { createLocalDashboardApi } from './local-api';
import { filterDonations } from './queries';
import {
  campaignSchema,
  dashboardEventSchema,
  donationSchema,
  type Campaign,
  type DashboardEvent,
  type Donation,
} from './types';

/**
 * The real `DashboardApi`, backed by Supabase:
 *  - auth: Supabase Auth (email + password; authenticator app when `TWO_FACTOR_REQUIRED`).
 *    Only users with a `profiles` row (staff) can use the dashboard.
 *  - users: `profiles` (admins); adding/removing accounts goes through the site's server
 *    routes (`/api/dashboard/users`), which hold the secret key.
 *  - prayer: the `prayer_days` table. Every change also refreshes the website's cached times.
 * Row Level Security in the database enforces all of this, whatever the browser does.
 *  - campaigns: the `campaigns` table (donation causes; status active = shown on the website).
 *  - khutbahs: the `khutbahs` table (home page "Latest Khutbahs").
 *  - events: the `events` table; posters in Storage (`event-posters`).
 *  - donations: the `donations` table, written by the Stripe webhook (staff read only).
 *  - mailingList: the `mailing_list` table, written by the Stripe webhook (staff read,
 *    (un)subscribe, delete).
 */

interface KhutbahRow {
  video_id: string;
  title: string;
  speaker: string | null;
  date: string;
  updated_at: string;
}

const rowToKhutbah = (r: KhutbahRow): KhutbahEntry =>
  khutbahEntrySchema.parse({
    videoId: r.video_id,
    title: r.title,
    ...(r.speaker && { speaker: r.speaker }),
    date: r.date,
    updatedAt: r.updated_at,
  });

interface DonationRow {
  id: string;
  payment_ref: string;
  created_at: string;
  amount: number | string;
  currency: string;
  type: 'one-off' | 'recurring';
  frequency: 'weekly' | 'monthly' | 'daily' | null;
  campaign_id: string;
  status: 'succeeded' | 'refunded';
  donor: Record<string, unknown>;
  marketing_consent: boolean;
  gift_aid: boolean | null;
  gift_aid_declared_at: string | null;
  subscription_id: string | null;
  subscription_status: 'active' | 'past_due' | 'cancelled' | null;
  source: Record<string, unknown> | null;
}

const DONATION_COLUMNS =
  'id,payment_ref,created_at,amount,currency,type,frequency,campaign_id,status,donor,marketing_consent,gift_aid,gift_aid_declared_at,subscription_id,subscription_status,source';

const nextDay = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
};

/** A recorded donation as the dashboard uses it (rows that don't fit are skipped, not fatal). */
function rowToDonation(r: DonationRow): Donation[] {
  const parsed = donationSchema.safeParse({
    id: r.id,
    createdAt: r.created_at,
    amount: Number(r.amount),
    currency: 'GBP',
    type: r.type,
    ...(r.frequency && { frequency: r.frequency }),
    campaignId: r.campaign_id,
    status: r.status,
    donor: r.donor,
    marketingConsent: r.marketing_consent,
    giftAid: r.gift_aid ?? false,
    ...(r.gift_aid_declared_at && { giftAidDeclaredAt: r.gift_aid_declared_at }),
    ...(r.subscription_id && {
      subscription: { id: r.subscription_id, status: r.subscription_status ?? 'active' },
    }),
    ...(r.source && { source: r.source }),
    paymentRef: r.payment_ref,
  });
  if (!parsed.success) console.warn('[dashboard] skipped donation', r.payment_ref);
  return parsed.success ? [parsed.data] : [];
}

/** Dashboard event from a row (rows that don't fit are skipped, not fatal). */
function rowToDashboardEvent(row: EventRow): DashboardEvent[] {
  try {
    return [
      {
        ...rowToEvent(row),
        status: row.status,
        order: row.sort_order,
        ...(row.updated_at && { updatedAt: row.updated_at }),
      },
    ];
  } catch {
    console.warn('[dashboard] skipped event', row.id);
    return [];
  }
}

/** Dashboard campaign from a row: the website's programme plus status and position. */
const rowToCampaign = (row: CampaignRow): Campaign => ({
  ...rowToProgram(row),
  status: row.status,
  order: row.sort_order,
  ...(row.updated_at && { updatedAt: row.updated_at }),
});

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

const fail = (message: string): never => {
  throw new Error(message);
};

const hasVerifiedTotp = (user: User) =>
  (user.factors ?? []).some((f) => f.factor_type === 'totp' && f.status === 'verified');

function toUser(profile: ProfileRow, authUser?: User): DashboardUser {
  return {
    id: profile.id,
    name: profile.name || profile.email,
    email: profile.email,
    role: profile.role,
    mfaEnrolled: authUser ? hasVerifiedTotp(authUser) : false,
    createdAt: profile.created_at,
    ...(authUser?.last_sign_in_at && { lastSignInAt: authUser.last_sign_in_at }),
  };
}

/** Calls one of the site's protected API routes as the signed-in user. */
async function callSite<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await accessToken()}`,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) fail(data.error ?? 'Something went wrong. Please try again.');
  return data;
}

/** Shows a change on the website straight away (otherwise within an hour). */
async function refreshWebsite(what: 'prayer-times' | 'campaigns' | 'khutbahs' | 'events') {
  await callSite(`/api/revalidate/${what}`, { method: 'POST' }).catch((e: unknown) =>
    console.warn('[dashboard] saved, but the website will update within the hour', e),
  );
}

export function createSupabaseDashboardApi(): DashboardApi {
  const supabase = getSupabase();
  const preview = createLocalDashboardApi();

  async function profileOf(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id,email,name,role,created_at')
      .eq('id', userId)
      .maybeSingle<ProfileRow>();
    return data;
  }

  async function aal(): Promise<Session['aal']> {
    // Two-step off: the password alone is a full session (as the rest of the dashboard expects).
    if (!TWO_FACTOR_REQUIRED) return 'aal2';
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.currentLevel === 'aal2' ? 'aal2' : 'aal1';
  }

  async function currentSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const profile = await profileOf(data.user.id);
    if (!profile) return null;
    return { user: toUser(profile, data.user), aal: await aal() };
  }

  return {
    ...preview,

    auth: {
      getSession: currentSession,

      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error || !data.user) return fail('Email or password is incorrect.');
        if (!(await profileOf(data.user.id))) {
          await supabase.auth.signOut();
          return fail('This account doesn’t have dashboard access. Ask an admin to add you.');
        }
        if (!TWO_FACTOR_REQUIRED || (await aal()) === 'aal2') return 'signed-in';
        return hasVerifiedTotp(data.user) ? 'mfa-verify' : 'mfa-enroll';
      },

      async enrollTotp() {
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
        if (error || !data) return fail(error?.message ?? 'Could not start two-step set-up.');
        return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
      },

      async verifyTotp(code, factorId) {
        let id = factorId;
        if (!id) {
          const { data } = await supabase.auth.mfa.listFactors();
          id = data?.totp.find((f) => f.status === 'verified')?.id;
        }
        if (!id) return fail('Set up your authenticator app first.');
        const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
        if (error)
          return fail("That code didn't work. Check the 6-digit code in your app and try again.");
        return (await currentSession()) ?? fail('Your session has ended. Please sign in again.');
      },

      async changePassword(current, next) {
        const { data } = await supabase.auth.getUser();
        const email = data.user?.email;
        if (!email) return fail('Your session has ended. Please sign in again.');
        // Confirm the current password before changing it.
        const check = await supabase.auth.signInWithPassword({ email, password: current });
        if (check.error) return fail('Your current password is incorrect.');
        passwordSchema.parse(next);
        const { error } = await supabase.auth.updateUser({ password: next });
        if (error) fail(error.message);
      },

      async signOut() {
        await supabase.auth.signOut();
      },
    },

    users: {
      async list() {
        // Through the server, which can read sign-in details; falls back to profiles alone.
        try {
          const { users } = await callSite<{ users: DashboardUser[] }>('/api/dashboard/users');
          return users;
        } catch {
          const { data, error } = await supabase
            .from('profiles')
            .select('id,email,name,role,created_at')
            .order('name')
            .returns<ProfileRow[]>();
          if (error) fail(error.message);
          return (data ?? []).map((p) => toUser(p));
        }
      },

      async create(input) {
        const valid = newUserSchema.parse(input);
        const { user } = await callSite<{ user: DashboardUser }>('/api/dashboard/users', {
          method: 'POST',
          body: JSON.stringify(valid),
        });
        return user;
      },

      async update(id, changes) {
        const valid = userUpdateSchema.parse(changes);
        const { user } = await callSite<{ user: DashboardUser }>(`/api/dashboard/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(valid),
        });
        return user;
      },

      async setRole(id, role) {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
        if (error) fail(error.message);
      },

      async resetTwoFactor(id) {
        await callSite(`/api/dashboard/users/${id}/two-factor`, { method: 'DELETE' });
      },

      async remove(id) {
        await callSite(`/api/dashboard/users/${id}`, { method: 'DELETE' });
      },
    },

    campaigns: {
      async list() {
        const { data, error } = await supabase
          .from('campaigns')
          .select(CAMPAIGN_COLUMNS)
          .order('sort_order')
          .order('title')
          .returns<CampaignRow[]>();
        if (error) fail(error.message);
        return (data ?? []).map(rowToCampaign);
      },

      async get(id) {
        const { data, error } = await supabase
          .from('campaigns')
          .select(CAMPAIGN_COLUMNS)
          .eq('id', id)
          .maybeSingle<CampaignRow>();
        if (error) fail(error.message);
        return data ? rowToCampaign(data) : undefined;
      },

      async save(campaign) {
        const valid = campaignSchema.parse(campaign);
        const { data, error } = await supabase
          .from('campaigns')
          .upsert(programToRow(valid, valid.status, valid.order))
          .select(CAMPAIGN_COLUMNS)
          .single<CampaignRow>();
        if (error || !data) return fail(error?.message ?? 'Could not save.');
        await refreshWebsite('campaigns');
        return rowToCampaign(data);
      },

      async remove(id) {
        const { error } = await supabase.from('campaigns').delete().eq('id', id);
        if (error) fail(error.message);
        await refreshWebsite('campaigns');
      },

      async reorder(ids) {
        const results = await Promise.all(
          ids.map((id, i) => supabase.from('campaigns').update({ sort_order: i }).eq('id', id)),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) fail(failed.error.message);
        await refreshWebsite('campaigns');
      },
    },

    donations: {
      async list(query = {}) {
        // Narrow by date in the database; the other filters run on the result (`filterDonations`).
        let request = supabase
          .from('donations')
          .select(DONATION_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(10000);
        if (query.from) request = request.gte('created_at', `${query.from}T00:00:00Z`);
        // Inclusive end date (UK days can run an hour past UTC midnight in summer).
        if (query.to) request = request.lt('created_at', nextDay(query.to));
        const { data, error } = await request.returns<DonationRow[]>();
        if (error) fail(error.message);
        return filterDonations((data ?? []).flatMap(rowToDonation), query);
      },
    },

    events: {
      async list() {
        const { data, error } = await supabase
          .from('events')
          .select(EVENT_COLUMNS)
          .order('sort_order')
          .order('title')
          .returns<EventRow[]>();
        if (error) fail(error.message);
        return (data ?? []).flatMap(rowToDashboardEvent);
      },

      async get(id) {
        const { data, error } = await supabase
          .from('events')
          .select(EVENT_COLUMNS)
          .eq('id', id)
          .maybeSingle<EventRow>();
        if (error) fail(error.message);
        return data ? rowToDashboardEvent(data)[0] : undefined;
      },

      async save(event) {
        const valid = dashboardEventSchema.parse(event);
        const { data, error } = await supabase
          .from('events')
          .upsert(eventToRow(valid, valid.status, valid.order))
          .select(EVENT_COLUMNS)
          .single<EventRow>();
        if (error || !data) return fail(error?.message ?? 'Could not save.');
        await refreshWebsite('events');
        return rowToDashboardEvent(data)[0] ?? fail('The saved event could not be read back.');
      },

      async remove(id) {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) fail(error.message);
        await refreshWebsite('events');
      },

      async reorder(ids) {
        const results = await Promise.all(
          ids.map((id, i) => supabase.from('events').update({ sort_order: i }).eq('id', id)),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) fail(failed.error.message);
        await refreshWebsite('events');
      },

      async uploadPoster(file, name) {
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp';
        const safe =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'poster';
        // A new name every time, so browsers and the CDN never show an old poster.
        const path = `${safe}-${Date.now().toString(36)}.${ext}`;
        const bucket = supabase.storage.from('event-posters');
        const { error } = await bucket.upload(path, file, {
          contentType: file.type,
          cacheControl: '31536000',
        });
        if (error) fail(error.message);
        return { src: bucket.getPublicUrl(path).data.publicUrl };
      },
    },

    khutbahs: {
      async list() {
        const { data, error } = await supabase
          .from('khutbahs')
          .select('video_id,title,speaker,date,updated_at')
          .order('date', { ascending: false })
          .order('updated_at', { ascending: false })
          .returns<KhutbahRow[]>();
        if (error) fail(error.message);
        return (data ?? []).map(rowToKhutbah);
      },

      async save(entry, previousVideoId) {
        const valid = khutbahEntrySchema.parse(entry);
        const row = {
          video_id: valid.videoId,
          title: valid.title,
          speaker: valid.speaker?.trim() || null,
          date: valid.date,
        };
        const columns = 'video_id,title,speaker,date,updated_at';
        let result;
        if (previousVideoId && previousVideoId !== valid.videoId) {
          // New link for an existing post: move it, unless that video is already posted.
          const { data: clash } = await supabase
            .from('khutbahs')
            .select('video_id')
            .eq('video_id', valid.videoId)
            .maybeSingle();
          if (clash) return fail('That video is already posted. Edit or remove that one instead.');
          result = await supabase
            .from('khutbahs')
            .update(row)
            .eq('video_id', previousVideoId)
            .select(columns)
            .single<KhutbahRow>();
        } else {
          result = await supabase.from('khutbahs').upsert(row).select(columns).single<KhutbahRow>();
        }
        const { data, error } = result;
        if (error || !data) return fail(error?.message ?? 'Could not save.');
        await refreshWebsite('khutbahs');
        return rowToKhutbah(data);
      },

      async remove(videoId) {
        const { error } = await supabase.from('khutbahs').delete().eq('video_id', videoId);
        if (error) fail(error.message);
        await refreshWebsite('khutbahs');
      },
    },

    messages: {
      async list() {
        const { data, error } = await supabase
          .from('contact_messages')
          .select(MESSAGE_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(1000)
          .returns<MessageRow[]>();
        if (error) fail(error.message);
        return (data ?? []).flatMap((row) => rowToMessage(row) ?? []);
      },

      async setStatus(id, status) {
        const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
        if (error) fail(error.message);
      },

      async remove(id) {
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (error) fail(error.message);
      },
    },

    mailingList: {
      async list() {
        const { data, error } = await supabase
          .from('mailing_list')
          .select(MAILING_COLUMNS)
          .order('consented_at', { ascending: false })
          .limit(10000)
          .returns<MailingRow[]>();
        if (error) fail(error.message);
        return (data ?? []).flatMap((row) => rowToContact(row) ?? []);
      },

      async setSubscribed(email, subscribed) {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('mailing_list')
          .update({ subscribed, unsubscribed_at: subscribed ? null : now, updated_at: now })
          .eq('email', email);
        if (error) fail(error.message);
      },

      async remove(email) {
        const { error } = await supabase.from('mailing_list').delete().eq('email', email);
        if (error) fail(error.message);
      },
    },

    prayer: {
      async listDays(from, to) {
        const { data, error } = await supabase
          .from('prayer_days')
          .select(PRAYER_DAY_COLUMNS)
          .gte('date', from)
          .lte('date', to)
          .order('date')
          .returns<PrayerDayRow[]>();
        if (error) fail(error.message);
        return (data ?? []).map(fromRow);
      },

      async saveDay(day) {
        const { data, error } = await supabase
          .from('prayer_days')
          .upsert(toRow(day))
          .select(PRAYER_DAY_COLUMNS)
          .single<PrayerDayRow>();
        if (error || !data) return fail(error?.message ?? 'Could not save.');
        await refreshWebsite('prayer-times');
        return fromRow(data);
      },

      async saveDays(days) {
        if (!days.length) return;
        const { error } = await supabase.from('prayer_days').upsert(days.map(toRow));
        if (error) fail(error.message);
        await refreshWebsite('prayer-times');
      },

      async deleteDay(date) {
        const { error } = await supabase.from('prayer_days').delete().eq('date', date);
        if (error) fail(error.message);
        await refreshWebsite('prayer-times');
      },
    },
  };
}
