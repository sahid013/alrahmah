/**
 * Which payment step the donation page shows.
 *  - `stripe`: Stripe's Payment Element (Checkout Sessions, ui_mode `elements`), created by
 *    POST /api/giving/session. Card data goes straight to Stripe; webhooks record donations.
 *  - `preview`: no Stripe keys configured; walks through the flow without taking money.
 * `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only switches payments on here: the key Stripe.js actually
 * uses comes with each session, matching its mode (live or test, see `stripe-mode.ts`).
 */
export const paymentsMode: 'stripe' | 'preview' = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? 'stripe'
  : 'preview';

/** Preview: pretend to pay and return a reference. */
export async function previewPay(): Promise<{ reference: string }> {
  await new Promise((r) => setTimeout(r, 900));
  return { reference: `AR-PREVIEW-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
}

/** Short donor-facing reference from a Stripe Checkout Session id. */
export const referenceFromSession = (sessionId: string) =>
  `AR-${sessionId.slice(-8).toUpperCase()}`;
