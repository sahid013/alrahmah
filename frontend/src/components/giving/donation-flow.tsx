'use client';

import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, ChevronIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import type { DonationProgram } from '@/lib/donations/types';
import { UK } from '@/lib/giving/countries';
import { readSource } from '@/lib/giving/attribution';
import { paymentsMode, previewPay, referenceFromSession } from '@/lib/giving/payments';
import { remainingCharges, type DailyPlan } from '@/lib/giving/schedule';
import {
  causeParam,
  completionEvent,
  donationParams,
  newId,
  paymentMethodParam,
  track,
} from '@/lib/giving/tracking';
import {
  amountSchema,
  amountWithFrequency,
  detailsSchema,
  fieldErrors,
  normalisePostcode,
  type DonationRequest,
  type Donor,
} from '@/lib/giving/types';
import { AmountStep, amountFor, initialAmount, type AmountValue } from './amount-step';
import { DonatePanel } from './donate-panel';
import { DetailsStep } from './details-step';
import { PaymentStep } from './payment-step';
import { STEPS, Stepper } from './stepper';
import { StripePayment, type PaidResult } from './stripe-payment';
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
 * One cause's donation page: Amount → Details → Payment → Thank you. The first
 * step is customised to the cause (`AmountStep`); the cause is chosen beforehand on /donate.
 * Step 3 shows Stripe's Payment Element when Stripe keys are configured (`paymentsMode`).
 * Dark theme; steps slide/fade with framer-motion (respects reduced motion).
 * Tag Manager events (`lib/giving/tracking.ts`) fire from the code that changes the step, since
 * every step is on the same URL.
 */
export function DonationFlow({
  program,
  canChangeCause = true,
}: {
  program: DonationProgram;
  /** False when this is the only cause on the website (no "Change cause" link). */
  canChangeCause?: boolean;
}) {
  const stripeMode = paymentsMode === 'stripe';
  const [step, setStep] = useState(0);
  /** +1 when moving forward, -1 when going back (drives the slide direction). */
  const [direction, setDirection] = useState(1);
  const [choice, setChoice] = useState<AmountValue>(() => initialAmount(program));
  const [donor, setDonor] = useState<Donor>(EMPTY_DONOR);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string>();
  const [reference, setReference] = useState<string>();
  const [plan, setPlan] = useState<DailyPlan>();
  const formRef = useRef<HTMLDivElement>(null);
  /** One id per donation attempt: InitiateCheckout / AddPaymentInfo repeat with the same id. */
  const [attempt, setAttempt] = useState(newId);

  const giving = program.giving;
  const unit = giving.kind === 'daily' ? giving.unit : undefined;
  const amount = amountFor(program, choice);
  const request: DonationRequest = {
    campaignId: program.id,
    frequency: choice.frequency,
    amount,
    ...(giving.kind === 'per-person' && { people: choice.people }),
    donor: {
      ...donor,
      email: donor.email.trim(),
      postcode: donor.country === UK ? normalisePostcode(donor.postcode) : donor.postcode.trim(),
    },
    marketingConsent,
    // Where the donor came from (UTM / referrer / landing page), read when the request is built.
    ...(typeof window !== 'undefined' && { source: readSource() }),
  };

  useEffect(() => {
    track(
      { event: 'ViewContent', event_id: `ViewContent-${attempt}`, cause: causeParam(program.id) },
      { once: true },
    );
    // Once per page load (a new attempt after "Give again" isn't a new page view).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.id]);

  const trackStep = (event: 'InitiateCheckout' | 'AddPaymentInfo') =>
    track({
      event,
      event_id: `${event}-${attempt}`,
      ...donationParams(program.id, giving, choice.frequency, amount),
    });

  const paid = ({ sessionId, plan, method, instant }: PaidResult) => {
    if (instant) {
      const event = completionEvent({
        sessionId,
        campaignId: program.id,
        giving,
        frequency: choice.frequency,
        amount,
        count: plan?.count,
        method: paymentMethodParam(method),
      });
      if (event) track(event, { once: true });
    }
    setPlan(plan);
    setReference(referenceFromSession(sessionId));
    goTo(3);
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
      trackStep('InitiateCheckout');
      return goTo(1);
    }
    if (step === 1) {
      const r = detailsSchema.safeParse(request);
      if (!r.success) return setErrors(fieldErrors(r.error));
      trackStep('AddPaymentInfo');
      return goTo(2);
    }
    if (step === 2) {
      setBusy(true);
      setPayError(undefined);
      try {
        const { reference } = await previewPay();
        if (giving.kind === 'daily') {
          // Preview: show the plan the server would schedule.
          const charges = remainingCharges(giving);
          setPlan({
            amount,
            count: charges.length,
            firstCharge: charges[0]?.toISOString() ?? '',
            lastCharge: charges.at(-1)?.toISOString() ?? '',
          });
        }
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
    setPlan(undefined);
    setAttempt(newId());
    goTo(0);
  };

  const nextLabel =
    step === 2
      ? busy
        ? 'Processing…'
        : `Complete test donation ${Number.isFinite(amount) ? amountWithFrequency(amount, choice.frequency, unit) : ''}`
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
                      program={program}
                      canChangeCause={canChangeCause}
                      value={choice}
                      amount={amount}
                      errors={errors}
                      onChange={(patch) => {
                        setChoice((c) => ({ ...c, ...patch }));
                        clear(Object.keys(patch).map((k) => (k === 'amountText' ? 'amount' : k)));
                      }}
                    />
                  )}
                  {step === 1 && (
                    <DetailsStep
                      donor={donor}
                      marketingConsent={marketingConsent}
                      errors={errors}
                      onDonor={(patch) => {
                        setDonor((d) => ({ ...d, ...patch }));
                        clear(Object.keys(patch).map((k) => `donor.${k}`));
                      }}
                      onConsent={setMarketingConsent}
                    />
                  )}
                  {step === 2 && (
                    <PaymentStep request={request} program={program} error={payError}>
                      {stripeMode ? (
                        <StripePayment
                          key={JSON.stringify(request)}
                          request={request}
                          unit={unit}
                          onPaid={paid}
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
                      program={program}
                      plan={plan}
                      reference={reference}
                      canChangeCause={canChangeCause}
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
                    <Button type="submit" size="lg" variant="secondary" loading={busy}>
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
