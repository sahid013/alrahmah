'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ChevronIcon, TrashIcon } from '@/components/icons';
import { DonationCard } from '@/components/donations/donation-card';
import { Button } from '@/components/ui/button';
import {
  isRenderableImage,
  newCampaign,
  prepareCampaign,
  slugify,
} from '@/lib/dashboard/campaigns';
import { CAMPAIGN_STATUSES, campaignSchema, type Campaign } from '@/lib/dashboard/types';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { EmptyState, LoadingRows, PageHeader } from '../ui';
import { CampaignFields } from './campaign-fields';

/** Plain-English messages for the fields people most often miss. */
const FRIENDLY_ERRORS: Record<string, string> = {
  id: 'Use lowercase letters, numbers and hyphens only (e.g. daily-iftar)',
  title: 'Give the campaign a title',
  'image.src': 'Upload a poster image',
  'image.alt': 'Describe the poster for screen readers',
  'cta.label': 'Add a button label',
};

/** Create (`id` undefined) or edit a campaign, with a live preview of its public card. */
export function CampaignEditor({ id }: { id?: string }) {
  const { data } = useDashboardQuery(
    async (api) => {
      const campaigns = await api.campaigns.list();
      return { campaigns, campaign: id ? campaigns.find((c) => c.id === id) : undefined };
    },
    [id],
  );

  if (!data) return <LoadingRows />;
  if (id && !data.campaign)
    return (
      <EmptyState>
        Campaign not found.{' '}
        <Link href="/dashboard/campaigns" className="text-primary-500 underline">
          Back to campaigns
        </Link>
      </EmptyState>
    );

  return (
    <EditorForm
      initial={data.campaign ?? newCampaign(data.campaigns.length)}
      isNew={!id}
      takenIds={data.campaigns.filter((c) => c.id !== id).map((c) => c.id)}
    />
  );
}

function EditorForm({
  initial,
  isNew,
  takenIds,
}: {
  initial: Campaign;
  isNew: boolean;
  takenIds: string[];
}) {
  const api = useDashboardApi();
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const change = (patch: Partial<Campaign>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      // New campaigns take their id from the title until it's saved.
      if (isNew && patch.title !== undefined) next.id = slugify(patch.title);
      return next;
    });
    setSaved(false);
    // Clear errors for the fields being edited (the slug follows the title on new campaigns).
    const touched = new Set(Object.keys(patch));
    if (isNew && touched.has('title')) touched.add('id');
    setErrors((e) =>
      Object.fromEntries(Object.entries(e).filter(([k]) => !touched.has(k.split('.')[0]!))),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = campaignSchema.safeParse(prepareCampaign(draft));
    const next: Record<string, string> = {};
    if (!result.success)
      for (const issue of result.error.issues)
        next[issue.path.join('.')] ??= FRIENDLY_ERRORS[issue.path.join('.')] ?? issue.message;
    if (isNew && takenIds.includes(draft.id)) next.id = 'Another campaign already uses this slug';
    setErrors(next);
    setSaveError(undefined);
    if (!result.success || Object.keys(next).length) return;

    setSaving(true);
    try {
      const saved = await api.campaigns.save(result.data);
      if (isNew) return router.replace(`/dashboard/campaigns/${saved.id}`);
      setDraft(saved);
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Delete “${initial.title}”? This can't be undone. Consider archiving it instead.`,
      )
    )
      return;
    await api.campaigns.remove(initial.id);
    router.push('/dashboard/campaigns');
  };

  const preview = {
    ...draft,
    title: draft.title || 'Campaign title',
    image: {
      src: isRenderableImage(draft.image.src) ? draft.image.src : '/brand/logo-mark.svg',
      alt: draft.image.alt || 'Poster preview',
    },
    cta: { label: draft.cta.label || 'Donate now', href: '#' },
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1.5 font-label text-xs font-bold tracking-[0.12em] text-primary-500 uppercase hover:text-secondary-700"
      >
        <ChevronIcon direction="left" className="size-3.5" />
        All campaigns
      </Link>
      <PageHeader
        title={isNew ? 'New campaign' : initial.title}
        actions={
          <>
            {!isNew && (
              <Button type="button" variant="ghost" onClick={remove}>
                <TrashIcon className="size-4" />
                Delete
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Create campaign' : 'Save changes'}
            </Button>
          </>
        }
      />
      <p role="status" className="text-sm">
        {saved && <span className="text-success-700">Saved.</span>}
        {saveError && <span className="text-error-700">{saveError}</span>}
        {Object.keys(errors).length > 0 && (
          <span className="text-error-700">Please fix the highlighted fields.</span>
        )}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <CampaignFields
          draft={draft}
          errors={errors}
          isNew={isNew}
          statuses={CAMPAIGN_STATUSES}
          onChange={change}
        />
        <aside className="xl:sticky xl:top-8 xl:self-start">
          <p className="mb-3 font-label text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
            Live preview
          </p>
          <div inert>
            <DonationCard program={preview} />
          </div>
        </aside>
      </div>
    </form>
  );
}
