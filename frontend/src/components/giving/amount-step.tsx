import Link from 'next/link';
import { ChevronIcon } from '@/components/icons';
import type { DailyGiving, DonationProgram } from '@/lib/donations/types';
import { dateRange, formatClock, remainingCharges, unitLabel } from '@/lib/giving/schedule';
import {
  DEFAULT_AMOUNT,
  FREQUENCY_LABELS,
  PRESET_AMOUNTS,
  REGULAR_FREQUENCIES,
  formatGbp,
  type Frequency,
} from '@/lib/giving/types';
import { cn } from '@/lib/utils/cn';
import { Choice, StepTitle } from './fields';

export interface AmountValue {
  frequency: Frequency;
  /** Selected preset, or the typed amount as text. */
  amountText: string;
  /** Per-person causes (Fitrana): how many people. */
  people: number;
}

/** Starting values for a cause's form. */
export function initialAmount(program: DonationProgram): AmountValue {
  const g = program.giving;
  if (g.kind === 'per-person') return { frequency: 'one-off', amountText: '', people: 1 };
  if (g.kind === 'daily')
    return { frequency: 'daily', amountText: String(g.presets[1] ?? g.presets[0]), people: 1 };
  const period = program.price?.period;
  return {
    frequency: period === 'week' ? 'weekly' : period === 'month' ? 'monthly' : 'one-off',
    amountText: String(program.price?.amount ?? DEFAULT_AMOUNT),
    people: 1,
  };
}

/** The amount to charge (per payment) for the current form values; NaN when not valid yet. */
export function amountFor(program: DonationProgram, value: AmountValue): number {
  if (program.giving.kind === 'per-person') return program.giving.unitAmount * value.people;
  return value.amountText === '' ? Number.NaN : Number(value.amountText);
}

const chargeNote: Record<'one-off' | 'weekly' | 'monthly', (amount: string) => string> = {
  'one-off': (a) => `You'll be charged ${a} once.`,
  weekly: (a) => `You'll be charged ${a} every week until you cancel.`,
  monthly: (a) => `You'll be charged ${a} every month until you cancel.`,
};

const legendClass = 'mb-3 font-label text-sm font-bold tracking-[0.12em] text-white uppercase';

/**
 * Step 1, customised to the cause (the cause itself is chosen on /donate):
 *  - regular (Masjid Expansion): one-off / weekly / monthly + amount.
 *  - per-person (Fitrana): number of people; the total is £ per person × people.
 *  - daily (Last 10 Nights, Dhul Hijjah): amount per night/day, with the dates it's taken.
 */
export function AmountStep({
  program,
  canChangeCause = true,
  value,
  amount,
  errors,
  onChange,
}: {
  program: DonationProgram;
  canChangeCause?: boolean;
  value: AmountValue;
  /** Parsed amount per payment (NaN when empty/invalid). */
  amount: number;
  errors: Record<string, string>;
  onChange: (patch: Partial<AmountValue>) => void;
}) {
  const g = program.giving;
  const shown = Number.isFinite(amount) && amount > 0 ? formatGbp(amount) : 'this amount';

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-primary-200">
          <span>
            Giving to <strong className="text-white">{program.title}</strong>
          </span>
          {canChangeCause && (
            <Link
              href="/donate"
              className="inline-flex items-center gap-1 font-label text-xs font-bold tracking-[0.15em] text-secondary-300 uppercase hover:text-white"
            >
              <ChevronIcon direction="left" className="size-3" />
              Change cause
            </Link>
          )}
        </p>
        <StepTitle id="step-title">Your donation</StepTitle>
      </div>

      {g.kind === 'regular' && (
        <>
          <fieldset>
            <legend className={legendClass}>How often</legend>
            <div className="grid grid-cols-3 gap-3">
              {REGULAR_FREQUENCIES.map((f) => (
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
              {value.frequency !== 'daily' && chargeNote[value.frequency](shown)}
            </p>
          </fieldset>
          <AmountPicker
            presets={presetsFor(program)}
            value={value.amountText}
            error={errors.amount}
            onChange={(amountText) => onChange({ amountText })}
          />
        </>
      )}

      {g.kind === 'per-person' && (
        <fieldset>
          <legend className={legendClass}>How many people are you paying for?</legend>
          <div className="flex items-center gap-3">
            <Choice
              selected={false}
              aria-label="One fewer person"
              disabled={value.people <= 1}
              onClick={() => onChange({ people: Math.max(1, value.people - 1) })}
              className="w-12 disabled:opacity-40"
            >
              −
            </Choice>
            <input
              inputMode="numeric"
              aria-label="Number of people"
              aria-invalid={!!errors.people}
              value={value.people}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ''));
                onChange({ people: Math.min(g.maxPeople, Math.max(1, n || 1)) });
              }}
              className="h-12 w-20 border border-white/15 bg-white/5 text-center font-ui text-lg font-semibold text-white tabular-nums focus:border-secondary-400 focus:outline-2 focus:outline-secondary-400"
            />
            <Choice
              selected={false}
              aria-label="One more person"
              disabled={value.people >= g.maxPeople}
              onClick={() => onChange({ people: Math.min(g.maxPeople, value.people + 1) })}
              className="w-12 disabled:opacity-40"
            >
              +
            </Choice>
          </div>
          {errors.people && <p className="mt-1.5 text-sm text-error-300">{errors.people}</p>}
          <p
            className="mt-6 border-y border-white/10 py-4 text-lg text-primary-100"
            aria-live="polite"
          >
            <span className="font-ui">
              {formatGbp(g.unitAmount)} × {value.people} {value.people === 1 ? 'person' : 'people'}
            </span>{' '}
            = <strong className="font-ui text-2xl text-secondary-300">{formatGbp(amount)}</strong>
          </p>
          <p className="mt-3 text-primary-200">
            A one-off payment of {formatGbp(g.unitAmount)} for each person, to be given before the
            Eid prayer.
          </p>
        </fieldset>
      )}

      {g.kind === 'daily' && (
        <>
          <AmountPicker
            legend={`Amount each ${g.unit}`}
            presets={g.presets}
            value={value.amountText}
            error={errors.amount}
            onChange={(amountText) => onChange({ amountText })}
          />
          <DailySummary giving={g} amount={amount} />
        </>
      )}
    </div>
  );
}

