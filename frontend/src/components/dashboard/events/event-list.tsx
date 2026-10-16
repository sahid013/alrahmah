'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { moveId } from '@/lib/dashboard/campaigns';
import type { DashboardEvent } from '@/lib/dashboard/types';
import { EVENT_CATEGORIES, eventScheduleText } from '@/lib/events';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { Badge, EmptyState, iconButton, LoadingRows, Panel, td, th } from '../ui';

/** Events table: poster, schedule, category, status; move up/down, edit, delete. */
export function EventList() {
  const api = useDashboardApi();
  const { data, reload } = useDashboardQuery((a) => a.events.list(), []);
  const [pending, setPending] = useState<string>();
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string }>();

  const run = async (id: string, task: () => Promise<void>, ok?: string) => {
    setPending(id);
    setMessage(undefined);
    try {
      await task();
      if (ok) setMessage({ tone: 'ok', text: ok });
      reload();
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Something went wrong.' });
    } finally {
      setPending(undefined);
    }
  };

  const move = (events: DashboardEvent[], id: string, by: number) => {
    const ids = events.map((e) => e.id);
    return run(id, () => api.events.reorder(moveId(ids, id, ids.indexOf(id) + by)));
  };
  const remove = (e: DashboardEvent) =>
    window.confirm(`Delete “${e.title}”? It disappears from the website. This can't be undone.`) &&
    run(e.id, () => api.events.remove(e.id), `Deleted “${e.title}”.`);

  return (
    <Panel
      title={data ? `${data.length} events` : 'Events'}
      actions={
        <ButtonLink href="/dashboard/events/new" size="sm">
          <PlusIcon className="size-4" />
          New event
        </ButtonLink>
      }
    >
      <p role="status" className="px-5 pt-4 text-sm empty:hidden">
        {message && (
          <span className={message.tone === 'ok' ? 'text-success-700' : 'text-error-700'}>
            {message.text}
          </span>
        )}
      </p>
      {!data ? (
        <LoadingRows />
      ) : data.length === 0 ? (
        <EmptyState>No events yet. Create the first one.</EmptyState>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[46rem]">
            <thead>
              <tr>
                <th className={th}>Event</th>
                <th className={th}>Category</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((e, i) => {
                const busy = pending === e.id;
                return (
                  <tr key={e.id}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        {e.image ? (
                          <Image
                            src={e.image.src}
                            alt=""
                            width={40}
                            height={Math.round((40 * e.image.height) / e.image.width)}
                            unoptimized
                            className="h-auto w-10 shrink-0 border border-neutral-200"
                          />
                        ) : (
                          <span className="block h-14 w-10 shrink-0 bg-primary-100" />
                        )}
                        <span className="min-w-0">
                          <Link
                            href={`/dashboard/events/${e.id}`}
                            className="block font-bold text-primary-900 hover:text-primary-500"
                          >
                            {e.title}
                          </Link>
                          <span className="text-xs">{eventScheduleText(e)}</span>
                        </span>
                      </div>
                    </td>
                    <td className={td}>{EVENT_CATEGORIES[e.category]}</td>
                    <td className={td}>
                      <Badge tone={e.status === 'published' ? 'success' : 'neutral'}>
                        {e.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <div className="inline-flex items-center gap-2">
                        {busy && <Spinner className="text-primary-500" />}
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Move ${e.title} up`}
                          disabled={i === 0 || !!pending}
                          onClick={() => void move(data, e.id, -1)}
                        >
                          <ChevronIcon direction="left" className="size-4 rotate-90" />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Move ${e.title} down`}
                          disabled={i === data.length - 1 || !!pending}
                          onClick={() => void move(data, e.id, 1)}
                        >
                          <ChevronIcon direction="right" className="size-4 rotate-90" />
                        </button>
                        <Link
                          href={`/dashboard/events/${e.id}`}
                          className={iconButton}
                          aria-label={`Edit ${e.title}`}
                        >
                          <PencilIcon className="size-4" />
                        </Link>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Delete ${e.title}`}
                          disabled={!!pending}
                          onClick={() => void remove(e)}
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
