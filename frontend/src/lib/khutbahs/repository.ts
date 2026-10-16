import 'server-only';
import { siteConfig } from '@/config/site';
import { watchUrl } from './types';
import { toKhutbahs, type Khutbah } from './youtube';

/** Cache tag for khutbahs; every dashboard save revalidates it (`/api/revalidate/khutbahs`). */
export const KHUTBAHS_TAG = 'khutbahs';

interface KhutbahRow {
  video_id: string;
  title: string;
  speaker: string | null;
  date: string;
}

/** Khutbahs posted in the dashboard (Supabase `khutbahs`), newest first; null if unavailable. */
async function fromDashboard(limit: number): Promise<Khutbah[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const query = new URLSearchParams({
      select: 'video_id,title,speaker,date',
      order: 'date.desc,updated_at.desc',
      limit: String(limit),
    });
    const res = await fetch(`${url}/rest/v1/khutbahs?${query}`, {
      headers: { apikey: key },
      next: { tags: [KHUTBAHS_TAG], revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as KhutbahRow[];
    return rows.map((r) => ({
      id: r.video_id,
      title: r.title,
      ...(r.speaker && { speaker: r.speaker }),
      // Midday UK, so the date never shifts when formatted.
      publishedAt: `${r.date}T12:00:00Z`,
      href: watchUrl(r.video_id),
    }));
  } catch (error) {
    console.error(
      '[khutbahs] could not load khutbahs from Supabase',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** Latest khutbahs from the "Weekly Khutbah Videos" playlist via the YouTube Data API. */
async function fromPlaylist(limit: number): Promise<Khutbah[] | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.search = new URLSearchParams({
    part: 'snippet,contentDetails',
    playlistId: siteConfig.youtube.khutbahPlaylistId,
    // Extra items in case some are private or deleted.
    maxResults: String(limit + 3),
    key,
  }).toString();

  try {
    const res = await fetch(url, { next: { revalidate: 3600, tags: [KHUTBAHS_TAG] } });
    if (!res.ok) return null;
    return toKhutbahs(await res.json()).slice(0, limit);
  } catch {
    return null;
  }
}

/**
 * Latest khutbahs for the home page, newest first: the ones **posted in the dashboard** (newest
 * by date = "This week"), otherwise the YouTube playlist (when `YOUTUBE_API_KEY` is set).
 * Returns `null` when neither has any; the section then embeds the playlist player, which always
 * opens on the newest video.
 */
export async function listKhutbahs(limit = 3): Promise<Khutbah[] | null> {
  const posted = await fromDashboard(limit);
  if (posted?.length) return posted;
  return fromPlaylist(limit);
}
