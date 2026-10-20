import { describe, expect, it, vi } from 'vitest';
import { siteConfig } from '@/config/site';
import { rowToMessage } from './rows';
import { contactRequestSchema, looksLikeBot, type ContactRequest } from './types';

vi.mock('server-only', () => ({}));
const { buildContactEmail } = await import('./email');

const base: ContactRequest = {
  form: 'general',
  name: 'Aisha Khan',
  email: 'aisha@example.com',
  message: 'Assalamu alaykum, is the masjid open on Saturday mornings?',
};

describe('contact request', () => {
  it('accepts a normal message and trims it', () => {
    const r = contactRequestSchema.parse({ ...base, name: '  Aisha Khan ', message: ' Hi ' });
    expect(r.name).toBe('Aisha Khan');
    expect(r.message).toBe('Hi');
  });

  it('refuses a name with a line break (it goes in the email subject) and unknown forms', () => {
    expect(contactRequestSchema.safeParse({ ...base, name: 'A\nBcc: x@y.com' }).success).toBe(
      false,
    );
    expect(contactRequestSchema.safeParse({ ...base, form: 'other' }).success).toBe(false);
    expect(contactRequestSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
  });

  it('spots bots: a filled hidden field, or sent within two seconds', () => {
    expect(looksLikeBot({ website: 'http://spam.example' })).toBe(true);
    expect(looksLikeBot({ elapsedMs: 400 })).toBe(true);
    expect(looksLikeBot({ elapsedMs: 15_000, website: '' })).toBe(false);
    expect(looksLikeBot({})).toBe(false);
  });
});

describe('notification email', () => {
  it('goes to the form’s own inbox, with Reply going to the sender', () => {
    const general = buildContactEmail(base, {});
    expect(general?.to).toEqual([siteConfig.contact.email]);
    expect(general?.reply_to).toBe('aisha@example.com');
    expect(general?.subject).toBe('Website enquiry from Aisha Khan');
    expect(general?.text).toContain('is the masjid open');

    const funerals = buildContactEmail({ ...base, form: 'funerals' }, {});
    expect(funerals?.to).toEqual([siteConfig.contact.funeralsEmail]);
    expect(funerals?.subject).toBe('Funeral query from Aisha Khan');
  });

  it('can send everything to one address and from a verified sender', () => {
    const email = buildContactEmail(
      { ...base, form: 'quran-academy' },
      {
        CONTACT_EMAIL_TO_OVERRIDE: 'owner@example.com',
        CONTACT_EMAIL_FROM: 'Site <w@example.org>',
      },
    );
    expect(email?.to).toEqual(['owner@example.com']);
    expect(email?.from).toBe('Site <w@example.org>');
  });
});

it('reads stored rows and skips ones it doesn’t understand', () => {
  const row = {
    id: '1',
    created_at: '2026-10-18T09:00:00Z',
    form: 'funerals',
    name: 'Yusuf',
    email: 'y@example.com',
    message: 'Hello',
    page: '/services/funerals',
    status: 'new',
    emailed_to: null,
    email_error: 'Email not set up (no RESEND_API_KEY)',
  };
  expect(rowToMessage(row)).toMatchObject({
    form: 'funerals',
    status: 'new',
    page: '/services/funerals',
    emailError: 'Email not set up (no RESEND_API_KEY)',
  });
  expect(rowToMessage(row)).not.toHaveProperty('emailedTo');
  expect(rowToMessage({ ...row, form: 'newsletter' })).toBeNull();
});
