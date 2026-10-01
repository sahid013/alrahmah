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
      <p className="font-script text-4xl text-secondary-700">Jazakum Allahu khairan</p>
      <StepTitle id="step-title">Thank you, {request.donor.firstName}</StepTitle>
      <p className="text-lg text-neutral-600">
        Your donation of{' '}
        <strong className="font-ui text-primary-900">
          {amountWithFrequency(request.amount, request.frequency)}
        </strong>{' '}
        to <strong className="text-primary-900">{campaignTitle}</strong> has been received. A
        receipt is on its way to {request.donor.email}.
        {request.giftAid.declared && ' Thank you for adding Gift Aid.'}
      </p>
      <p className="text-sm text-neutral-500">
        Reference: <span className="font-ui text-primary-900">{reference}</span>
      </p>
      <div className="flex flex-wrap gap-4">
        <ButtonLink href={siteConfig.links.donate} variant="outline">
          More ways to give
        </ButtonLink>
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-2 font-label font-bold tracking-[0.12em] text-primary-500 uppercase hover:text-secondary-700"
        >
          Give again
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
