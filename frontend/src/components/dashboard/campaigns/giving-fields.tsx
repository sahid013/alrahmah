'use client';

import type { Campaign } from '@/lib/dashboard/types';
import { CAUSE_ICONS, type Giving } from '@/lib/donations/types';
import { chargeTimes, dateRange } from '@/lib/giving/schedule';
import { Field, Input, Panel, Select } from '../ui';

const ICON_LABELS: Record<(typeof CAUSE_ICONS)[number], string> = {
  mosque: 'Masjid',
  people: 'People',
  moon: 'Moon (nights)',
  sun: 'Sun (days)',
  calendar: 'Calendar (weekly)',
};

const num = (value: string) => (value === '' ? Number.NaN : Number(value));

/** Defaults when switching how a campaign is given to. */
const STARTERS: Record<Giving['kind'], Giving> = {
  regular: { kind: 'regular' },
  'per-person': { kind: 'per-person', unitAmount: 5, maxPeople: 20 },
  daily: {
    kind: 'daily',
    firstDate: new Date().toISOString().slice(0, 10),
    count: 10,
    unit: 'night',
    chargeTime: '21:00',
    periodLabel: 'the last 10 nights of Ramadan',
    presets: [1, 5, 10, 20],
  },
  jumuah: { kind: 'jumuah', chargeTime: '12:00', presets: [5, 10, 20] },
};

/**
 * "How people give": the form donors see for this cause. Standard (one-off / weekly / monthly),
 * per person (e.g. Fitrana: £ × people), daily (one payment each night/day between two dates,
 * e.g. the last 10 nights) or every Friday (Jumu'ah giving, until the donor cancels). Errors are
 * keyed by zod path ("giving.firstDate").
 */
export function GivingFields({
  draft,
  errors,
  onChange,
}: {
  draft: Campaign;
  errors: Record<string, string>;
  onChange: (patch: Partial<Campaign>) => void;
}) {
  const g = draft.giving;
  const set = (patch: Partial<Giving>) => onChange({ giving: { ...g, ...patch } as Giving });
  const err = (k: string) => errors[`giving.${k}`];

  let schedule = '';
  if (g.kind === 'daily') {
    try {
      schedule = dateRange(chargeTimes(g));
    } catch {
      schedule = '';
    }
  }

  return (
    <Panel title="How people give">
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <Field label="Donation form" hint="What donors fill in for this cause.">
          <Select
            value={g.kind}
            onChange={(e) => onChange({ giving: STARTERS[e.target.value as Giving['kind']] })}
          >
            <option value="regular">Standard: one-off, weekly or monthly</option>
            <option value="per-person">Per person: amount × number of people (one-off)</option>
            <option value="daily">Daily: once each night or day between two dates</option>
            <option value="jumuah">Every Friday: weekly until the donor cancels</option>
          </Select>
        </Field>
        <Field label="Icon" hint="Shown on the Select your cause page.">
          <Select
            value={draft.icon ?? ''}
            onChange={(e) => onChange({ icon: (e.target.value || undefined) as Campaign['icon'] })}
          >
            <option value="">No icon</option>
            {CAUSE_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {ICON_LABELS[icon]}
              </option>
            ))}
          </Select>
        </Field>

        {g.kind === 'per-person' && (
          <>
            <Field label="Amount per person (£)" error={err('unitAmount')}>
              <Input
                type="number"
                min={0.5}
                step="0.01"
                value={Number.isNaN(g.unitAmount) ? '' : g.unitAmount}
                onChange={(e) => set({ unitAmount: num(e.target.value) })}
                className="font-ui"
              />
            </Field>
            <Field label="Most people per donation" error={err('maxPeople')}>
              <Input
                type="number"
                min={1}
                step="1"
                value={Number.isNaN(g.maxPeople) ? '' : g.maxPeople}
                onChange={(e) => set({ maxPeople: num(e.target.value) })}
                className="font-ui"
              />
            </Field>
          </>
        )}

        {g.kind === 'jumuah' && (
          <>
            <Field
              label="Time each Friday's payment is taken (UK)"
              hint="Nothing is taken at sign-up; the first payment is the coming Friday."
              error={err('chargeTime')}
            >
              <Input
                type="time"
                value={g.chargeTime}
                onChange={(e) => set({ chargeTime: e.target.value })}
              />
            </Field>
            <Field
              label="Suggested amounts each Friday (£)"
              hint="Up to four, separated by commas. Donors can also enter their own."
              error={err('presets')}
            >
              <Input
                defaultValue={g.presets.join(', ')}
                onChange={(e) =>
                  set({
                    presets: e.target.value
                      .split(',')
                      .map((x) => Number(x.trim()))
                      .filter((x) => Number.isFinite(x) && x > 0),
                  })
                }
                className="font-ui"
              />
            </Field>
          </>
        )}

        {g.kind === 'daily' && (
          <>
            <Field label="Taken each" error={err('unit')}>
              <Select
                value={g.unit}
                onChange={(e) => set({ unit: e.target.value as 'night' | 'day' })}
              >
                <option value="night">Night</option>
                <option value="day">Day</option>
              </Select>
            </Field>
            <Field
              label={g.unit === 'night' ? 'First night (evening of)' : 'First day'}
              hint="Update this each year once the date is confirmed."
              error={err('firstDate')}
            >
              <Input
                type="date"
                value={g.firstDate}
                onChange={(e) => set({ firstDate: e.target.value })}
              />
            </Field>
            <Field label={`Number of ${g.unit}s`} error={err('count')}>
              <Input
                type="number"
                min={1}
                max={30}
                step="1"
                value={Number.isNaN(g.count) ? '' : g.count}
                onChange={(e) => set({ count: num(e.target.value) })}
                className="font-ui"
              />
            </Field>
            <Field label="Time each payment is taken (UK)" error={err('chargeTime')}>
              <Input
                type="time"
                value={g.chargeTime}
                onChange={(e) => set({ chargeTime: e.target.value })}
              />
            </Field>
            <Field
              label="Described as"
              hint="Completes “…on each of …”, e.g. “the last 10 nights of Ramadan”."
              error={err('periodLabel')}
              className="sm:col-span-2"
            >
              <Input value={g.periodLabel} onChange={(e) => set({ periodLabel: e.target.value })} />
            </Field>
            <Field
              label={`Suggested amounts each ${g.unit} (£)`}
              hint="Up to four, separated by commas."
              error={err('presets')}
              className="sm:col-span-2"
            >
              <Input
                defaultValue={g.presets.join(', ')}
                onChange={(e) =>
                  set({
                    presets: e.target.value
                      .split(',')
                      .map((x) => Number(x.trim()))
                      .filter((x) => Number.isFinite(x) && x > 0),
                  })
                }
                className="font-ui"
              />
            </Field>
            {schedule && (
              <p className="text-sm text-neutral-600 sm:col-span-2">
                Payments: <strong className="font-ui">{schedule}</strong>. The cause closes by
                itself after the last {g.unit}.
              </p>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
