import { describe, expect, it } from 'vitest';
import type { Giving } from '@/lib/donations/types';
import {
  annualValue,
  causeParam,
  completionEvent,
  dataLayerEntry,
  donationParams,
  donationTypeParam,
  paymentMethodParam,
} from './tracking';

const regular: Giving = { kind: 'regular' };
const nights: Giving = {
  kind: 'daily',
  firstDate: '2027-02-27',
  count: 10,
  unit: 'night',
  chargeTime: '21:00',
  periodLabel: 'the last 10 nights of Ramadan',
  presets: [1, 5, 10, 20],
};
const days: Giving = { ...nights, unit: 'day' };

describe('tracking parameters', () => {
  it('names causes as the spec does', () => {
    expect(causeParam('masjid-expansion')).toBe('masjid_expansion');
    expect(causeParam('fitrana')).toBe('fitrana');
    expect(causeParam('last-10-nights')).toBe('last_10_nights');
    expect(causeParam('first-10-days-dhul-hijjah')).toBe('dhul_hijjah_10_days');
    expect(causeParam('new-roof-appeal')).toBe('new_roof_appeal');
  });

  it('names donation types', () => {
    expect(donationTypeParam('one-off', regular)).toBe('one_off');
    expect(donationTypeParam('weekly', regular)).toBe('weekly');
    expect(donationTypeParam('monthly', regular)).toBe('monthly');
    expect(donationTypeParam('daily', nights)).toBe('nightly_10');
    expect(donationTypeParam('daily', days)).toBe('daily_10');
  });

  it('maps Stripe payment methods', () => {
    expect(paymentMethodParam('card')).toBe('card');
    expect(paymentMethodParam('card', 'apple_pay')).toBe('apple_pay');
    expect(paymentMethodParam('card', 'google_pay')).toBe('google_pay');
    expect(paymentMethodParam('apple_pay')).toBe('apple_pay');
    expect(paymentMethodParam('revolut_pay')).toBe('revolut_pay');
    expect(paymentMethodParam('bacs_debit')).toBe('direct_debit');
    expect(paymentMethodParam('link')).toBe('card');
  });

  it('works out the annual value', () => {
    expect(annualValue(25, 'one-off')).toBe(25);
    expect(annualValue(5, 'weekly')).toBe(260);
    expect(annualValue(10.5, 'monthly')).toBe(126);
  });

  it('builds the step parameters', () => {
    expect(donationParams('masjid-expansion', regular, 'monthly', 25)).toEqual({
      value: 25,
      currency: 'GBP',
      cause: 'masjid_expansion',
      donation_type: 'monthly',
    });
  });
});

describe('completionEvent', () => {
  const base = { sessionId: 'cs_live_a1b2c3RFXENE31', campaignId: 'masjid-expansion' };

  it('is a Purchase for one-off and regular gifts, with the session-based event_id', () => {
    expect(
      completionEvent({
        ...base,
        giving: regular,
        frequency: 'weekly',
        amount: 10,
        method: 'apple_pay',
      }),
    ).toEqual({
      event: 'Purchase',
      event_id: 'Purchase-cs_live_a1b2c3RFXENE31',
      value: 10,
      currency: 'GBP',
      cause: 'masjid_expansion',
      donation_type: 'weekly',
      payment_sequence: 'first',
      annual_value: 520,
      payment_method: 'apple_pay',
      order_id: 'AR-RFXENE31',
    });
  });

  it('is a Subscribe with the total pledged for daily causes, without annual_value', () => {
    const event = completionEvent({
      ...base,
      campaignId: 'last-10-nights',
      giving: nights,
      frequency: 'daily',
      amount: 5,
      count: 7,
      method: 'card',
    });
    expect(event).toMatchObject({
      event: 'Subscribe',
      event_id: 'Subscribe-cs_live_a1b2c3RFXENE31',
      value: 35,
      donation_type: 'nightly_10',
      payment_sequence: 'first',
    });
    expect(event).not.toHaveProperty('annual_value');
  });

  it('leaves Direct Debit to the server', () => {
    expect(
      completionEvent({
        ...base,
        giving: regular,
        frequency: 'monthly',
        amount: 10,
        method: 'direct_debit',
      }),
    ).toBeNull();
  });
});

describe('dataLayerEntry', () => {
  it('clears parameters an earlier push may have left in GTM', () => {
    const entry = dataLayerEntry({ event: 'ViewContent', event_id: 'ViewContent-1', cause: 'x' });
    expect(entry).toHaveProperty('annual_value', undefined);
    expect(entry).toHaveProperty('value', undefined);
    expect(entry).toMatchObject({ event: 'ViewContent', cause: 'x' });
  });
});
