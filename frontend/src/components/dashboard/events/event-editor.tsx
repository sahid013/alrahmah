'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { EventPosterCard } from '@/components/events/event-poster-card';
import { ChevronIcon, TrashIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { slugify } from '@/lib/dashboard/campaigns';
import { dashboardEventSchema, type DashboardEvent } from '@/lib/dashboard/types';
import { eventScheduleText } from '@/lib/events';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { EmptyState, LoadingRows, PageHeader } from '../ui';
import { DetailsFields } from './details-fields';
import { PosterFields } from './poster-fields';
import { ScheduleFields } from './schedule-fields';

const FRIENDLY_ERRORS: Record<string, string> = {
  id: 'Use lowercase letters, numbers and hyphens only (e.g. seerah-class)',
  title: 'Give the event a title',
  summary: 'Add a short summary',
  'image.alt': 'Describe the poster',
  'schedule.date': 'Pick the date',
};

const newEvent = (order: number): DashboardEvent => ({
  id: '',
  title: '',
  category: 'course',
  schedule: { kind: 'weekly', weekday: 'Friday', time: 'After Asr' },
  summary: '',
  status: 'published',
  order,
});

/** Create (`id` undefined) or edit an event, with a live preview of its card. */
export function EventEditor({ id }: { id?: string }) {
  const { data } = useDashboardQuery(
    async (api) => {
      const events = await api.events.list();
      return { events, event: id ? events.find((e) => e.id === id) : undefined };
    },
    [id],
  );
  if (!data) return <LoadingRows />;
  if (id && !data.event)
    return (
      <EmptyState>
        Event not found.{' '}
        <Link href="/dashboard/events" className="text-primary-500 underline">
          Back to events
        </Link>
      </EmptyState>
    );
  return (
    <EditorForm
      initial={data.event ?? newEvent(data.events.length)}
      isNew={!id}
      takenIds={data.events.filter((e) => e.id !== id).map((e) => e.id)}
    />
  );
}

function EditorForm({
  initial,
  isNew,
  takenIds,
}: {
  initial: DashboardEvent;
  isNew: boolean;
  takenIds: string[];
}) {
  const api = useDashboardApi();
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const change = (patch: Partial<DashboardEvent>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (isNew && patch.title !== undefined) next.id = slugify(patch.title);
      return next;
    });
    setSaved(false);
    const touched = new Set(Object.keys(patch));
    if (isNew && touched.has('title')) touched.add('id');
    setErrors((e) =>
      Object.fromEntries(Object.entries(e).filter(([k]) => !touched.has(k.split('.')[0]!))),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = dashboardEventSchema.safeParse(draft);
    const next: Record<string, string> = {};
    if (!result.success)
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        next[key] ??= FRIENDLY_ERRORS[key] ?? issue.message;
      }
    if (isNew && takenIds.includes(draft.id)) next.id = 'Another event already uses this slug';
    setErrors(next);
    setSaveError(undefined);
    if (!result.success || Object.keys(next).length) return;
    setSaving(true);
    try {
      const savedEvent = await api.events.save(result.data);
      if (isNew) return router.replace(`/dashboard/events/${savedEvent.id}`);
      setDraft(savedEvent);
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${initial.title}”? It disappears from the website.`)) return;
    setDeleting(true);
    try {
      await api.events.remove(initial.id);
      router.push('/dashboard/events');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not delete. Please try again.');
      setDeleting(false);
    }
  };

  const preview = {
    ...draft,
    id: draft.id || 'preview',
    title: draft.title || 'Event title',
    summary: draft.summary || 'Summary',
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 font-label text-xs font-bold tracking-[0.12em] text-primary-500 uppercase hover:text-secondary-700"
      >
        <ChevronIcon direction="left" className="size-3.5" />
        All events
      </Link>
      <PageHeader
        title={isNew ? 'New event' : initial.title}
        actions={
          <>
            {!isNew && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void remove()}
                loading={deleting}
                disabled={saving}
              >
                {!deleting && <TrashIcon className="size-4" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            )}
            <Button type="submit" loading={saving} disabled={deleting}>
              {saving ? 'Saving…' : isNew ? 'Create event' : 'Save changes'}
            </Button>
          </>
        }
      />
      <p role="status" className="text-sm">
        {saved && <span className="text-success-700">Saved. The website is updated.</span>}
        {saveError && <span className="text-error-700">{saveError}</span>}
        {Object.keys(errors).length > 0 && (
          <span className="text-error-700">Please fix the highlighted fields.</span>
        )}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <DetailsFields draft={draft} errors={errors} isNew={isNew} onChange={change} />
          <ScheduleFields draft={draft} errors={errors} onChange={change} />
          <PosterFields draft={draft} errors={errors} onChange={change} />
        </div>
        <aside className="xl:sticky xl:top-8 xl:self-start">
          <p className="mb-3 font-label text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
            Live preview
          </p>
          <div inert className="max-w-80">
            <EventPosterCard event={preview} />
          </div>
          <p className="mt-3 text-sm text-neutral-600">
            <span className="font-bold text-primary-900">{preview.title}</span>
            <br />
            {eventScheduleText(preview)}
          </p>
        </aside>
      </div>
    </form>
  );
}
