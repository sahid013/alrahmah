import { describe, expect, it } from 'vitest';
import { base32Decode, base32Encode, totp, verifyTotp } from './totp';
import { generatePassword, newUserSchema } from './types';

// RFC 6238 appendix B: ASCII secret "12345678901234567890".
const rfcSecret = base32Encode(new TextEncoder().encode('12345678901234567890'));

describe('totp', () => {
  it('round-trips base32', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128, 7]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it('matches the RFC 6238 test vectors (SHA-1)', async () => {
    expect(await totp(rfcSecret, 59_000, 8)).toBe('94287082');
    expect(await totp(rfcSecret, 1_111_111_109_000, 8)).toBe('07081804');
    expect(await totp(rfcSecret, 1_234_567_890_000, 8)).toBe('89005924');
  });

  it('verifies the current code with one step of drift', async () => {
    const now = 1_700_000_000_000;
    expect(await verifyTotp(rfcSecret, await totp(rfcSecret, now), now)).toBe(true);
    expect(await verifyTotp(rfcSecret, await totp(rfcSecret, now - 30_000), now)).toBe(true);
    expect(await verifyTotp(rfcSecret, await totp(rfcSecret, now - 120_000), now)).toBe(false);
    expect(await verifyTotp(rfcSecret, 'abc123', now)).toBe(false);
  });
});

describe('new users', () => {
  it('generates passwords that pass validation', () => {
    const password = generatePassword();
    expect(password).toHaveLength(14);
    expect(
      newUserSchema.safeParse({ name: 'A', email: 'a@example.com', role: 'editor', password })
        .success,
    ).toBe(true);
  });
  it('rejects short passwords and bad emails', () => {
    const r = newUserSchema.safeParse({ name: '', email: 'x', role: 'editor', password: 'short' });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(['name', 'email', 'password']);
  });
});
