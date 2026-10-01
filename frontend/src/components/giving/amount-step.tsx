import type { DonationProgram } from '@/lib/donations/types';
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  PRESET_AMOUNTS,
  formatGbp,
  type Frequency,
} from '@/lib/giving/types';
import { cn } from '@/lib/utils/cn';
import { Choice, GiveField, GiveSelect, StepTitle } from './fields';

export interface AmountValue {
  campaignId: string;
  frequency: Frequency;
  /** Selected preset, or the typed amount as text. */
  amountText: string;
}

/** Default frequency for a campaign: follows its suggested price (e.g. monthly subscriptions). */
export const defaultFrequency = (program?: DonationProgram): Frequency =>
  program?.price?.period === 'week'
    ? 'weekly'
    : program?.price?.period === 'month'
      ? 'monthly'
      : 'one-off';

const chargeNote: Record<Frequency, (amount: string) => string> = {
  'one-off': (a) => `You'll be charged ${a} once.`,
  weekly: (a) => `You'll be charged ${a} every week until you cancel.`,
  monthly: (a) => `You'll be charged ${a} every month until you cancel.`,
};

export function AmountStep({
  programs,
  value,
  amount,
  errors,
  onChange,
}: {
  programs: DonationProgram[];
  value: AmountValue;
  /** Parsed amount (NaN when empty/invalid). */
  amount: number;
  errors: Record<string, string>;
  onChange: (patch: Partial<AmountValue>) => void;
}) {
  const program = programs.find((p) => p.id === value.campaignId);
  const presets = [
    ...new Set([...(program?.price ? [program.price.amount] : []), ...PRESET_AMOUNTS]),
  ]
    .sort((a, b) => a - b)
    .slice(0, 4);
  const isPreset = presets.some((p) => String(p) === value.amountText);

  return (
    <div className="space-y-10">
      <StepTitle id="step-title">Your donation</StepTitle>

      <fieldset>
        <legend className="mb-3 font-label text-sm font-bold tracking-[0.12em] text-white uppercase">
          How often
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {FREQUENCIES.map((f) => (
            <Choice
              key={f}
              selected={value.frequency === f}
              onClick={() => onChange({ frequency: f })}
              className="font-label text-base tracking-[0.08em] uppercase"
            >
              {FREQUENCY_LABELS[f]}
            </Choice>
          ))}
        </div>
        <p className="mt-3 text-primary-200" aria-live="polite">
          {chargeNote[value.frequency](
            Number.isFinite(amount) && amount > 0 ? formatGbp(amount) : 'this amount',
          )}
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-label text-sm font-bold tracking-[0.12em] text-white uppercase">
          Amount
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {presets.map((p) => (
            <Choice
              key={p}
              selected={value.amountText === String(p)}
              onClick={() => onChange({ amountText: String(p) })}
            >
              {formatGbp(p)}
            </Choice>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="sr-only">Other amount in pounds</span>
          <span
            className={cn(
              'flex h-14 items-center border bg-white/5 transition-colors focus-within:border-secondary-400 focus-within:outline-2 focus-within:outline-secondary-400',
              !isPreset && value.amountText
                ? 'border-secondary-400'
                : 'border-white/15 hover:border-white/30',
              errors.amount && 'border-error-300',
            )}
          >
            <span className="pl-4 font-ui text-lg font-semibold text-primary-200">£</span>
            <input
              inputMode="decimal"
              placeholder="Other amount"
              aria-invalid={!!errors.amount}
              value={isPreset ? '' : value.amountText}
              onChange={(e) => onChange({ amountText: e.target.value.replace(/[^\d.]/g, '') })}
              className="h-full w-full bg-transparent px-2 font-ui text-lg font-semibold text-white tabular-nums outline-none placeholder:font-body placeholder:font-normal placeholder:text-primary-200/60"
            />
          </span>
        </label>
        {errors.amount && <p className="mt-1.5 text-sm text-error-300">{errors.amount}</p>}
      </fieldset>

      <GiveField label="Where it goes" error={errors.campaignId}>
        <GiveSelect
          value={value.campaignId}
          aria-invalid={!!errors.campaignId}
          onChange={(e) => onChange({ campaignId: e.target.value })}
        >
          <option value="">Choose a cause</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </GiveSelect>
      </GiveField>
    </div>
  );
}
