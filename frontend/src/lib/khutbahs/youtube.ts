import { z } from 'zod';

/** One khutbah video, as the home page shows it. */
export interface Khutbah {
  /** YouTube video id. */
  id: string;
  title: string;
  /** Parsed from titles like "Topic | Khutbah by Ustadh Name". */
  speaker?: string;
  /** ISO 8601 date the video was published. */
  publishedAt: string;
  href: string;
}

/** The parts of a YouTube Data API `playlistItems.list` response we use. */
const playlistItemsSchema = z.object({
  items: z.array(
    z.object({
      snippet: z.object({
        title: z.string(),
        publishedAt: z.string(),
        resourceId: z.object({ videoId: z.string() }),
      }),
      contentDetails: z.object({ videoPublishedAt: z.string().optional() }).optional(),
    }),
  ),
});

/** Private and deleted videos stay in a playlist with a placeholder title. */
const UNAVAILABLE = new Set(['Private video', 'Deleted video']);

/** "Topic | Khutbah by Ustadh Name" → title "Topic", speaker "Ustadh Name". */
export function splitKhutbahTitle(raw: string): { title: string; speaker?: string } {
  const match = /^(.+?)\s*\|\s*Khutbah by\s+(.+)$/i.exec(raw.trim());
  return match ? { title: match[1]!, speaker: match[2]! } : { title: raw.trim() };
}

/** Maps a `playlistItems.list` response to khutbahs, in playlist order (newest first). */
export function toKhutbahs(response: unknown): Khutbah[] {
  const { items } = playlistItemsSchema.parse(response);
  return items.flatMap(({ snippet, contentDetails }) => {
    const id = snippet.resourceId.videoId;
    if (UNAVAILABLE.has(snippet.title)) return [];
    return [
      {
        id,
        ...splitKhutbahTitle(snippet.title),
        publishedAt: contentDetails?.videoPublishedAt ?? snippet.publishedAt,
        href: `https://www.youtube.com/watch?v=${id}`,
      },
    ];
  });
}
