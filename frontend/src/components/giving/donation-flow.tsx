'use client';

import { useRef, useState } from 'react';
import { ArrowRightIcon, ChevronIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import type { DonationProgram } from '@/lib/donations/types';
import { paymentsMode, previewPay } from '@/lib/giving/payments';
import {
  amountSchema,
  amountWithFrequency,
  donorSchema,
  fieldErrors,
  giftAidSchema,
  normalisePostcode,
  type DonationRequest,
} from '@/lib/giving/types';
import { AmountStep, defaultFrequency, type AmountValue } from './amount-step';
import { CampaignPanel } from './campaign-panel';
import { DetailsStep } from './details-step';
import { PaymentStep } from './payment-step';
import { STEPS, Stepper } from './stepper';
import { StripePayment } from './stripe-payment';
import { ThankYou } from './thank-you';

const prefix = (errors: Record<string, string>, p: string) =>
  Object.fromEntries(Object.entries(errors).map(([k, v]) => [`${p}.${k}`, v]));

/**
 * Four-step donation page: Amount → Details (+ Gift Aid) → Payment → Thank you.
 * Step 3 shows Stripe's Payment Element when Stripe keys are configured (`paymentsMode`).
 */
export function DonationFlow({
  programs,
  initialId,
}: {
  programs: DonationProgram[];
  initialId?: string;
}) {
  const stripeMode = paymentsMode === 'stripe';
  const initial = programs.find((p) => p.id === initialId);
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<AmountValue>(() => ({
    campaignId: initial?.id ?? '',
    frequency: defaultFrequency(initial),
    amountText: String(initial?.price?.amount ?? 25),
  }));
  const [donor, setDonor] = useState<DonationRequest['donor']>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [giftAid, setGiftAid] = useState<DonationRequest['giftAid']>({ declared: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string>();
  const [reference, setReference] = useState<string>();
  const formRef = useRef<HTMLDivElement>(null);

  const program = programs.find((p) => p.id === choice.campaignId);
  const amount = choice.amountText === '' ? Number.NaN : Number(choice.amountText);
  const request: DonationRequest = {
    campaignId: choice.campaignId,
    frequency: choice.frequency,
    amount,
    donor: { ...donor, email: donor.email.trim() },
    giftAid: giftAid.declared
      ? { ...giftAid, postcode: giftAid.postcode && normalisePostcode(giftAid.postcode) }
      : { declared: false },
  };

  const goTo = (next: number) => {
    setStep(next);
    setErrors({});
    // Bring the new step into view and move focus to its heading for screen readers.
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('step-title')?.focus({ preventScroll: true });
    });
  };

  const clear = (keys: string[]) =>
    setErrors((e) =>
      Object.fromEntries(Object.entries(e).filter(([k]) => !keys.some((x) => k.endsWith(x)))),
    );

  const next = async () => {
    if (step === 0) {
      const r = amountSchema.safeParse(request);
      if (!r.success) return setErrors(fieldErrors(r.error));
      return goTo(1);
    }
    if (step === 1) {
      const d = donorSchema.safeParse(request.donor);
      const g = giftAidSchema.safeParse(request.giftAid);
      const errs = {
        ...(d.success ? {} : prefix(fieldErrors(d.error), 'donor')),
        ...(g.success ? {} : prefix(fieldErrors(g.error), 'giftAid')),
      };
      if (Object.keys(errs).length) return setErrors(errs);
      return goTo(2);
    }
    if (step === 2) {
      setBusy(true);
      setPayError(undefined);
      try {
        const { reference } = await previewPay();
        setReference(reference);
        goTo(3);
      } catch (e) {
        setPayError(
          e instanceof Error ? e.message : 'The payment did not go through. Please try again.',
        );
      } finally {
        setBusy(false);
      }
    }
  };

  const restart = () => {
    setReference(undefined);
    goTo(0);
  };

  const nextLabel =
    step === 2
      ? busy
        ? 'Processing…'
        : `Complete test donation ${Number.isFinite(amount) ? amountWithFrequency(amount, choice.frequency) : ''}`
      : 'Next';
  // With Stripe, the Payment Element has its own Donate button.
  const showSubmit = !(step === 2 && stripeMode);

  return (
    <div className="grid lg:grid-cols-[5fr_7fr]">
      <CampaignPanel program={program} />
      <div ref={formRef} className="scroll-mt-24 bg-white lg:scroll-mt-40">
        <Container className="max-w-3xl py-10 lg:px-16 lg:py-16">
          <Stepper current={step} onSelect={goTo} />
          <form
            noValidate
            className="mt-12"
            onSubmit={(e) => {
              e.preventDefault();
              void next();
            }}
          >
            {step === 0 && (
              <AmountStep
                programs={programs}
                value={choice}
                amount={amount}
                errors={errors}
                onChange={(patch) => {
                  setChoice((c) => ({ ...c, ...patch }));
                  clear(Object.keys(patch).map((k) => (k === 'amountText' ? 'amount' : k)));
                  if (patch.campaignId)
                    window.history.replaceState(null, '', `/give/${patch.campaignId}`);
                }}
              />
            )}
            {step === 1 && (
              <DetailsStep
                donor={donor}
                giftAid={giftAid}
                amount={amount}
                frequency={choice.frequency}
                errors={errors}
                onDonor={(patch) => {
                  setDonor((d) => ({ ...d, ...patch }));
                  clear(Object.keys(patch).map((k) => `donor.${k}`));
                }}
                onGiftAid={(patch) => {
                  setGiftAid((g) => ({ ...g, ...patch }));
                  clear(Object.keys(patch).map((k) => `giftAid.${k}`));
                }}
              />
            )}
            {step === 2 && (
              <PaymentStep request={request} campaignTitle={program?.title ?? ''} error={payError}>
                {stripeMode ? (
                  <StripePayment
                    key={JSON.stringify(request)}
                    request={request}
                    onPaid={(ref) => {
                      setReference(ref);
                      goTo(3);
                    }}
                  />
                ) : (
                  <p className="border border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-600">
                    <strong className="text-warning-700">Preview:</strong> online card payments are
                    being set up. Completing this step now takes no payment.
                  </p>
                )}
              </PaymentStep>
            )}
            {step === 3 && reference && (
              <ThankYou
                request={request}
                campaignTitle={program?.title ?? ''}
                reference={reference}
                onAgain={restart}
              />
            )}

            {step < STEPS.length - 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-8">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    className="inline-flex items-center gap-2 font-label font-bold tracking-[0.12em] text-primary-500 uppercase hover:text-secondary-700"
                  >
                    <ChevronIcon direction="left" className="size-4" />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                {showSubmit && (
                  <Button
                    type="submit"
                    size="lg"
                    variant={step === 2 ? 'secondary' : 'primary'}
                    disabled={busy}
                  >
                    {nextLabel}
                    {step < 2 && <ArrowRightIcon className="size-4" />}
                  </Button>
                )}
              </div>
            )}
          </form>
        </Container>
      </div>
    </div>
  );
}
