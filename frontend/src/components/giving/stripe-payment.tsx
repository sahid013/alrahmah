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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

/** Stripe's form, styled to match the site: square corners, brand colours, Poppins. */
const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#363287',
    colorText: '#161436',
    colorTextSecondary: '#515153',
    colorDanger: '#b91c1c',
    colorBackground: '#ffffff',
    fontFamily: 'Poppins, system-ui, sans-serif',
    fontSizeBase: '16px',
    borderRadius: '0px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #a8a8a9', boxShadow: 'none', padding: '12px 16px' },
    '.Input:focus': { borderColor: '#363287', boxShadow: '0 0 0 2px #25a6de' },
    '.Label': { fontWeight: '600', color: '#161436' },
    '.Tab': { border: '1px solid #a8a8a9', boxShadow: 'none' },
    '.Tab--selected': { borderColor: '#363287', boxShadow: '0 0 0 1px #363287' },
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
      // UK masjid: default the billing country to the UK (Stripe otherwise guesses by IP). The
      // email is already set on the session server-side (customer_email), so it is not repeated.
      defaultValues: {
        billingAddress: {
          name: `${request.donor.firstName} ${request.donor.lastName}`,
          address: { country: 'GB', postal_code: request.giftAid.postcode ?? null },
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
        <div className="h-12 animate-pulse bg-neutral-100 motion-reduce:animate-none" />
        <div className="h-12 animate-pulse bg-neutral-100 motion-reduce:animate-none" />
      </div>
    );
  if (state.type === 'error')
    return (
      <p role="alert" className="bg-error-50 px-4 py-3 text-error-700">
        {state.error.message}
      </p>
    );

  const { checkout } = state;

  const pay = async () => {
    setBusy(true);
    setError(undefined);
    try {
      // Bank checks that need a redirect return to the session's return_url (/give/complete).
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
      {error && (
        <p role="alert" className="bg-error-50 px-4 py-3 text-error-700">
          {error}
        </p>
      )}
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
