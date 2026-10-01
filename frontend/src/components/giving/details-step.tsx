import { siteConfig } from '@/config/site';
import {
  TITLES,
  formatGbp,
  giftAidBonus,
  normalisePostcode,
  type DonationRequest,
  type Frequency,
} from '@/lib/giving/types';
import { GiveField, GiveInput, GiveSelect, StepTitle } from './fields';

type Donor = DonationRequest['donor'];
type GiftAid = DonationRequest['giftAid'];

export function DetailsStep({
  donor,
  giftAid,
  amount,
  frequency,
  errors,
  onDonor,
  onGiftAid,
}: {
  donor: Donor;
  giftAid: GiftAid;
  amount: number;
  frequency: Frequency;
  errors: Record<string, string>;
  onDonor: (patch: Partial<Donor>) => void;
  onGiftAid: (patch: Partial<GiftAid>) => void;
}) {
  const bonus = giftAidBonus(amount);
  const err = (k: string) => errors[k];

  return (
    <div className="space-y-10">
      <StepTitle id="step-title">Your details</StepTitle>

      <div className="grid gap-6 sm:grid-cols-[8rem_1fr_1fr]">
        <GiveField label="Title" optional>
          <GiveSelect
            value={donor.title ?? ''}
            onChange={(e) => onDonor({ title: (e.target.value || undefined) as Donor['title'] })}
          >
            <option value="">—</option>
            {TITLES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </GiveSelect>
        </GiveField>
        <GiveField label="First name" error={err('donor.firstName')}>
          <GiveInput
            autoComplete="given-name"
            aria-invalid={!!err('donor.firstName')}
            value={donor.firstName}
            onChange={(e) => onDonor({ firstName: e.target.value })}
          />
        </GiveField>
        <GiveField label="Last name" error={err('donor.lastName')}>
          <GiveInput
            autoComplete="family-name"
            aria-invalid={!!err('donor.lastName')}
            value={donor.lastName}
            onChange={(e) => onDonor({ lastName: e.target.value })}
          />
        </GiveField>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <GiveField label="Email" hint="We'll email your receipt here." error={err('donor.email')}>
          <GiveInput
            type="email"
            autoComplete="email"
            aria-invalid={!!err('donor.email')}
            value={donor.email}
            onChange={(e) => onDonor({ email: e.target.value })}
          />
        </GiveField>
        <GiveField label="Phone" optional>
          <GiveInput
            type="tel"
            autoComplete="tel"
            value={donor.phone ?? ''}
            onChange={(e) => onDonor({ phone: e.target.value || undefined })}
          />
        </GiveField>
      </div>

      {/* Gift Aid */}
      <section
        aria-labelledby="gift-aid-title"
        className="border-l-4 border-secondary-500 bg-primary-50 p-6"
      >
        <h3
          id="gift-aid-title"
          className="font-heading text-title-xl tracking-heading text-primary-900 uppercase"
        >
          Boost your donation with Gift Aid
        </h3>
        <p className="mt-2 text-neutral-600">
          If you are a UK taxpayer, Gift Aid lets us claim an extra 25p for every £1 you give, at no
          cost to you.
          {Number.isFinite(amount) && amount > 0 && (
            <>
              {' '}
              Your {formatGbp(amount)} becomes{' '}
              <strong className="font-ui text-primary-900">{formatGbp(amount + bonus)}</strong>.
            </>
          )}
        </p>
        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={giftAid.declared}
            onChange={(e) => onGiftAid({ declared: e.target.checked })}
            className="mt-1 size-5 shrink-0 accent-primary-500"
          />
          <span className="text-primary-900">
            <strong>Yes, I want to Gift Aid my donation</strong>
            {frequency === 'one-off' ? ' of ' : ', '}
            <span className="font-ui">{Number.isFinite(amount) ? formatGbp(amount) : ''}</span>
            {frequency === 'one-off' ? '' : ` ${frequency} gifts,`} and any donations I make in the
            future or have made in the past 4 years to {siteConfig.legalName}.
          </span>
        </label>
        {giftAid.declared && (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-neutral-600">
              I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains
              Tax in the current tax year than the amount of Gift Aid claimed on all my donations,
              it is my responsibility to pay any difference.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <GiveField label="House name or number" error={err('giftAid.houseNameOrNumber')}>
                <GiveInput
                  autoComplete="address-line1"
                  aria-invalid={!!err('giftAid.houseNameOrNumber')}
                  value={giftAid.houseNameOrNumber ?? ''}
                  onChange={(e) => onGiftAid({ houseNameOrNumber: e.target.value })}
                />
              </GiveField>
              <GiveField label="Postcode" error={err('giftAid.postcode')}>
                <GiveInput
                  autoComplete="postal-code"
                  aria-invalid={!!err('giftAid.postcode')}
                  value={giftAid.postcode ?? ''}
                  onChange={(e) => onGiftAid({ postcode: e.target.value.toUpperCase() })}
                  onBlur={(e) =>
                    e.target.value && onGiftAid({ postcode: normalisePostcode(e.target.value) })
                  }
                  className="font-ui uppercase"
                />
              </GiveField>
            </div>
            <p className="text-sm text-neutral-500">
              Please tell us if you change your name or address, stop paying enough tax, or want to
              cancel this declaration.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
