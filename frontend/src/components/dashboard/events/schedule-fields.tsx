'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DashboardEvent } from '@/lib/dashboard/types';
import { formatSchedule, WEEKDAYS, type EventSchedule } from '@/lib/events';
import { Field, Input, Panel, Select } from '../ui';
import type { Change } from './details-fields';

const STARTERS: Record<EventSchedule['kind'], EventSchedule> = {
  once: { kind: 'once', date: new Date().toISOString().slice(0, 10) },
  weekly: { kind: 'weekly', weekday: 'Friday' },
};

/** When it happens: one date, or weekly (with an optional term and skipped dates). */
export function ScheduleFields({
  draft,
  errors,
  onChange,
}: {
  draft: DashboardEvent;
  errors: Record<string, string>;
  onChange: Change;
}) {
  const s = draft.schedule;
  const set = (patch: Partial<EventSchedule>) =>
    onChange({ schedule: { ...s, ...patch } as EventSchedule });
  const err = (k: string) => errors[`schedule.${k}`];
  const [skip, setSkip] = useState('');
  const opt = (v: string) => v || undefined;

  return (
    <Panel title="When">
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <Field label="Happens">
          <Select
            value={s.kind}
            onChange={(e) => {
              const kind = e.target.value as EventSchedule['kind'];
              const { time, startTime, endTime } = s;
              onChange({ schedule: { ...STARTERS[kind], time, startTime, endTime } });
            }}
          >
            <option value="weekly">Every week</option>
            <option value="once">On one date</option>
          </Select>
        </Field>
        {s.kind === 'once' ? (
          <Field label="Date" error={err('date')}>
            <Input type="date" value={s.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
        ) : (
          <>
            <Field label="Day" error={err('weekday')}>
              <Select
                value={s.weekday}
                onChange={(e) => set({ weekday: e.target.value as (typeof WEEKDAYS)[number] })}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Starts" hint="Optional: first week of the term." error={err('from')}>
              <Input
                type="date"
                value={s.from ?? ''}
                onChange={(e) => set({ from: opt(e.target.value) })}
              />
            </Field>
            <Field label="Ends" hint="Optional: last week of the term." error={err('until')}>
              <Input
                type="date"
                value={s.until ?? ''}
                onChange={(e) => set({ until: opt(e.target.value) })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Weeks it doesn't run" hint="Optional, e.g. holidays.">
                <div className="flex gap-2">
                  <Input type="date" value={skip} onChange={(e) => setSkip(e.target.value)} />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!skip}
                    onClick={() => {
                      set({ exceptDates: [...new Set([...(s.exceptDates ?? []), skip])].sort() });
                      setSkip('');
                    }}
                  >
                    Add
                  </Button>
                </div>
              </Field>
              {!!s.exceptDates?.length && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {s.exceptDates.map((d) => (
                    <li key={d}>
                      <button
                        type="button"
                        onClick={() => set({ exceptDates: s.exceptDates!.filter((x) => x !== d) })}
                        className="border border-neutral-300 bg-neutral-50 px-2 py-1 font-ui text-xs text-primary-900 hover:border-error-700 hover:text-error-700"
                        aria-label={`Remove ${d}`}
                      >
                        {d} ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        <Field label="Time" hint="Optional wording, e.g. “After Asr”." error={err('time')}>
          <Input value={s.time ?? ''} onChange={(e) => set({ time: opt(e.target.value) })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" hint="Optional" error={err('startTime')}>
            <Input
              type="time"
              value={s.startTime ?? ''}
              onChange={(e) => set({ startTime: opt(e.target.value) })}
            />
          </Field>
          <Field label="Until" hint="Optional" error={err('endTime')}>
            <Input
              type="time"
              value={s.endTime ?? ''}
              onChange={(e) => set({ endTime: opt(e.target.value) })}
            />
          </Field>
        </div>
        <Field
          label="Shown as"
          hint={`Optional exact wording. Otherwise: “${formatSchedule(s)}”.`}
          error={errors.scheduleLabel}
          className="sm:col-span-2"
        >
          <Input
            value={draft.scheduleLabel ?? ''}
            onChange={(e) => onChange({ scheduleLabel: opt(e.target.value) })}
            placeholder="e.g. Every Friday after Asr"
          />
        </Field>
      </div>
    </Panel>
  );
}