function presetsFor(program: DonationProgram) {
  return [...new Set([...(program.price ? [program.price.amount] : []), ...PRESET_AMOUNTS])]
    .sort((a, b) => a - b)
    .slice(0, 4);
}

function DailySummary({ giving, amount }: { giving: DailyGiving; amount: number }) {
  const charges = remainingCharges(giving);
  const n = charges.length;
  const time = formatClock(giving.chargeTime);
  const valid = Number.isFinite(amount) && amount > 0;
  return (
    <div className="space-y-3 border-y border-white/10 py-5" aria-live="polite">
      <p className="text-lg text-primary-100">
        {valid ? (
          <>
            <strong className="font-ui text-white">{formatGbp(amount)}</strong> on each of{' '}
          </>
        ) : (
          'A donation on each of '
        )}
        {n === giving.count ? giving.periodLabel : `the ${n} remaining ${unitLabel(giving, n)}`}{' '}
        <span className="font-ui whitespace-nowrap">({dateRange(charges)})</span>
        {valid && (
          <>
            : <strong className="font-ui text-secondary-300">{formatGbp(amount * n)}</strong> in
            total
          </>
        )}
        .
      </p>
      <p className="text-primary-200">
        Nothing is taken today. Your card is saved securely and charged once each {giving.unit} at{' '}
        {time} (UK time), then it stops by itself after the last {giving.unit}.
      </p>
    </div>
  );
}

/** Preset tiles + "Other amount" (pounds). */
function AmountPicker({
  legend = 'Amount',
  presets,
  value,
  error,
  onChange,
}: {
  legend?: string;
  presets: number[];
  value: string;
  error?: string;
  onChange: (amountText: string) => void;
}) {
  const isPreset = presets.some((p) => String(p) === value);
  return (
    <fieldset>
      <legend className={legendClass}>{legend}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((p) => (
          <Choice key={p} selected={value === String(p)} onClick={() => onChange(String(p))}>
            {formatGbp(p)}
          </Choice>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Other amount in pounds</span>
        <span
          className={cn(
            'flex h-12 items-center border bg-white/5 transition-colors focus-within:border-secondary-400 focus-within:outline-2 focus-within:outline-secondary-400',
            !isPreset && value ? 'border-secondary-400' : 'border-white/15 hover:border-white/30',
            error && 'border-error-300',
          )}
        >
          <span className="pl-4 font-ui text-lg font-semibold text-primary-200">£</span>
          <input
            inputMode="decimal"
            placeholder="Other amount"
            aria-invalid={!!error}
            value={isPreset ? '' : value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
            className="h-full w-full bg-transparent px-2 font-ui text-lg font-semibold text-white tabular-nums outline-none placeholder:font-body placeholder:font-normal placeholder:text-primary-200/60"
          />
        </span>
      </label>
      {error && <p className="mt-1.5 text-sm text-error-300">{error}</p>}
    </fieldset>
  );
}
