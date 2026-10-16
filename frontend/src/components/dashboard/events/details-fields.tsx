'use client';

import type { DashboardEvent } from '@/lib/dashboard/types';
import { EVENT_CATEGORIES } from '@/lib/events';
import { Field, Input, Panel, Select, Textarea } from '../ui';

export type Change = (patch: Partial<DashboardEvent>) => void;

/** Title, slug, category, status and the text shown on cards and the event page. */
export function DetailsFields({
  draft,
  errors,
  isNew,
  onChange,
}: {
  draft: DashboardEvent;
  errors: Record<string, string>;
  isNew: boolean;
  onChange: Change;
}) {
  const text = (key: 'speaker' | 'location' | 'description' | 'href') => ({
    value: draft[key] ?? '',
    onChange: (e: { target: { value: string } }) =>
      onChange({ [key]: e.target.value || undefined }),
  });
  return (
    <Panel title="Details">
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <Field label="Title" error={errors.title} className="sm:col-span-2">
          <Input value={draft.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field
          label="Slug"
          hint={
            isNew ? 'Made from the title; the event page is /events/<slug>.' : "Can't be changed."
          }
          error={errors.id}
        >
          <Input
            value={draft.id}
            readOnly={!isNew}
            onChange={(e) => onChange({ id: e.target.value })}
            className="font-ui"
          />
        </Field>
        <Field label="Status" hint="Draft = hidden from the website.">
          <Select
            value={draft.status}
            onChange={(e) => onChange({ status: e.target.value as DashboardEvent['status'] })}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        </Field>
        <Field label="Category">
          <Select
            value={draft.category}
            onChange={(e) => onChange({ category: e.target.value as DashboardEvent['category'] })}
          >
            {Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Speaker" hint="Optional" error={errors.speaker}>
          <Input {...text('speaker')} placeholder="e.g. Ustadh Umar Muqaddam" />
        </Field>
        <Field label="Location" hint="Optional" error={errors.location}>
          <Input {...text('location')} placeholder="e.g. Main prayer hall" />
        </Field>
        <Field
          label="Summary"
          hint="One or two sentences, shown on cards."
          error={errors.summary}
          className="sm:col-span-2"
        >
          <Textarea value={draft.summary} onChange={(e) => onChange({ summary: e.target.value })} />
        </Field>
        <Field
          label="Description"
          hint="Optional. Longer text for the event page (the summary is used if empty)."
          error={errors.description}
          className="sm:col-span-2"
        >
          <Textarea {...text('description')} className="min-h-36" />
        </Field>
        <Field
          label="External link"
          hint="Optional. “Learn more” goes here instead of the event page."
          error={errors.href}
          className="sm:col-span-2"
        >
          <Input {...text('href')} type="url" placeholder="https://…" />
        </Field>
      </div>
    </Panel>
  );
}
