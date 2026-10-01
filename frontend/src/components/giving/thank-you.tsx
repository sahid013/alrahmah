import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { amountWithFrequency, type DonationRequest } from '@/lib/giving/types';
import { StepTitle } from './fields';

export function ThankYou({
  request,
  campaignTitle,
  reference,
  onAgain,
}: {
  request: DonationRequest;
  campaignTitle: string;
  reference: string;
  onAgain: () => void;
}) {
  return (
    <div className="space-y-8">
      <p className="font-script text-4xl text-secondary-300">Jazakum Allahu khairan</p>
      <StepTitle id="step-title">Thank you, {request.donor.firstName}</StepTitle>
      <p className="text-lg text-primary-100">
        Your donation of{' '}
        <strong className="font-ui text-white">
          {amountWithFrequency(request.amount, request.frequency)}
        </strong>{' '}
        to <strong className="text-white">{campaignTitle}</strong> has been received. A receipt is
        on its way to {request.donor.email}.
        {request.giftAid.declared && ' Thank you for adding Gift Aid.'}
      </p>
      <p className="text-sm text-primary-200">
        Reference: <span className="font-ui text-white">{reference}</span>
      </p>
      <div className="flex flex-wrap gap-4">
        <ButtonLink href={siteConfig.links.donations} variant="outline-light">
          More ways to give
        </ButtonLink>
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
