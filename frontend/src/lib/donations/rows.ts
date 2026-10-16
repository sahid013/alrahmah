import { checkoutHref } from '@/lib/giving/links';
import { donationProgramSchema, type DonationProgram } from './types';

/**
 * The `campaigns` table (Supabase) ↔ donation programmes (website) and dashboard campaigns.
 * `status`: active = shown on the website, draft = hidden, archived = kept but out of the way.
 */
export interface CampaignRow {
  id: string;
  title: string;
  summary: string | null;
  status: 'active' | 'draft' | 'archived';
  sort_order: number;
  giving: unknown;
  icon: DonationProgram['icon'] | null;
  price: unknown;
  tracker: unknown;
  image: unknown;
  cta_label: string;
  updated_at?: string;
}

export const CAMPAIGN_COLUMNS =
  'id,title,summary,status,sort_order,giving,icon,price,tracker,image,cta_label,updated_at';

/** Validated programme from a row (throws on bad data, so it never reaches the site). */
export const rowToProgram = (row: CampaignRow): DonationProgram =>
  donationProgramSchema.parse({
    id: row.id,
    title: row.title,
    ...(row.summary && { summary: row.summary }),
    ...(row.image ? { image: row.image } : {}),
    ...(row.price ? { price: row.price } : {}),
    ...(row.tracker ? { tracker: row.tracker } : {}),
    cta: { label: row.cta_label, href: checkoutHref(row.id) },
    giving: row.giving,
    ...(row.icon && { icon: row.icon }),
  });

/** Row to insert/update from a programme plus its status and position. */
export const programToRow = (
  program: DonationProgram,
  status: CampaignRow['status'],
  order: number,
): Omit<CampaignRow, 'updated_at'> => {
  const p = donationProgramSchema.parse(program);
  return {
    id: p.id,
    title: p.title,
    summary: p.summary?.trim() || null,
    status,
    sort_order: order,
    giving: p.giving,
    icon: p.icon ?? null,
    price: p.price ?? null,
    tracker: p.tracker ?? null,
    image: p.image ?? null,
    cta_label: p.cta.label,
  };
};
