'use client';

import { useState } from 'react';
import { causeTerms } from '@/components/giving/select-cause';
import { Spinner } from '@/components/ui/spinner';
import { seedDonations } from '@/lib/donations/data';
import { donationsDataSchema } from '@/lib/donations/types';
import { cn } from '@/lib/utils/cn';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { LoadingRows, Panel } from '../ui';

/** The causes the site offers (their forms live in code; only visibility is stored). */
const CAUSES = donationsDataSchema.parse(seedDonations).programs;

/**
 * "Shown on the website": a switch per donation cause. Hidden causes disappear from /donate and
 * /donations and can't be donated to (e.g. keep Fitrana and the 10 nights/days off until Ramadan).
 * With one cause on, Donate buttons go straight to its form. At least one stays on.
 */
export function CauseVisibility() {
  const api = useDashboardApi();
  const { data, reload } = useDashboardQuery((a) => a.causes.list(), []);
  const [pending, setPending] = useState<string>();
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string }>();
  /** Saved changes, shown straight away while the list reloads. */
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const visible = new Map([
    ...(data?.map((c) => [c.id, c.visible] as const) ?? []),
    ...Object.entries(saved),
  ]);
  const isShown = (id: string) => visible.get(id) ?? true;
  const shownCount = CAUSES.filter((c) => isShown(c.id)).length;

  const toggle = async (id: string, title: string, next: boolean) => {
    setPending(id);
    setMessage(undefined);
    try {
      await api.causes.setVisible(id, next);
      setSaved((s) => ({ ...s, [id]: next }));
      setMessage({
        tone: 'ok',
        text: `${title} is now ${next ? 'shown on' : 'hidden from'} the website.`,
      });
      reload();
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setPending(undefined);
    }
  };

  return (
    <Panel title="Shown on the website">
      <p className="px-5 pt-4 text-sm text-neutral-500">
        Choose which causes donors can give to on the Donate page. With only one switched on, Donate
        buttons open its form directly.
      </p>
      {!data ? (
        <LoadingRows />
      ) : (
        <ul className="divide-y divide-neutral-100 px-5 py-2">
          {CAUSES.map((cause) => {
            const on = isShown(cause.id);
            const busy = pending === cause.id;
            const lastOn = on && shownCount === 1;
            return (
              <li key={cause.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-primary-900">{cause.title}</p>
                  <p className="text-sm text-neutral-500">{causeTerms(cause)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {busy && <Spinner className="text-primary-500" />}
                  <span
                    className={cn(
                      'font-label text-xs font-bold tracking-[0.12em] uppercase',
                      on ? 'text-success-700' : 'text-neutral-400',
                    )}
                  >
                    {on ? 'Shown' : 'Hidden'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-busy={busy || undefined}
                    aria-label={`Show ${cause.title} on the website`}
                    title={lastOn ? 'At least one cause must stay on' : undefined}
                    disabled={!!pending || lastOn}
                    onClick={() => void toggle(cause.id, cause.title, !on)}
                    className={cn(
                      'relative h-7 w-12 shrink-0 border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500 disabled:cursor-not-allowed disabled:opacity-50',
                      on
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-neutral-300 bg-neutral-100',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'absolute top-0.5 size-5 bg-white transition-[left] duration-200 motion-reduce:transition-none',
                        on ? 'left-[calc(100%-1.375rem)]' : 'left-0.5 border border-neutral-300',
                      )}
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p role="status" className="px-5 pb-4 text-sm empty:hidden">
        {message && (
          <span className={message.tone === 'ok' ? 'text-success-700' : 'text-error-700'}>
            {message.text}
          </span>
        )}
      </p>
    </Panel>
  );
}
