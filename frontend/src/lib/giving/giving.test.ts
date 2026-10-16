import { describe, expect, it } from 'vitest';
import {
  amountSchema,
  amountWithFrequency,
  detailsSchema,
  donationRequestSchema,
  fieldErrors,
  normalisePostcode,
  type DonationRequest,
} from './types';

const donor: DonationRequest['donor'] = {
  type: 'personal',
  firstName: 'Aisha',
  lastName: 'Rahman',
  address: '6 Sheepscar Way',
  country: 'GB',
  postcode: 'LS7 3JB',
  city: 'Leeds',
  email: 'aisha@example.com',
  phone: '07700 900123',
};
const valid: DonationRequest = {
  campaignId: 'sadaqah',
  frequency: 'one-off',
  amount: 50,
  donor,
  marketingConsent: false,
};
const errorsOf = (input: unknown) => {
  const r = detailsSchema.safeParse(input);
  return r.success ? {} : fieldErrors(r.error);
};

describe('donation request', () => {
  it('accepts a complete personal donation', () => {
    expect(donationRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('requires the core details', () => {
    const errors = errorsOf({
      ...valid,
      donor: { ...donor, firstName: '', address: '', city: '', email: 'x', phone: '12' },
    });
    expect(Object.keys(errors).sort()).toEqual(
      ['donor.address', 'donor.city', 'donor.email', 'donor.firstName', 'donor.phone'].sort(),
    );
  });

  it('checks UK postcodes but accepts any postcode elsewhere', () => {
    expect(errorsOf({ ...valid, donor: { ...donor, postcode: '7221' } })['donor.postcode']).toMatch(
      /UK postcode/,
    );
    const abroad = { ...donor, country: 'BD', postcode: '7221' };
    expect(errorsOf({ ...valid, donor: abroad })).toEqual({});
    expect(
      errorsOf({ ...valid, donor: { ...donor, country: 'XX' } })['donor.country'],
    ).toBeDefined();
  });

  it('needs an organisation name for Corporate / Group', () => {
    const org = { ...donor, type: 'organisation' };
    expect(errorsOf({ ...valid, donor: org })['donor.organisation']).toBeDefined();
    expect(
      errorsOf({ ...valid, donor: { ...org, organisation: 'Leeds Traders' } })[
        'donor.organisation'
      ],
    ).toBeUndefined();
  });

  it('validates amounts', () => {
    const errors = (amount: number) =>
      fieldErrors(amountSchema.safeParse({ ...valid, amount }).error!).amount;
    expect(errors(0.5)).toMatch(/minimum/);
    expect(errors(30_000)).toMatch(/contact us/);
    expect(errors(10.555)).toMatch(/pence/);
    expect(amountSchema.safeParse({ ...valid, amount: 12.5 }).success).toBe(true);
  });
});

describe('giving helpers', () => {
  it('formats amounts with frequency', () => {
    expect(amountWithFrequency(50, 'one-off')).toBe('£50');
    expect(amountWithFrequency(12.5, 'monthly')).toBe('£12.50 a month');
    expect(amountWithFrequency(5, 'weekly')).toBe('£5 a week');
  });
  it('normalises postcodes', () => {
    expect(normalisePostcode(' ls73jb ')).toBe('LS7 3JB');
    expect(normalisePostcode('sw1a 1aa')).toBe('SW1A 1AA');
  });
});

describe('countries', () => {
  it('lists the United Kingdom first, then A–Z, with English names', async () => {
    const { COUNTRY_OPTIONS, countryName } = await import('./countries');
    expect(COUNTRY_OPTIONS[0]).toEqual(['GB', 'United Kingdom']);
    expect(COUNTRY_OPTIONS[1]![1]).toBe('Afghanistan');
    expect(countryName('BD')).toBe('Bangladesh');
    expect(COUNTRY_OPTIONS.length).toBeGreaterThan(200);
  });
});
