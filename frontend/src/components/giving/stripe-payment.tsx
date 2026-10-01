'use client';

import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import { useMemo, useState } from 'react';
import { HeartIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { referenceFromSession } from '@/lib/giving/payments';
import { amountWithFrequency, type DonationRequest } from '@/lib/giving/types';
import { ErrorBox } from './fields';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

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

async function fetchClientSecret(request: DonationRequest): Promise<string> {
  const res = await fetch('/api/giving/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = (await res.json().catch(() => ({}))) as { clientSecret?: string; error?: string };
  if (!res.ok || !data.clientSecret) throw new Error(data.error ?? 'Could not start the payment.');
  return data.clientSecret;
}

/**
 * Creates a Stripe session for this exact donation and renders the Payment Element. Remount
 * (via `key`) whenever the donation changes so the amount always matches the session.
 */
export function StripePayment({
  request,
  onPaid,
}: {
  request: DonationRequest;
  onPaid: (reference: string) => void;
}) {
  // One session per mount; the promise is created once.
  const [clientSecret] = useState(() => fetchClientSecret(request));
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
    <CheckoutElementsProvider stripe={stripePromise} options={options}>
      <PaymentForm request={request} onPaid={onPaid} />
    </CheckoutElementsProvider>
  );
}

function PaymentForm({
  request,
  onPaid,
}: {
  request: DonationRequest;
  onPaid: (reference: string) => void;
}) {
  const state = useCheckoutElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

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
      if (result.type === 'error') setError(result.error.message);
      else onPaid(referenceFromSession(result.session.id));
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
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <ErrorBox>{error}</ErrorBox>}
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="w-full"
        disabled={busy || !checkout.canConfirm}
        onClick={() => void pay()}
      >
        <HeartIcon className="size-4" />
        {busy ? 'Processing…' : `Donate ${amountWithFrequency(request.amount, request.frequency)}`}
      </Button>
    </div>
  );
}
