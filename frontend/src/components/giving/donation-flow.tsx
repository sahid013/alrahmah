'use client';

import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useRef, useState } from 'react';
import { ArrowRightIcon, ChevronIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import type { DonationProgram } from '@/lib/donations/types';
import { UK } from '@/lib/giving/countries';
import { checkoutHref, DEFAULT_CAUSE } from '@/lib/giving/links';
import { paymentsMode, previewPay } from '@/lib/giving/payments';
import {
  amountSchema,
  amountWithFrequency,
  detailsSchema,
  fieldErrors,
  normalisePostcode,
  type DonationRequest,
  type Donor,
} from '@/lib/giving/types';
import { AmountStep, defaultFrequency, type AmountValue } from './amount-step';
import { DonatePanel } from './donate-panel';
import { DetailsStep } from './details-step';
import { PaymentStep } from './payment-step';
import { STEPS, Stepper } from './stepper';
import { StripePayment } from './stripe-payment';
import { ThankYou } from './thank-you';

const EMPTY_DONOR: Donor = {
  type: 'personal',
  firstName: '',
  lastName: '',
  address: '',
  country: 'GB',
  postcode: '',
  city: '',
  email: '',
  phone: '',
};

/**
 * Four-step donation page: Amount → Details (+ Gift Aid) → Payment → Thank you.
 * Step 3 shows Stripe's Payment Element when Stripe keys are configured (`paymentsMode`).
 * Dark theme; steps slide/fade with framer-motion (respects reduced motion).
 */
export function DonationFlow({
  programs,
  initialId,
}: {
  programs: DonationProgram[];
  initialId?: string;
}) {
  const stripeMode = paymentsMode === 'stripe';
  // A campaign link preselects its cause; the general /donate page starts on General Sadaqah.
  const initial =
    programs.find((p) => p.id === initialId) ?? programs.find((p) => p.id === DEFAULT_CAUSE);
  const [step, setStep] = useState(0);
  /** +1 when moving forward, -1 when going back (drives the slide direction). */
  const [direction, setDirection] = useState(1);
  const [choice, setChoice] = useState<AmountValue>(() => ({
    campaignId: initial?.id ?? '',
    frequency: defaultFrequency(initial),
    amountText: String(initial?.price?.amount ?? 25),
  }));
  const [donor, setDonor] = useState<Donor>(EMPTY_DONOR);
  const [giftAid, setGiftAid] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
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
    donor: {
      ...donor,
      email: donor.email.trim(),
      postcode: donor.country === UK ? normalisePostcode(donor.postcode) : donor.postcode.trim(),
    },
    giftAid: { declared: giftAid && donor.type === 'personal' },
    marketingConsent,
  };

  const goTo = (next: number) => {
    navigated.current = true;
    setDirection(next >= step ? 1 : -1);
    setStep(next);
    setErrors({});
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  /** Once a step the donor navigated to has animated in, move focus to its heading. */
  const navigated = useRef(false);
  const focusHeading = () => {
    if (navigated.current) document.getElementById('step-title')?.focus({ preventScroll: true });
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
      const r = detailsSchema.safeParse(request);
      if (!r.success) return setErrors(fieldErrors(r.error));
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

  const slide = {
    initial: { opacity: 0, x: 32 * direction },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -32 * direction },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid bg-primary-950 lg:grid-cols-[5fr_7fr]">
        <DonatePanel />
        <div ref={formRef} className="scroll-mt-24 [color-scheme:dark] lg:scroll-mt-40">
          <Container className="max-w-3xl py-10 lg:px-16 lg:py-20">
            <Stepper current={step} onSelect={goTo} />
            <form
              noValidate
              className="mt-12 overflow-x-clip"
              onSubmit={(e) => {
                e.preventDefault();
                void next();
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} {...slide} onAnimationComplete={focusHeading}>
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
                          window.history.replaceState(null, '', checkoutHref(patch.campaignId));
                      }}
                    />
                  )}
                  {step === 1 && (
                    <DetailsStep
                      donor={donor}
                      giftAid={giftAid}
                      marketingConsent={marketingConsent}
                      amount={amount}
                      frequency={choice.frequency}
                      errors={errors}
                      onDonor={(patch) => {
                        setDonor((d) => ({ ...d, ...patch }));
                        clear(Object.keys(patch).map((k) => `donor.${k}`));
                      }}
                      onGiftAid={(declared) => {
                        setGiftAid(declared);
                        clear(['giftAid.declared']);
                      }}
                      onConsent={setMarketingConsent}
                    />
                  )}
                  {step === 2 && (
                    <PaymentStep
                      request={request}
                      campaignTitle={program?.title ?? ''}
                      error={payError}
                    >
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
                        <p className="border border-dashed border-white/20 bg-white/5 p-6 text-primary-100">
                          <strong className="text-secondary-300">Preview:</strong> online card
                          payments are being set up. Completing this step now takes no payment.
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
                </motion.div>
              </AnimatePresence>

              {step < STEPS.length - 1 && (
                <div className="mt-14 flex flex-wrap items-center justify-between gap-4">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => goTo(step - 1)}
                      className="inline-flex items-center gap-2 font-label font-bold tracking-[0.12em] text-secondary-300 uppercase transition-colors hover:text-white"
                    >
                      <ChevronIcon direction="left" className="size-4" />
                      Back
                    </button>
                  ) : (
                    <span />
                  )}
                  {showSubmit && (
                    <Button type="submit" size="lg" variant="secondary" disabled={busy}>
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
    </MotionConfig>
  );
}
