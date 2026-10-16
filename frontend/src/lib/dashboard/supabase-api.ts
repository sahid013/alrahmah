import type { User } from '@supabase/supabase-js';
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

/**
 * The real `DashboardApi`, backed by Supabase:
 *  - auth: Supabase Auth (email + password; authenticator app when `TWO_FACTOR_REQUIRED`).
 *    Only users with a `profiles` row (staff) can use the dashboard.
 *  - users: `profiles` (admins); adding/removing accounts goes through the site's server
 *    routes (`/api/dashboard/users`), which hold the secret key.
 *  - prayer: the `prayer_days` table. Every change also refreshes the website's cached times.
 * Row Level Security in the database enforces all of this, whatever the browser does.
 *  - causes: `donation_causes` (which donation causes the website shows).
 * Campaigns, donations and khutbahs still use the browser preview until their tables exist.
 */

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
async function refreshWebsite(what: 'prayer-times' | 'donation-causes' = 'prayer-times') {
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

    causes: {
      async list() {
        const { data, error } = await supabase
          .from('donation_causes')
          .select('id,visible')
          .returns<{ id: string; visible: boolean }[]>();
        if (error) fail(error.message);
        return data ?? [];
      },

      async setVisible(id, visible) {
        const { error } = await supabase.from('donation_causes').upsert({ id, visible });
        if (error) fail(error.message);
        await refreshWebsite('donation-causes');
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
        await refreshWebsite();
        return fromRow(data);
      },

      async saveDays(days) {
        if (!days.length) return;
        const { error } = await supabase.from('prayer_days').upsert(days.map(toRow));
        if (error) fail(error.message);
        await refreshWebsite();
      },

      async deleteDay(date) {
        const { error } = await supabase.from('prayer_days').delete().eq('date', date);
        if (error) fail(error.message);
        await refreshWebsite();
      },
    },
  };
}
