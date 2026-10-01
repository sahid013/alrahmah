'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { GripIcon, PencilIcon, PlusIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { moveId, raisedByCampaign } from '@/lib/dashboard/campaigns';
import type { Campaign, Donation } from '@/lib/dashboard/types';
import { trackerLabel } from '@/lib/donations/format';
import { cn } from '@/lib/utils/cn';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { Badge, EmptyState, gbp, iconButton, LoadingRows, Panel, td, th } from '../ui';

const STATUS_TONE = { active: 'success', draft: 'warning', archived: 'neutral' } as const;

/** All campaigns in public display order. Drag a row's handle (or use arrow keys on it) to reorder. */
export function CampaignList() {
  const { data, reload } = useDashboardQuery(
    async (a) => ({
      campaigns: await a.campaigns.list(),
      donations: await a.donations.list({ status: 'succeeded' }),
    }),
    [],
  );

  if (!data) return <LoadingRows />;
  return (
    <SortableCampaigns campaigns={data.campaigns} donations={data.donations} onSaved={reload} />
  );
}

function SortableCampaigns({
  campaigns,
  donations,
  onSaved,
}: {
  campaigns: Campaign[];
  donations: Donation[];
  onSaved: () => void;
}) {
  const api = useDashboardApi();
  const raised = raisedByCampaign(donations);
  const byId = new Map(campaigns.map((c) => [c.id, c]));
  const savedIds = campaigns.map((c) => c.id);

  // Local order: follows the saved order until the user moves something, then shows their
  // order immediately (optimistic) while it saves.
  const [ids, setIds] = useState(savedIds);
  const [synced, setSynced] = useState(campaigns);
  if (synced !== campaigns) {
    setSynced(campaigns);
    setIds(savedIds);
  }
  const [dragging, setDragging] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const commit = async (next: string[], moved: string) => {
    setIds(next);
    if (next.join() === savedIds.join()) return;
    setAnnouncement(
      `${byId.get(moved)?.title} moved to position ${next.indexOf(moved) + 1} of ${next.length}.`,
    );
    await api.campaigns.reorder(next);
    onSaved();
  };

  /** Row index under the pointer, from the row midpoints (ignoring the dragged row). */
  const indexAt = (clientY: number, id: string) => {
    const rows = [...(bodyRef.current?.querySelectorAll<HTMLElement>('tr[data-id]') ?? [])].filter(
      (r) => r.dataset.id !== id,
    );
    return rows.filter((r) => {
      const box = r.getBoundingClientRect();
      return clientY > box.top + box.height / 2;
    }).length;
  };

  // While dragging, follow the pointer on the window: reordering rows moves the handle in the
  // DOM, which would drop pointer capture on the element itself.
  const idsRef = useRef(ids);
  useEffect(() => {
    idsRef.current = ids;
  });
  useEffect(() => {
    if (!dragging) return;
    const move = (e: globalThis.PointerEvent) => {
      const next = moveId(idsRef.current, dragging, indexAt(e.clientY, dragging));
      if (next.join() !== idsRef.current.join()) setIds(next);
    };
    const end = () => {
      setDragging(undefined);
      void commit(idsRef.current, dragging);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-bind only when a drag starts/ends
  }, [dragging]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const delta = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const to = ids.indexOf(id) + delta;
    if (to < 0 || to >= ids.length) return;
    void commit(moveId(ids, id, to), id);
  };

  return (
    <Panel
      title={`${campaigns.length} campaigns`}
      actions={
        <ButtonLink href="/dashboard/campaigns/new" size="sm">
          <PlusIcon className="size-4" />
          New campaign
        </ButtonLink>
      }
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {campaigns.length === 0 ? (
        <EmptyState>No campaigns yet. Create the first one.</EmptyState>
      ) : (
        <div className="relative overflow-x-auto">
          <table className={cn('w-full min-w-208', dragging && 'cursor-grabbing select-none')}>
            <thead>
              <tr>
                <th className={cn(th, 'w-16')}>
                  <span className="sr-only">Reorder</span>
                </th>
                <th className={th}>Campaign</th>
                <th className={th}>Status</th>
                <th className={th}>Tracker</th>
                <th className={`${th} text-right`}>Raised online</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody ref={bodyRef}>
              {ids.map((id, i) => {
                const c = byId.get(id);
                if (!c) return null;
                const active = dragging === id;
                return (
                  <tr
                    key={id}
                    data-id={id}
                    className={cn(
                      'transition-colors',
                      active
                        ? 'relative z-10 bg-secondary-50 outline-2 -outline-offset-2 outline-secondary-500'
                        : 'hover:bg-primary-50/50',
                    )}
                  >
                    <td className={td}>
                      <button
                        type="button"
                        aria-label={`Reorder ${c.title}, position ${i + 1} of ${ids.length}. Drag, or use the up and down arrow keys.`}
                        onPointerDown={(e) => onPointerDown(e, id)}
                        onKeyDown={(e) => onKeyDown(e, id)}
                        className={cn(
                          'inline-flex size-10 touch-none items-center justify-center text-neutral-400 transition-colors hover:bg-primary-50 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500',
                          active ? 'cursor-grabbing text-primary-500' : 'cursor-grab',
                        )}
                      >
                        <GripIcon className="size-5" />
                      </button>
                    </td>
                    <td className={td}>
                      <Link
                        href={`/dashboard/campaigns/${c.id}`}
                        draggable={false}
                        className="font-bold text-primary-900 hover:text-primary-500"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className={td}>
                      <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                    </td>
                    <td className={`${td} text-xs`}>{c.tracker ? trackerLabel(c.tracker) : '—'}</td>
                    <td className={`${td} text-right font-ui tabular-nums`}>
                      {gbp(raised.get(c.id) ?? 0, 0)}
                    </td>
                    <td className={`${td} text-right`}>
                      <Link
                        href={`/dashboard/campaigns/${c.id}`}
                        className={iconButton}
                        aria-label={`Edit ${c.title}`}
                      >
                        <PencilIcon className="size-4" />
                      </Link>
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
