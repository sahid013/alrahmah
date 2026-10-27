'use client';

import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout';
import { loadStripe, type Appearance, type Stripe } from '@stripe/stripe-js';
import { useMemo, useRef, useState } from 'react';
import { HeartIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { DailyPlan } from '@/lib/giving/schedule';
import { amountWithFrequency, type DonationRequest } from '@/lib/giving/types';
import { ErrorBox } from './fields';

/** A finished payment step, for the Thank you step and the Purchase / Subscribe event. */
export interface PaidResult {
  sessionId: string;
  /** The donation's event_id (made by the server, shared with the Meta server event). */
  eventId: string;
  /** Set for daily causes (card saved, charges scheduled). */
  plan?: DailyPlan;
  /** The Payment Element's method type (card, apple_pay, bacs_debit, …). */
  method: string;
  /** The money was taken (or the card saved) now; false while Direct Debit is processing. */
  instant: boolean;
}

/**
 * Stripe.js, loaded only when a payment starts, with the publishable key the server sends with
 * the session (live or test, whichever mode the donation is in). Cached per key. Stripe's
 * developer assistant (the floating "stripe" button shown in test mode) is always off, so donors
 * never see it.
 */
const stripeByKey = new Map<string, Promise<Stripe | null>>();
function loadStripeFor(publishableKey: string) {
  let stripe = stripeByKey.get(publishableKey);
  if (!stripe) {
    stripe = loadStripe(publishableKey, { developerTools: { assistant: { enabled: false } } });
    stripeByKey.set(publishableKey, stripe);
  }
  return stripe;
}

/** Stripe's form, styled to match the dark donation page: square corners, brand colours, Poppins. */
const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#25a6de',
    colorBackground: '#1e1c4a',
    colorText: '#ffffff',
    colorTextSecondary: '#c3c2db',
    colorTextPlaceholder: '#9a98c3',
    colorDanger: '#fca5a5',
    fontFamily: 'Poppins, system-ui, sans-serif',
    fontSizeBase: '16px',
    borderRadius: '0px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: 'none',
      padding: '12px 16px',
    },
    '.Input:focus': { borderColor: '#5cbce6', boxShadow: '0 0 0 2px #5cbce6' },
    '.Label': { fontWeight: '600', color: '#ffffff' },
    '.Tab': {
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: 'none',
      backgroundColor: '#1e1c4a',
    },
    '.Tab:hover': { borderColor: 'rgba(255,255,255,0.3)' },
    '.Tab--selected': { borderColor: '#25a6de', boxShadow: '0 0 0 1px #25a6de' },
  },
};

/** Daily causes: schedule the nightly/daily charges for the saved card (idempotent). */
async function finaliseDaily(sessionId: string): Promise<DailyPlan> {
  const res = await fetch('/api/giving/finalise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  const data = (await res.json().catch(() => ({}))) as { plan?: DailyPlan; error?: string };
  if (!res.ok || !data.plan)
    throw new Error(data.error ?? 'Your card was saved, but the donations could not be scheduled.');
  return data.plan;
}

interface PaymentSession {
  clientSecret: string;
  publishableKey: string;
  eventId: string;
}

async function startSession(request: DonationRequest): Promise<PaymentSession> {
  const res = await fetch('/api/giving/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<PaymentSession> & {
    error?: string;
  };
  if (!res.ok || !data.clientSecret || !data.publishableKey || !data.eventId)
    throw new Error(data.error ?? 'Could not start the payment.');
  return {
    clientSecret: data.clientSecret,
    publishableKey: data.publishableKey,
    eventId: data.eventId,
  };
}

/**
 * Creates a Stripe session for this exact donation and renders the Payment Element. Remount
 * (via `key`) whenever the donation changes so the amount always matches the session.
 */
export function StripePayment({
  request,
  unit,
  onPaid,
}: {
  request: DonationRequest;
  /** Daily causes: "night" or "day" (for the button). */
  unit?: 'night' | 'day';
  onPaid: (result: PaidResult) => void;
}) {
  // One session per mount; the promises are created once. If the session can't start, both
  // reject and Stripe's provider shows the error.
  const [{ stripe, clientSecret, eventId }] = useState(() => {
    const session = startSession(request);
    return {
      stripe: session.then((s) => loadStripeFor(s.publishableKey)),
      clientSecret: session.then((s) => s.clientSecret),
      eventId: session.then((s) => s.eventId),
    };
  });
  const options = useMemo(
    () => ({
      clientSecret,
      // Prefill the billing address from the Details step. The email is already set on the
      // session server-side (customer_email), so it is not repeated.
      defaultValues: {
        billingAddress: {
          name: `${request.donor.firstName} ${request.donor.lastName}`,
          address: {
            country: request.donor.country,
            line1: request.donor.address.split('\n')[0] ?? null,
            city: request.donor.city,
            postal_code: request.donor.postcode,
          },
        },
      },
      elementsOptions: {
        appearance,
        fonts: [
          {
            cssSrc:
              'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap',
          },
        ],
      },
    }),
    [clientSecret, request],
  );

  return (
    <CheckoutElementsProvider stripe={stripe} options={options}>
      <PaymentForm request={request} unit={unit} eventId={eventId} onPaid={onPaid} />
    </CheckoutElementsProvider>
  );
}

function PaymentForm({
  request,
  unit,
  eventId,
  onPaid,
}: {
  request: DonationRequest;
  unit?: 'night' | 'day';
  /** Resolved before the form shows (it comes with the session). */
  eventId: Promise<string>;
  onPaid: (result: PaidResult) => void;
}) {
  const state = useCheckoutElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const method = useRef('card');

  if (state.type === 'loading')
    return (
      <div aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading secure payment form…</span>
        <div className="h-12 animate-pulse bg-white/10 motion-reduce:animate-none" />
        <div className="h-12 animate-pulse bg-white/10 motion-reduce:animate-none" />
      </div>
    );
  if (state.type === 'error') return <ErrorBox>{state.error.message}</ErrorBox>;

  const { checkout } = state;

  const pay = async () => {
    setBusy(true);
    setError(undefined);
    try {
      // Bank checks that need a redirect return to the session's return_url (/donate/complete).
      const result = await checkout.confirm({ redirect: 'if_required' });
      if (result.type === 'error') return setError(result.error.message);
      const { id, status } = result.session;
      const instant = status.type === 'complete' && status.paymentStatus !== 'unpaid';
      const plan = request.frequency === 'daily' ? await finaliseDaily(id) : undefined;
      onPaid({ sessionId: id, eventId: await eventId, plan, method: method.current, instant });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'The payment did not go through. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PaymentElement
        options={{ layout: 'tabs' }}
        onChange={(e) => {
          method.current = e.value.type;
        }}
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="w-full"
        loading={busy}
        disabled={!checkout.canConfirm}
        onClick={() => void pay()}
      >
        <HeartIcon className="size-4" />
        {busy
          ? 'Processing…'
          : `${request.frequency === 'daily' ? 'Confirm' : 'Donate'} ${amountWithFrequency(request.amount, request.frequency, unit)}`}
      </Button>
    </div>
  );
}
