'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { calculatedDay, isFriday, sameTimes, validateDay } from '@/lib/dashboard/prayer';
import {
  hasJamaah,
  PRAYER_LABELS,
  PRAYERS,
  type PrayerDay,
  type PrayerKey,
} from '@/lib/dashboard/types';
import { formatMonth, monthGrid, shiftMonth, todayAtMasjid } from '@/lib/events/calendar';
import { addDaysIso } from '@/lib/events/schedule';
import { formatHijriDate, formatLongDate } from '@/lib/prayer-times';
import { cn } from '@/lib/utils/cn';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { Badge, Field, iconButton, Input, LoadingRows, Panel, Textarea } from '../ui';
import { asDate, WEEKDAYS } from './dates';

/** Shown in the month grid (sunrise is in the editor only). */
const GRID_PRAYERS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Calendar editor for the published prayer timetable. Days without a stored override show the
 * calculated times; editing a day stores an override. Saves go through `DashboardApi`.
 */
export function PrayerCalendarEditor() {
  const api = useDashboardApi();
  const today = useMemo(() => todayAtMasjid(), []);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [status, setStatus] = useState<string>();

  const weeks = useMemo(() => monthGrid(month, today), [month, today]);
  const gridStart = weeks[0]![0]!.date;
  const gridEnd = weeks.at(-1)!.at(-1)!.date;
  const { data: loadedDays, reload } = useDashboardQuery(
    (a) => a.prayer.listDays(gridStart, gridEnd),
    [gridStart, gridEnd],
  );
  const byDate = useMemo(() => new Map((loadedDays ?? []).map((d) => [d.date, d])), [loadedDays]);

  const stored = byDate.get(selected);
  const [draft, setDraft] = useState<PrayerDay>(() => calculatedDay(selected));
  const baseline = stored ?? calculatedDay(selected);
  const dirty = !sameTimes(draft, baseline);
  const errors = validateDay(draft);
  const hasErrors = Object.keys(errors).length > 0;

  // Load the selected day (or its newly saved version) into the editor. Adjusting state during
  // render, not in an effect, avoids a flash of the previous day's times.
  const loadedKey = `${selected}|${stored?.updatedAt ?? 'calculated'}`;
  const [loaded, setLoaded] = useState(loadedKey);
  if (loaded !== loadedKey) {
    setLoaded(loadedKey);
    setDraft(structuredClone(baseline));
  }

  const gridRef = useRef<HTMLDivElement>(null);

  const select = (date: string) => {
    if (date === selected) return;
    if (dirty && !window.confirm('Discard unsaved changes to this day?')) return;
    setSelected(date);
    setStatus(undefined);
    if (!date.startsWith(month)) setMonth(date.slice(0, 7));
  };

  const onGridKeyDown = (event: KeyboardEvent) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = addDaysIso(selected, delta);
    select(next);
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(),
    );
  };

  const setTime = (key: PrayerKey, field: 'adhan' | 'jamaah', value: string) =>
    setDraft((d) => {
      const times = structuredClone(d.times) as Record<
        PrayerKey,
        { adhan: string; jamaah?: string }
      >;
      if (field === 'jamaah' && !value) delete times[key].jamaah;
      else times[key][field] = value;
      return { ...d, times: times as PrayerDay['times'] };
    });

  const save = async () => {
    await api.prayer.saveDay(draft);
    reload();
    setStatus(`Saved ${formatLongDate(asDate(selected))}.`);
  };

  const resetToCalculated = async () => {
    if (!stored) return setDraft(calculatedDay(selected));
    if (!window.confirm('Remove the custom times for this day and use the calculated times?'))
      return;
    await api.prayer.deleteDay(selected);
    reload();
    setStatus('Reverted to calculated times.');
  };

  // First load only; month changes keep the previous grid visible while fetching.
  if (!loadedDays) return <LoadingRows />;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 min-[1400px]:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]">
      {/* ---------- Calendar ---------- */}
      <Panel className="min-[1400px]:self-start">
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-4">
          <button
            type="button"
            className={iconButton}
            aria-label="Previous month"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronIcon direction="left" className="size-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label="Next month"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronIcon direction="right" className="size-4" />
          </button>
          <h2
            className="ml-1 font-heading text-title-xl tracking-heading text-primary-900 uppercase"
            aria-live="polite"
          >
            {formatMonth(month)}
          </h2>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => select(today)}>
              Today
            </Button>
            <label className="flex items-center gap-2 font-label text-xs font-bold tracking-[0.12em] text-neutral-500 uppercase">
              Go to
              <Input
                type="date"
                value={selected}
                onChange={(e) => e.target.value && select(e.target.value)}
                className="w-auto py-1.5"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 px-4 pt-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 bg-primary-500" />
            Custom times
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-ui text-neutral-400">00:00</span>
            Calculated (grey)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 bg-secondary-500" />
            Jumu&apos;ah set
          </span>
          <span className="ml-auto hidden sm:inline">
            Tip: use the arrow keys to move between days.
          </span>
        </div>

        <div className="relative overflow-x-auto p-4">
          <div
            ref={gridRef}
            role="grid"
            aria-label={`Prayer times, ${formatMonth(month)}`}
            onKeyDown={onGridKeyDown}
            className="min-w-[40rem] border-t border-l border-neutral-200"
          >
            <div role="row" className="grid grid-cols-7">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  role="columnheader"
                  className="border-r border-b border-neutral-200 bg-neutral-50 px-2 py-2 font-label text-[0.65rem] font-bold tracking-[0.15em] text-neutral-500 uppercase"
                >
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week) => (
              <div key={week[0]!.date} role="row" className="grid grid-cols-7">
                {week.map((day) => {
                  const custom = byDate.get(day.date);
                  const shown = custom ?? calculatedDay(day.date);
                  const active = day.date === selected;
                  return (
                    <div
                      key={day.date}
                      role="gridcell"
                      aria-selected={active}
                      className="border-r border-b border-neutral-200"
                    >
                      <button
                        type="button"
                        data-date={day.date}
                        tabIndex={active ? 0 : -1}
                        onClick={() => select(day.date)}
                        aria-label={`${formatLongDate(asDate(day.date))}${custom ? ', custom times' : ', calculated times'}`}
                        className={cn(
                          'relative flex h-full min-h-32 w-full flex-col p-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary-500',
                          !day.inMonth && 'bg-neutral-50 opacity-60',
                          active
                            ? 'bg-secondary-50 ring-2 ring-secondary-500 ring-inset'
                            : 'hover:bg-primary-50',
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span
                            className={cn(
                              'inline-flex size-7 items-center justify-center font-ui text-sm font-semibold',
                              day.isToday ? 'bg-primary-500 text-white' : 'text-primary-900',
                            )}
                          >
                            {day.day}
                          </span>
                          <span className="flex gap-1">
                            {custom?.jumuah?.length ? (
                              <span className="size-2.5 bg-secondary-500" title="Jumu'ah set" />
                            ) : null}
                            {custom && (
                              <span className="size-2.5 bg-primary-500" title="Custom times" />
                            )}
                          </span>
                        </span>
                        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-1.5 font-ui text-[0.7rem] leading-snug">
                          {GRID_PRAYERS.map((p) => {
                            const { adhan, jamaah } = shown.times[p] as {
                              adhan: string;
                              jamaah?: string;
                            };
                            return (
                              <div key={p} className="contents">
                                <dt className="text-neutral-400">{PRAYER_LABELS[p].slice(0, 3)}</dt>
                                <dd
                                  className={cn(
                                    'overflow-hidden whitespace-nowrap tabular-nums',
                                    custom ? 'font-semibold text-primary-700' : 'text-neutral-500',
                                  )}
                                >
                                  {adhan}
                                  {jamaah && (
                                    <span className="hidden text-secondary-700 2xl:inline">
                                      ·{jamaah}
                                    </span>
                                  )}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* ---------- Day editor ---------- */}
      <div className="min-[1400px]:sticky min-[1400px]:top-8 min-[1400px]:self-start">
        <Panel
          title="Edit day"
          actions={stored ? <Badge tone="indigo">Custom</Badge> : <Badge>Calculated</Badge>}
        >
          <div className="space-y-6 p-5">
            <div>
              <p className="font-heading text-title-lg tracking-heading text-primary-900 uppercase">
                {formatLongDate(asDate(selected))}
              </p>
              <p className="mt-1 text-sm text-neutral-500">{formatHijriDate(asDate(selected))}</p>
            </div>

            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left font-label text-[0.65rem] font-bold tracking-[0.12em] text-neutral-500 uppercase">
                  <th className="w-20 pb-2 sm:w-24">Prayer</th>
                  <th className="pb-2">Adhan</th>
                  <th className="pb-2">Jama&apos;ah</th>
                </tr>
              </thead>
              <tbody>
                {PRAYERS.map((p) => {
                  const t = draft.times[p] as { adhan: string; jamaah?: string };
                  const adhanErr = errors[`${p}.adhan`];
                  const jamaahErr = errors[`${p}.jamaah`];
                  return (
                    <tr key={p} className="align-top">
                      <th
                        scope="row"
                        className="py-1.5 pr-3 text-left font-heading text-base tracking-heading text-primary-900 uppercase"
                      >
                        {PRAYER_LABELS[p]}
                      </th>
                      <td className="py-1.5 pr-2">
                        <Input
                          type="time"
                          aria-label={`${PRAYER_LABELS[p]} adhan`}
                          value={t.adhan}
                          onChange={(e) => setTime(p, 'adhan', e.target.value)}
                          aria-invalid={!!adhanErr}
                          className={cn(
                            'px-2 py-1.5 font-ui text-sm',
                            adhanErr && 'border-error-700',
                          )}
                        />
                        {adhanErr && <p className="mt-1 text-xs text-error-700">{adhanErr}</p>}
                      </td>
                      <td className="py-1.5">
                        {hasJamaah(p) ? (
                          <>
                            <Input
                              type="time"
                              aria-label={`${PRAYER_LABELS[p]} jama'ah`}
                              value={t.jamaah ?? ''}
                              onChange={(e) => setTime(p, 'jamaah', e.target.value)}
                              aria-invalid={!!jamaahErr}
                              className={cn(
                                'px-2 py-1.5 font-ui text-sm',
                                jamaahErr && 'border-error-700',
                              )}
                            />
                            {jamaahErr && (
                              <p className="mt-1 text-xs text-error-700">{jamaahErr}</p>
                            )}
                          </>
                        ) : (
                          <span className="block py-2 text-sm text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isFriday(selected) && (
              <fieldset>
                <legend className="mb-2 font-label text-xs font-bold tracking-[0.12em] text-primary-900 uppercase">
                  Jumu&apos;ah times
                </legend>
                <ul className="space-y-2">
                  {(draft.jumuah ?? []).map((time, i) => (
                    <li key={i} className="flex gap-2">
                      <Input
                        type="time"
                        aria-label={`Jumu'ah ${i + 1}`}
                        value={time}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            jumuah: (d.jumuah ?? []).map((x, j) => (j === i ? e.target.value : x)),
                          }))
                        }
                        className="py-1.5 font-ui"
                      />
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={`Remove Jumu'ah ${i + 1}`}
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            jumuah: (d.jumuah ?? []).filter((_, j) => j !== i),
                          }))
                        }
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setDraft((d) => ({ ...d, jumuah: [...(d.jumuah ?? []), '13:30'] }))
                  }
                >
                  <PlusIcon className="size-4" />
                  Add Jumu&apos;ah
                </Button>
              </fieldset>
            )}

            <Field
              label="Note (optional)"
              hint="e.g. “Eid prayer at 8am” — shown with the day’s times."
            >
              <Textarea
                maxLength={200}
                value={draft.note ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value || undefined }))}
                className="min-h-16"
              />
            </Field>

            <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-5">
              <Button onClick={save} disabled={!dirty || hasErrors}>
                Save day
              </Button>
              <Button
                variant="outline"
                onClick={() => setDraft(structuredClone(baseline))}
                disabled={!dirty}
              >
                Discard changes
              </Button>
              <Button variant="ghost" onClick={resetToCalculated}>
                {stored ? 'Use calculated times' : 'Refill calculated'}
              </Button>
            </div>
            {hasErrors ? (
              <p className="text-sm text-error-700">Fix the highlighted times to save.</p>
            ) : (
              dirty && <p className="text-sm text-warning-700">Unsaved changes.</p>
            )}
            <p role="status" className="text-sm text-success-700">
              {status}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
