'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { todayAtMasjid } from '@/lib/events/calendar';
import {
  embedUrl,
  khutbahEntrySchema,
  watchUrl,
  youtubeVideoId,
  type KhutbahEntry,
} from '@/lib/khutbahs/types';
import { splitKhutbahTitle } from '@/lib/khutbahs/youtube';
import { useDashboardApi } from '../dashboard-api-provider';
import { Field, Input } from '../ui';

type Errors = Partial<Record<'link' | 'title' | 'speaker' | 'date', string>>;

/** Title and channel of a public video, via YouTube's oEmbed endpoint (no key, CORS-enabled). */
async function fetchVideoTitle(videoId: string, signal: AbortSignal): Promise<string | null> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl(videoId))}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  return typeof data === 'object' && data && 'title' in data && typeof data.title === 'string'
    ? data.title
    : null;
}

/**
 * Post (or edit) one khutbah: paste a YouTube link and the title and speaker fill in from the
 * video (titles like "Topic | Khutbah by Ustadh Name"), with a live player preview. Everything
 * stays editable. `initial` switches it to editing that entry.
 */
export function KhutbahForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: KhutbahEntry;
  onSaved: (entry: KhutbahEntry) => void;
  onCancel?: () => void;
}) {
  const api = useDashboardApi();
  const [link, setLink] = useState(initial ? watchUrl(initial.videoId) : '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [speaker, setSpeaker] = useState(initial?.speaker ?? '');
  const [date, setDate] = useState(initial?.date ?? todayAtMasjid());
  // Once someone types a title or speaker, a new link no longer overwrites it.
  const [edited, setEdited] = useState(Boolean(initial));
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'failed'>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const videoId = youtubeVideoId(link);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  /** New link: fill the title and speaker from the video, unless they were typed by hand. */
  const changeLink = (value: string) => {
    setLink(value);
    const id = youtubeVideoId(value);
    if (id === videoId) return;
    pending.current?.abort();
    if (!id || edited) return setLookup('idle');
    const controller = new AbortController();
    pending.current = controller;
    setLookup('loading');
    fetchVideoTitle(id, controller.signal)
      .then((raw) => {
        if (!raw) return setLookup('failed');
        const parts = splitKhutbahTitle(raw);
        setTitle(parts.title);
        setSpeaker(parts.speaker ?? '');
        setLookup('idle');
      })
      .catch(() => !controller.signal.aborted && setLookup('failed'));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaveError(undefined);
    const result = khutbahEntrySchema.safeParse({
      videoId: videoId ?? '',
      title,
      speaker: speaker.trim() || undefined,
      date,
    });
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] === 'videoId' ? 'link' : (issue.path[0] as keyof Errors);
        next[key] ??= issue.message;
      }
      return setErrors(next);
    }
    setErrors({});
    setSaving(true);
    try {
      onSaved(await api.khutbahs.save(result.data));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-6 p-5 lg:grid-cols-[1fr_minmax(0,26rem)]"
    >
      <div className="space-y-5">
        <Field
          label="YouTube link"
          hint={
            lookup === 'loading'
              ? 'Getting the title from YouTube…'
              : lookup === 'failed'
                ? 'Couldn’t read the title from YouTube; type it below.'
                : 'Paste the video’s link, e.g. https://youtu.be/…'
          }
          error={
            errors.link ?? (link.trim() && !videoId ? 'That isn’t a YouTube video link' : undefined)
          }
        >
          <Input
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => changeLink(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={Boolean(initial)}
            required
          />
        </Field>
        <Field label="Title" error={errors.title}>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setEdited(true);
            }}
            placeholder="e.g. Be an Ambassador for Islam"
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Speaker" hint="Optional" error={errors.speaker}>
            <Input
              value={speaker}
              onChange={(e) => {
                setSpeaker(e.target.value);
                setEdited(true);
              }}
              placeholder="e.g. Ustadh Hussain Sattar"
            />
          </Field>
          <Field label="Date delivered" error={errors.date}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Publish khutbah'}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {saveError && <span className="text-error-700">{saveError}</span>}
        </div>
      </div>

      {/* Preview of the player as visitors will see it. */}
      <div>
        <p className="mb-1.5 font-label text-xs font-bold tracking-[0.12em] text-primary-900 uppercase">
          Preview
        </p>
        <div className="relative aspect-video border border-neutral-200 bg-neutral-50">
          {videoId ? (
            <iframe
              key={videoId}
              src={embedUrl(videoId)}
              title="Khutbah video preview"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-neutral-400">
              The video appears here once you paste a link.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
