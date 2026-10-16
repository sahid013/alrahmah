import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import type { DonationProgram } from '@/lib/donations/types';
import { dateRange, formatClock, type DailyPlan } from '@/lib/giving/schedule';
import { amountWithFrequency, formatGbp, type DonationRequest } from '@/lib/giving/types';
import { StepTitle } from './fields';

export function ThankYou({
  request,
  program,
  plan,
  reference,
  onAgain,
  canChangeCause = true,
}: {
  request: DonationRequest;
  program: DonationProgram;
  /** Daily causes: the payments that were scheduled. */
  plan?: DailyPlan;
  reference: string;
  onAgain: () => void;
  /** False when this is the only cause on the website (no "Choose another cause"). */
  canChangeCause?: boolean;
}) {
  const g = program.giving;
  return (
    <div className="space-y-8">
      <p className="font-script text-4xl text-secondary-300">Jazakum Allahu khairan</p>
      <StepTitle id="step-title">Thank you, {request.donor.firstName}</StepTitle>
      {g.kind === 'daily' && plan ? (
        <p className="text-lg text-primary-100">
          Your donation of{' '}
          <strong className="font-ui text-white">
            {amountWithFrequency(plan.amount, 'daily', g.unit)}
          </strong>{' '}
          to <strong className="text-white">{program.title}</strong> is set up:{' '}
          <span className="font-ui text-white">
            {plan.count} payments,{' '}
            {dateRange([new Date(plan.firstCharge), new Date(plan.lastCharge)])}
          </span>
          , taken at {formatClock(g.chargeTime)} each {g.unit} (
          {formatGbp(plan.amount * plan.count)} in total). Nothing has been taken today. A
          confirmation is on its way to {request.donor.email}.
        </p>
      ) : (
        <p className="text-lg text-primary-100">
          Your donation of{' '}
          <strong className="font-ui text-white">
            {amountWithFrequency(request.amount, request.frequency)}
          </strong>{' '}
          to <strong className="text-white">{program.title}</strong>
          {g.kind === 'per-person' && request.people
            ? ` for ${request.people} ${request.people === 1 ? 'person' : 'people'}`
            : ''}{' '}
          has been received. A receipt is on its way to {request.donor.email}.
          {request.giftAid.declared && ' Thank you for adding Gift Aid.'}
        </p>
      )}
      <p className="text-sm text-primary-200">
        Reference: <span className="font-ui text-white">{reference}</span>
      </p>
      <div className="flex flex-wrap gap-4">
        {canChangeCause && (
          <ButtonLink href="/donate" variant="outline-light">
            Choose another cause
          </ButtonLink>
        )}
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-2 font-label font-bold tracking-[0.12em] text-secondary-300 uppercase hover:text-white"
        >
          Give again
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
