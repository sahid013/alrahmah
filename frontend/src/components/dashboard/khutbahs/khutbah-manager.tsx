'use client';

import { useState } from 'react';
import { ExternalIcon, PencilIcon, TrashIcon } from '@/components/icons';
import { Spinner } from '@/components/ui/spinner';
import { watchUrl, type KhutbahEntry } from '@/lib/khutbahs/types';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { Badge, EmptyState, iconButton, LoadingRows, Panel, shortDate, td, th } from '../ui';
import { KhutbahForm } from './khutbah-form';

/** Post form plus the list of posted khutbahs (newest first; the first is "This week"). */
export function KhutbahManager() {
  const api = useDashboardApi();
  const { data, loading, error, reload } = useDashboardQuery((a) => a.khutbahs.list(), []);
  const [editing, setEditing] = useState<KhutbahEntry>();
  // Bumped after each post so the form starts empty again.
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState<string>();

  const saved = (entry: KhutbahEntry) => {
    setNotice(`Saved “${entry.title}”.`);
    setEditing(undefined);
    setFormKey((k) => k + 1);
    reload();
  };

  const [removing, setRemoving] = useState<string>();
  const remove = async (entry: KhutbahEntry) => {
    if (!window.confirm(`Remove “${entry.title}” from the website?`)) return;
    setRemoving(entry.videoId);
    try {
      await api.khutbahs.remove(entry.videoId);
      if (editing?.videoId === entry.videoId) setEditing(undefined);
      setNotice(`Removed “${entry.title}”.`);
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not remove. Please try again.');
    } finally {
      setRemoving(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title={editing ? `Edit: ${editing.title}` : 'Post a khutbah'}>
        <KhutbahForm
          key={editing ? `edit-${editing.videoId}` : `new-${formKey}`}
          initial={editing}
          onSaved={saved}
          onCancel={editing ? () => setEditing(undefined) : undefined}
        />
      </Panel>

      <p role="status" className="text-sm text-success-700 empty:hidden">
        {notice}
      </p>

      <Panel title="Posted khutbahs">
        {error ? (
          <EmptyState>Couldn’t load khutbahs: {error.message}</EmptyState>
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data?.length ? (
          <EmptyState>No khutbahs posted yet. Paste this week’s link above.</EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[40rem]">
              <thead>
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Khutbah</th>
                  <th className={th}>Speaker</th>
                  <th className={`${th} text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((k, i) => (
                  <tr key={k.videoId}>
                    <td className={`${td} font-ui whitespace-nowrap tabular-nums`}>
                      {shortDate(k.date)}
                    </td>
                    <td className={td}>
                      <span className="font-bold text-primary-900">{k.title}</span>
                      {i === 0 && (
                        <span className="ml-2">
                          <Badge tone="sky">This week</Badge>
                        </span>
                      )}
                    </td>
                    <td className={td}>{k.speaker ?? '—'}</td>
                    <td className={td}>
                      <div className="flex justify-end gap-2">
                        <a
                          href={watchUrl(k.videoId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={iconButton}
                          aria-label={`Watch ${k.title} on YouTube (new tab)`}
                        >
                          <ExternalIcon className="size-4" />
                        </a>
                        <button
                          type="button"
                          className={iconButton}
                          onClick={() => {
                            setNotice(undefined);
                            setEditing(k);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          aria-label={`Edit ${k.title}`}
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          onClick={() => void remove(k)}
                          disabled={removing === k.videoId}
                          aria-busy={removing === k.videoId || undefined}
                          aria-label={`Remove ${k.title}`}
                        >
                          {removing === k.videoId ? <Spinner /> : <TrashIcon className="size-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
