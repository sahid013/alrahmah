import type { Giving } from '@/lib/donations/types';
import { referenceFromSession } from './payments';
import type { Frequency } from './types';

/**
 * Donation events for Google Tag Manager, as the marketing team's tracking spec defines them.
 * Each event is pushed to the dataLayer with its `event_id` and parameters at the top level; the
 * Meta and GA4 tags in GTM read them from there.
 *
 *   PageView          every page (`PageViewTracker`)
 *   ViewContent       a donation form loads
 *   InitiateCheckout  step 1 (Amount) → Next
 *   AddPaymentInfo    step 2 (Details) → Next
 *   Purchase          one-off gift, or the first payment of a weekly/monthly one, succeeded
 *   Subscribe         a daily cause's or Jumu'ah giving's card was saved (charges scheduled)
 *
 * Purchase and Subscribe fire in the browser only for instant methods: Direct Debit takes days to
 * clear, so it's left to the server events. Their `event_id` is a UUID the server makes with the
 * payment session and saves in its Stripe metadata, so the server event (`server-events.ts`)
 * carries the same id and Meta counts the donation once.
 */
export type DonationEventName =
  'ViewContent' | 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase' | 'Subscribe';

export type PaymentMethodParam =
  'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'revolut_pay' | 'amazon_pay' | 'direct_debit';

export interface DonationParams {
  value: number;
  currency: 'GBP';
  cause: string;
  donation_type: string;
}

export interface CompletionParams extends DonationParams {
  payment_sequence: 'first';
  annual_value?: number;
  payment_method: PaymentMethodParam;
  order_id: string;
}

export interface TrackingEvent {
  event: DonationEventName | 'PageView';
  event_id: string;
  [param: string]: unknown;
}

/**
 * Every parameter any donation event can carry. Each push sets all of them (unused ones to
 * undefined), because GTM's data model keeps values from earlier pushes: without this, a
 * Subscribe would still see the annual_value of a Purchase made earlier in the visit.
 */
const PARAMS = [
  'value',
  'currency',
  'cause',
  'donation_type',
  'payment_sequence',
  'annual_value',
  'payment_method',
  'order_id',
] as const;

/** The spec's names for the causes; a cause added later uses its id in snake_case. */
const CAUSE_NAMES: Record<string, string> = {
  'masjid-expansion': 'masjid_expansion',
  fitrana: 'fitrana',
  'last-10-nights': 'last_10_nights',
  'first-10-days-dhul-hijjah': 'dhul_hijjah_10_days',
};
export const causeParam = (campaignId: string) =>
  CAUSE_NAMES[campaignId] ?? campaignId.replace(/-/g, '_');

/** one_off / weekly / monthly (Jumu'ah giving: weekly), or nightly_10 / daily_10 for daily causes. */
export function donationTypeParam(frequency: Frequency, giving: Giving): string {
  if (giving.kind === 'daily')
    return `${giving.unit === 'night' ? 'nightly' : 'daily'}_${giving.count}`;
  if (giving.kind === 'jumuah') return 'weekly';
  return frequency === 'one-off' ? 'one_off' : frequency;
}

/**
 * A Stripe payment method type (Payment Element `value.type`, or a PaymentMethod's `type` and
 * card wallet) → the spec's value. Link pays by card, so it counts as card.
 */
export function paymentMethodParam(type: string, wallet?: string | null): PaymentMethodParam {
  if (wallet === 'apple_pay' || wallet === 'google_pay') return wallet;
  switch (type) {
    case 'apple_pay':
    case 'google_pay':
    case 'paypal':
    case 'revolut_pay':
    case 'amazon_pay':
      return type;
    case 'bacs_debit':
      return 'direct_debit';
    default:
      return 'card';
  }
}

/** Purchase only: what the gift is worth over a year. */
export function annualValue(value: number, frequency: Frequency): number {
  const perYear = frequency === 'weekly' ? 52 : frequency === 'monthly' ? 12 : 1;
  return round(value * perYear);
}

const round = (n: number) => Math.round(n * 100) / 100;

export function donationParams(
  campaignId: string,
  giving: Giving,
  frequency: Frequency,
  amount: number,
): DonationParams {
  return {
    value: round(amount),
    currency: 'GBP',
    cause: causeParam(campaignId),
    donation_type: donationTypeParam(frequency, giving),
  };
}

export interface Completion {
  sessionId: string;
  /** The donation's event_id from the server (Stripe metadata `event_id`). */
  eventId: string;
  campaignId: string;
  giving: Giving;
  frequency: Frequency;
  /** This payment (daily causes: one night's/day's amount). */
  amount: number;
  /** Daily causes: how many charges were scheduled. */
  count?: number;
  method: PaymentMethodParam;
}

/**
 * Purchase (or Subscribe for daily causes) for a finished donation. Null for Direct Debit, which
 * isn't confirmed for days (the server reports it once it clears).
 */
export function completionEvent(c: Completion): TrackingEvent | null {
  if (c.method === 'direct_debit') return null;
  const base = donationParams(c.campaignId, c.giving, c.frequency, c.amount);
  const common = {
    payment_sequence: 'first' as const,
    payment_method: c.method,
    order_id: referenceFromSession(c.sessionId),
  };
  if (c.giving.kind === 'jumuah') {
    // Subscribe: one Friday's amount (nothing is taken today), plus a year of Fridays.
    const params: CompletionParams = {
      ...base,
      annual_value: annualValue(c.amount, 'weekly'),
      ...common,
    };
    return { event: 'Subscribe', event_id: c.eventId, ...params };
  }
  if (c.giving.kind === 'daily') {
    // Subscribe: the total pledged, e.g. £5 × 10 = £50.
    const params: CompletionParams = {
      ...base,
      value: round(c.amount * (c.count ?? c.giving.count)),
      ...common,
    };
    return { event: 'Subscribe', event_id: c.eventId, ...params };
  }
  const params: CompletionParams = {
    ...base,
    annual_value: annualValue(c.amount, c.frequency),
    ...common,
  };
  return { event: 'Purchase', event_id: c.eventId, ...params };
}

/** A random id (one per donation attempt or page view). */
export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** `{ event, event_id, ...params }` with every parameter key present (see `PARAMS`). */
export function dataLayerEntry(e: TrackingEvent): Record<string, unknown> {
  return { ...Object.fromEntries(PARAMS.map((k) => [k, undefined])), ...e };
}

/**
 * Pushes an event to the dataLayer. GTM only loads after cookie consent, then reads anything
 * pushed before it; its tags apply the consent rules. `once`: skip an event_id already pushed in
 * this tab (e.g. the thank-you page reloaded), so a donation isn't counted twice.
 */
export function track(e: TrackingEvent, { once = false } = {}) {
  if (typeof window === 'undefined') return;
  if (once) {
    const key = `tracked:${e.event_id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage blocked: push anyway; the event_id still lets Meta deduplicate */
    }
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(dataLayerEntry(e));
}
