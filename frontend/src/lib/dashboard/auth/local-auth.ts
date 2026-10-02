import QRCode from 'qrcode';
import type { DashboardApi } from '../api';
import { generateSecret, otpauthUri, verifyTotp } from './totp';
import {
  newUserSchema,
  passwordSchema,
  TWO_FACTOR_REQUIRED,
  type DashboardUser,
  type Session,
} from './types';

/**
 * PREVIEW ONLY — not security. Accounts live in this browser's localStorage so the sign-in,
 * two-step and user screens can be used before Supabase is connected. Anyone with browser
 * access can bypass it; real protection comes from Supabase Auth + a server-side check.
 */
const KEY = 'alrahmah.dashboard.auth.v1';
const SESSION_HOURS = 12;
/** Preview sign-in (documented in CODING_GUIDELINES.md, not shown in the UI). */
const PREVIEW_EMAIL = 'admin@example.com';
const PREVIEW_PASSWORD = 'preview-admin';

interface StoredUser extends DashboardUser {
  salt: string;
  passwordHash: string;
  totpSecret?: string;
  pendingSecret?: string;
}
interface AuthStore {
  users: StoredUser[];
  session?: { userId: string; aal: 'aal1' | 'aal2'; expiresAt: number };
}

async function hash(password: string, salt: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${password}`),
  );
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const newSalt = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const publicUser = (u: StoredUser): DashboardUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  mfaEnrolled: u.mfaEnrolled,
  createdAt: u.createdAt,
  lastSignInAt: u.lastSignInAt,
});

async function seed(): Promise<AuthStore> {
  const salt = newSalt();
  return {
    users: [
      {
        id: crypto.randomUUID(),
        name: 'Masjid Admin',
        email: PREVIEW_EMAIL,
        role: 'admin',
        mfaEnrolled: false,
        createdAt: now(),
        salt,
        passwordHash: await hash(PREVIEW_PASSWORD, salt),
      },
    ],
  };
}

async function read(): Promise<AuthStore> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AuthStore;
  } catch {
    /* fall through to a fresh store */
  }
  const store = await seed();
  write(store);
  return store;
}

function write(store: AuthStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable: preview only */
  }
}

const settle = <T>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), 150));
const fail = (message: string) =>
  new Promise<never>((_, r) => setTimeout(() => r(new Error(message)), 300));

export function createLocalAuth(): Pick<DashboardApi, 'auth' | 'users'> {
  async function current(store: AuthStore) {
    const s = store.session;
    if (!s || s.expiresAt < Date.now()) return undefined;
    return store.users.find((u) => u.id === s.userId);
  }
  async function requireAdmin(store: AuthStore) {
    const me = await current(store);
    if (!me || store.session?.aal !== 'aal2' || me.role !== 'admin')
      throw new Error('Only admins can manage users.');
    return me;
  }

  return {
    auth: {
      async getSession() {
        const store = await read();
        const user = await current(store);
        return settle<Session | null>(
          user ? { user: publicUser(user), aal: store.session!.aal } : null,
        );
      },

      async signIn(email, password) {
        const store = await read();
        const user = store.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user || (await hash(password, user.salt)) !== user.passwordHash)
          return fail('Email or password is incorrect.');
        // With two-step off, the password alone completes sign-in (full `aal2` session).
        const done = !TWO_FACTOR_REQUIRED;
        store.session = {
          userId: user.id,
          aal: done ? 'aal2' : 'aal1',
          expiresAt: Date.now() + SESSION_HOURS * 3.6e6,
        };
        if (done) user.lastSignInAt = now();
        write(store);
        if (done) return settle('signed-in' as const);
        return settle(user.mfaEnrolled ? 'mfa-verify' : 'mfa-enroll');
      },

      async enrollTotp() {
        const store = await read();
        const user = await current(store);
        if (!user) throw new Error('Your session has expired. Please sign in again.');
        user.pendingSecret = generateSecret();
        write(store);
        const qrCode = await QRCode.toDataURL(otpauthUri(user.pendingSecret, user.email), {
          margin: 1,
          width: 220,
          color: { dark: '#161436', light: '#ffffff' },
        });
        return settle({ factorId: user.id, qrCode, secret: user.pendingSecret });
      },

      async verifyTotp(code, factorId) {
        const store = await read();
        const user = await current(store);
        if (!user) return fail('Your session has expired. Please sign in again.');
        const secret = factorId ? user.pendingSecret : user.totpSecret;
        if (!secret || !(await verifyTotp(secret, code)))
          return fail("That code didn't work. Check the 6-digit code in your app and try again.");
        if (factorId) {
          user.totpSecret = secret;
          user.pendingSecret = undefined;
          user.mfaEnrolled = true;
        }
        user.lastSignInAt = now();
        store.session = { ...store.session!, aal: 'aal2' };
        write(store);
        return settle({ user: publicUser(user), aal: 'aal2' as const });
      },

      async changePassword(currentPassword, next) {
        const store = await read();
        const user = await current(store);
        if (!user) return fail('Your session has expired. Please sign in again.');
        if ((await hash(currentPassword, user.salt)) !== user.passwordHash)
          return fail('Your current password is incorrect.');
        passwordSchema.parse(next);
        user.salt = newSalt();
        user.passwordHash = await hash(next, user.salt);
        write(store);
        return settle(undefined);
      },

      async signOut() {
        const store = await read();
        delete store.session;
        write(store);
        return settle(undefined);
      },
    },

    users: {
      async list() {
        const store = await read();
        await requireAdmin(store);
        return settle(store.users.map(publicUser).sort((a, b) => a.name.localeCompare(b.name)));
      },

      async create(input) {
        const store = await read();
        await requireAdmin(store);
        const valid = newUserSchema.parse(input);
        if (store.users.some((u) => u.email.toLowerCase() === valid.email.toLowerCase()))
          return fail('A user with this email already exists.');
        const salt = newSalt();
        const user: StoredUser = {
          id: crypto.randomUUID(),
          name: valid.name,
          email: valid.email,
          role: valid.role,
          mfaEnrolled: false,
          createdAt: now(),
          salt,
          passwordHash: await hash(valid.password, salt),
        };
        store.users.push(user);
        write(store);
        return settle(publicUser(user));
      },

      async setRole(id, role) {
        const store = await read();
        const me = await requireAdmin(store);
        const admins = store.users.filter((u) => u.role === 'admin');
        if (role !== 'admin' && admins.length === 1 && admins[0]!.id === id)
          return fail('There must be at least one admin.');
        if (id === me.id && role !== 'admin')
          return fail("You can't remove your own admin access.");
        store.users = store.users.map((u) => (u.id === id ? { ...u, role } : u));
        write(store);
        return settle(undefined);
      },

      async resetTwoFactor(id) {
        const store = await read();
        await requireAdmin(store);
        store.users = store.users.map((u) =>
          u.id === id
            ? { ...u, mfaEnrolled: false, totpSecret: undefined, pendingSecret: undefined }
            : u,
        );
        write(store);
        return settle(undefined);
      },

      async remove(id) {
        const store = await read();
        const me = await requireAdmin(store);
        if (id === me.id) return fail("You can't remove your own account.");
        store.users = store.users.filter((u) => u.id !== id);
        write(store);
        return settle(undefined);
      },
    },
  };
}
