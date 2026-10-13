import { z } from 'zod';

/**
 * Khutbahs posted from the dashboard: the contract shared by the dashboard and (once Supabase
 * is connected) the home page, where the newest by `date` becomes "This week".
 */

const VIDEO_ID = /^[\w-]{11}$/;

/**
 * The 11-character video id from any YouTube link the masjid might paste: watch, youtu.be,
 * live, shorts, embed (with or without `www.`/`m.`, extra parameters or timestamps), or a bare id.
 * Returns `null` when it isn't a YouTube video link.
 */
export function youtubeVideoId(input: string): string | null {
  const value = input.trim();
  if (VIDEO_ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null | undefined;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [first, second] = url.pathname.split('/').filter(Boolean);
    id =
      first === 'watch'
        ? url.searchParams.get('v')
        : ['live', 'shorts', 'embed'].includes(first ?? '')
          ? second
          : null;
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
export const embedUrl = (videoId: string) => `https://www.youtube-nocookie.com/embed/${videoId}`;

export const khutbahEntrySchema = z.object({
  /** YouTube video id (also the record id: one entry per video). */
  videoId: z.string().regex(VIDEO_ID, 'Paste a YouTube video link'),
  title: z.string().trim().min(1, 'Add a title').max(150, 'Keep the title under 150 characters'),
  speaker: z.string().trim().max(80, 'Keep the speaker under 80 characters').optional(),
  /** The Friday it was delivered (YYYY-MM-DD). */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the date'),
  updatedAt: z.string().optional(),
});
export type KhutbahEntry = z.infer<typeof khutbahEntrySchema>;

/** Newest first (by date, then most recently saved). */
export const byNewest = (a: KhutbahEntry, b: KhutbahEntry) =>
  b.date.localeCompare(a.date) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
