'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DashboardEvent } from '@/lib/dashboard/types';
import { preparePoster } from '@/lib/events/poster';
import { useDashboardApi } from '../dashboard-api-provider';
import { Field, Input, Panel } from '../ui';
import type { Change } from './details-fields';

/** Poster upload (resized in the browser, stored in Supabase Storage) and its description. */
export function PosterFields({
  draft,
  errors,
  onChange,
}: {
  draft: DashboardEvent;
  errors: Record<string, string>;
  onChange: Change;
}) {
  const api = useDashboardApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const image = draft.image;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const { blob, width, height } = await preparePoster(file);
      const { src } = await api.events.uploadPoster(blob, draft.id || draft.title || 'poster');
      onChange({ image: { src, width, height, alt: image?.alt || `${draft.title} poster` } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload the poster.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Poster">
      <div className="space-y-4 p-5">
        {image && (
          <Image
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            unoptimized
            className="h-auto w-40 border border-neutral-200"
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center gap-2 border border-primary-500 px-4 py-2 font-label text-sm font-bold text-primary-500 uppercase focus-within:outline-2 focus-within:outline-secondary-500 hover:bg-primary-50">
            {busy ? 'Uploading…' : image ? 'Replace poster' : 'Upload poster'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = '';
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          {image && (
            <Button variant="ghost" size="sm" onClick={() => onChange({ image: undefined })}>
              Remove poster
            </Button>
          )}
        </div>
        <p className="text-sm text-neutral-500">
          JPG, PNG or WebP. Resized to 1000px wide before upload; shown at its natural shape.
        </p>
        {error && <p className="text-sm text-error-700">{error}</p>}
        {image && (
          <Field
            label="Poster description"
            hint="For people using screen readers: what the poster shows."
            error={errors['image.alt']}
          >
            <Input
              value={image.alt}
              onChange={(e) => onChange({ image: { ...image, alt: e.target.value } })}
            />
          </Field>
        )}
      </div>
    </Panel>
  );
}
