import { checkoutHref } from '@/lib/giving/links';
import type { Campaign } from './types';

export { checkoutHref };

/** URL-safe id from a title: "Daily Iftar 2027!" → "daily-iftar-2027". */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Starting values for a new campaign (saved as a draft, placed last). */
export const newCampaign = (order: number): Campaign => ({
  id: '',
  title: '',
  summary: '',
  image: { src: '', alt: '' },
  cta: { label: 'Donate now', href: '' },
  status: 'draft',
  order,
});

/** Applies the managed fields before saving (the donate link always follows the slug). */
export const prepareCampaign = (c: Campaign): Campaign => ({
  ...c,
  cta: { ...c.cta, href: checkoutHref(c.id) },
});

/** Image sources the dashboard can render now (site files and uploaded previews). */
export const isRenderableImage = (src: string) =>
  src.startsWith('/') || src.startsWith('data:image/');

/** Ids in display order with `id` moved to `toIndex` (clamped). */
export function moveId(ids: string[], id: string, toIndex: number): string[] {
  const from = ids.indexOf(id);
  if (from === -1) return ids;
  const next = ids.filter((x) => x !== id);
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, id);
  return next;
}

/** Succeeded donation totals per campaign id. */
export function raisedByCampaign(
  donations: { campaignId: string; amount: number; status: string }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of donations)
    if (d.status === 'succeeded') map.set(d.campaignId, (map.get(d.campaignId) ?? 0) + d.amount);
  return map;
}
