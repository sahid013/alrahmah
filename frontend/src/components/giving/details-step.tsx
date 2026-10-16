import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';
import { COUNTRY_OPTIONS, UK } from '@/lib/giving/countries';
import {
  DONOR_TYPE_LABELS,
  DONOR_TYPES,
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
  errors,
  onDonor,
  onConsent,
}: {
  donor: Donor;
  marketingConsent: boolean;
  errors: Record<string, string>;
  onDonor: (patch: Partial<Donor>) => void;
  onConsent: (consent: boolean) => void;
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

      {/* Marketing / data consent: optional, unticked by default. */}
      <section aria-label="Keeping in touch" className="space-y-3">
        <Checkbox checked={marketingConsent} onChange={onConsent}>
          <strong>Keep me updated.</strong> I&apos;d like to hear from {siteConfig.name} by email
          about news, events and appeals. I can unsubscribe at any time.
        </Checkbox>
        <p className="text-sm text-primary-200">
          We use your details to process your donation and send your receipt. We never sell or share
          your information.
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
