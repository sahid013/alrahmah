'use client';

import Image from 'next/image';
import { useId, useRef, useState, type DragEvent } from 'react';
import { DownloadIcon, TrashIcon } from '@/components/icons';
import { isRenderableImage } from '@/lib/dashboard/campaigns';
import { IMAGE_TYPES, MAX_UPLOAD_MB } from '@/lib/dashboard/resize-image';
import { cn } from '@/lib/utils/cn';
import { useDashboardApi } from './dashboard-api-provider';

/**
 * Image picker with drag-and-drop. Uploads through `DashboardApi.media.uploadImage` and reports
 * the stored URL via `onChange` (empty string when removed).
 */
export function ImageUpload({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (src: string) => void;
  error?: string;
  hint?: string;
}) {
  const api = useDashboardApi();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const message = uploadError ?? error;

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setUploadError(undefined);
    try {
      onChange(await api.media.uploadImage(file));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void upload(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <span className="mb-1.5 block font-label text-xs font-bold tracking-[0.12em] text-primary-900 uppercase">
        {label}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-4 border border-dashed p-4 transition-colors sm:flex-row',
          over ? 'border-secondary-500 bg-secondary-50' : 'border-neutral-300 bg-neutral-50',
          message && 'border-error-700',
        )}
      >
        <div className="relative size-28 shrink-0 overflow-hidden border border-neutral-200 bg-white">
          {value && isRenderableImage(value) ? (
            <Image src={value} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-xs text-neutral-400">
              No image
            </span>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-neutral-600">
            {busy ? 'Uploading…' : 'Drag an image here, or'}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <label
              htmlFor={inputId}
              className={cn(
                'inline-flex h-10 cursor-pointer items-center gap-2 border border-primary-500 bg-white px-4 font-label text-sm font-bold text-primary-500 uppercase transition-colors hover:bg-primary-500 hover:text-white',
                busy && 'pointer-events-none opacity-50',
              )}
            >
              <DownloadIcon className="size-4 rotate-180" />
              {value ? 'Replace image' : 'Choose image'}
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex h-10 items-center gap-2 px-3 font-label text-sm font-bold text-primary-500 uppercase hover:text-error-700"
              >
                <TrashIcon className="size-4" />
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <p className="mt-2 text-xs text-neutral-400">
            {hint ?? `JPG, PNG or WebP, up to ${MAX_UPLOAD_MB} MB.`}
          </p>
        </div>
      </div>
      {message && (
        <p role="alert" className="mt-1 text-sm text-error-700">
          {message}
        </p>
      )}
    </div>
  );
}
