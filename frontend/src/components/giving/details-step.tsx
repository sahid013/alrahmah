import type { ReactNode } from 'react';
import { GIFT_AID, MARKETING_CONSENT } from '@/lib/giving/consent';
import { COUNTRY_OPTIONS, UK } from '@/lib/giving/countries';
import {
  DONOR_TYPE_LABELS,
  DONOR_TYPES,
  formatGbp,
  giftAidBonus,
  normalisePostcode,
  type Donor,
  type DonorType,
} from '@/lib/giving/types';
import { GiveField, GiveInput, GiveSelect, GiveTextarea, StepTitle } from './fields';

/** Text inputs for the donor fields, keyed by name. */
type TextKey = Exclude<keyof Donor, 'type' | 'country'>;

export function DetailsStep({
  donor,
  marketingConsent,
  giftAid,
  amount,
  errors,
  onDonor,
  onConsent,
  onGiftAid,
}: {
  donor: Donor;
  marketingConsent: boolean;
  /** Gift Aid declared (personal donations only). */
  giftAid: boolean;
  /** This payment's amount, for "£50 becomes £62.50". */
  amount: number;
  errors: Record<string, string>;
  onDonor: (patch: Partial<Donor>) => void;
  onConsent: (consent: boolean) => void;
  onGiftAid: (declared: boolean) => void;
}) {
  const err = (k: keyof Donor) => errors[`donor.${k}`];
  /** Props for a donor text input: value, change handler, error state. */
  const text = (key: TextKey, required = true) => ({
    value: donor[key] ?? '',
    'aria-invalid': !!err(key),
    'aria-required': required,
    onChange: (e: { target: { value: string } }) =>
      onDonor({ [key]: required ? e.target.value : e.target.value || undefined }),
  });
  const uk = donor.country === UK;
  const personal = donor.type === 'personal';

  return (
    <div className="space-y-10">
      <StepTitle id="step-title">Your details</StepTitle>

      <div className="grid gap-6 sm:grid-cols-2">
        <GiveField label="Donating as" required className="sm:col-span-2">
          <GiveSelect
            value={donor.type}
            onChange={(e) => {
              const type = e.target.value as DonorType;
              onDonor({ type, ...(type === 'personal' && { organisation: undefined }) });
              // Gift Aid is only for individuals.
              if (type !== 'personal') onGiftAid(false);
            }}
          >
            {DONOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {DONOR_TYPE_LABELS[t]}
              </option>
            ))}
          </GiveSelect>
        </GiveField>

        {!personal && (
          <GiveField
            label="Organisation name"
            required
            error={err('organisation')}
            className="sm:col-span-2"
          >
            <GiveInput autoComplete="organization" {...text('organisation')} />
          </GiveField>
        )}

        <GiveField label="First name" required error={err('firstName')}>
          <GiveInput autoComplete="given-name" {...text('firstName')} />
        </GiveField>
        <GiveField label="Last name" required error={err('lastName')}>
          <GiveInput autoComplete="family-name" {...text('lastName')} />
        </GiveField>

        <GiveField label="Address" required error={err('address')} className="sm:col-span-2">
          <GiveTextarea autoComplete="street-address" rows={3} {...text('address')} />
        </GiveField>

        <GiveField label="Country" required error={err('country')}>
          <GiveSelect
            autoComplete="country"
            value={donor.country}
            aria-invalid={!!err('country')}
            onChange={(e) => onDonor({ country: e.target.value })}
          >
            {COUNTRY_OPTIONS.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </GiveSelect>
        </GiveField>
        <GiveField label={uk ? 'Postcode' : 'Postal / ZIP code'} required error={err('postcode')}>
          <GiveInput
            autoComplete="postal-code"
            {...text('postcode')}
            onBlur={(e) =>
              uk && e.target.value && onDonor({ postcode: normalisePostcode(e.target.value) })
            }
            className="font-ui uppercase"
          />
        </GiveField>

        <GiveField label="Town / City" required error={err('city')}>
          <GiveInput autoComplete="address-level2" {...text('city')} />
        </GiveField>
        <GiveField label={uk ? 'County' : 'State / Province'} optional>
          <GiveInput autoComplete="address-level1" {...text('region', false)} />
        </GiveField>

        <GiveField
          label="Email"
          required
          hint="We'll email your receipt here."
          error={err('email')}
        >
          <GiveInput type="email" autoComplete="email" {...text('email')} />
        </GiveField>
        <GiveField label="Phone" required error={err('phone')}>
          <GiveInput
            type="tel"
            autoComplete="tel"
            placeholder="07700 900123"
            {...text('phone')}
            className="font-ui"
          />
        </GiveField>
      </div>

      {/* Gift Aid: individual UK taxpayers only, unticked by default. */}
      {personal && (
        <section aria-labelledby="gift-aid-title" className="space-y-3">
          <h3
            id="gift-aid-title"
            className="font-label text-sm font-bold tracking-[0.12em] text-white uppercase"
          >
            {GIFT_AID.title}
          </h3>
          <p className="text-primary-100">
            {GIFT_AID.intro}
            {Number.isFinite(amount) && amount > 0 && (
              <>
                {' '}
                Your <span className="font-ui">{formatGbp(amount)}</span> becomes{' '}
                <strong className="font-ui text-secondary-300">
                  {formatGbp(amount + giftAidBonus(amount))}
                </strong>
                .
              </>
            )}
          </p>
          <Checkbox checked={giftAid} onChange={onGiftAid} error={errors['giftAid.declared']}>
            <strong>Yes, {GIFT_AID.declarationLead}</strong> {GIFT_AID.declarationRest}
          </Checkbox>
          {/* HMRC: the donor sees the whole declaration, taxpayer statement included, before ticking. */}
          <div className="space-y-2 text-sm text-primary-200">
            <p>{GIFT_AID.taxpayer}</p>
            {giftAid && <p>{GIFT_AID.changes}</p>}
          </div>
        </section>
      )}

      {/* Marketing / data consent: optional, unticked by default. */}
      <section aria-label="Keeping in touch" className="space-y-3">
        <Checkbox checked={marketingConsent} onChange={onConsent}>
          <strong>{MARKETING_CONSENT.title}</strong> {MARKETING_CONSENT.body}
        </Checkbox>
        <p className="text-sm text-primary-200">
          We use your details to process your donation, send your receipt and claim Gift Aid if you
          add it. We never sell or share your information.
        </p>
      </section>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-secondary-500"
        />
        <span className="text-white">{children}</span>
      </label>
      {error && <p className="mt-1.5 text-sm text-error-300">{error}</p>}
    </div>
  );
}
