import 'server-only';
import { siteConfig } from '@/config/site';
import { toKhutbahs, type Khutbah } from './youtube';

/**
 * Latest khutbahs from the masjid's "Weekly Khutbah Videos" playlist, via the YouTube Data API
 * (`YOUTUBE_API_KEY`, server-only). Cached for an hour, so a new upload shows up on its own.
 *
 * Returns `null` when the list can't be loaded (no key, quota or network error); the home section
 * then falls back to an embedded player of the playlist, which always opens on the newest video.
 */
export async function listKhutbahs(limit = 3): Promise<Khutbah[] | null> {
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
    const res = await fetch(url, { next: { revalidate: 3600, tags: ['khutbahs'] } });
    if (!res.ok) return null;
    return toKhutbahs(await res.json()).slice(0, limit);
  } catch {
    return null;
  }
}
