import { describe, expect, it } from 'vitest';
import { byNewest, youtubeVideoId, type KhutbahEntry } from './types';
import { splitKhutbahTitle, toKhutbahs } from './youtube';

const item = (videoId: string, title: string, extra: Record<string, unknown> = {}) => ({
  snippet: {
    title,
    publishedAt: '2026-10-10T12:00:00Z',
    resourceId: { videoId },
    ...extra,
  },
  contentDetails: { videoPublishedAt: '2026-10-09T14:30:00Z' },
});

describe('splitKhutbahTitle', () => {
  it('separates the topic from the speaker', () => {
    expect(
      splitKhutbahTitle('Be an Ambassador for Islam | Khutbah by Ustadh Hussain Sattar'),
    ).toEqual({ title: 'Be an Ambassador for Islam', speaker: 'Ustadh Hussain Sattar' });
  });

  it('keeps titles in other formats whole', () => {
    expect(splitKhutbahTitle('Eid Khutbah 2026')).toEqual({ title: 'Eid Khutbah 2026' });
  });
});

describe('toKhutbahs', () => {
  it('maps playlist items in order, using the video publish date', () => {
    const [first, second] = toKhutbahs({
      items: [item('a1', 'Gratitude | Khutbah by Ustadh A'), item('b2', 'Patience')],
    });
    expect(first).toMatchObject({
      id: 'a1',
      title: 'Gratitude',
      speaker: 'Ustadh A',
      publishedAt: '2026-10-09T14:30:00Z',
      href: 'https://www.youtube.com/watch?v=a1',
    });
    expect(second?.title).toBe('Patience');
  });

  it('skips private and deleted videos', () => {
    const list = toKhutbahs({
      items: [item('x', 'Private video'), item('y', 'Deleted video')],
    });
    expect(list).toEqual([]);
  });

  it('rejects a response without items', () => {
    expect(() => toKhutbahs({ error: { code: 403 } })).toThrow();
  });
});

describe('youtubeVideoId', () => {
  it.each([
    'https://www.youtube.com/watch?v=r9nPHD7Uubo',
    'https://youtube.com/watch?v=r9nPHD7Uubo&list=PLATxZb7uoh6DSDhYSsk6TsaNSWYTQ5rUA&t=42s',
    'https://m.youtube.com/watch?v=r9nPHD7Uubo',
    'https://youtu.be/r9nPHD7Uubo?si=abc123',
    'youtu.be/r9nPHD7Uubo',
    'https://www.youtube.com/live/r9nPHD7Uubo?feature=share',
    'https://www.youtube.com/shorts/r9nPHD7Uubo',
    'https://www.youtube-nocookie.com/embed/r9nPHD7Uubo',
    '  r9nPHD7Uubo  ',
  ])('reads the id from %s', (link) => {
    expect(youtubeVideoId(link)).toBe('r9nPHD7Uubo');
  });

  it.each([
    '',
    'hello',
    'https://www.youtube.com/@alrahmahmasjid',
    'https://www.youtube.com/playlist?list=PLATxZb7uoh6DSDhYSsk6TsaNSWYTQ5rUA',
    'https://vimeo.com/123456789',
    'https://example.com/watch?v=r9nPHD7Uubo',
  ])('rejects %s', (link) => {
    expect(youtubeVideoId(link)).toBeNull();
  });
});

describe('byNewest', () => {
  it('orders by date, then by most recently saved', () => {
    const k = (videoId: string, date: string, updatedAt?: string): KhutbahEntry => ({
      videoId,
      title: videoId,
      date,
      updatedAt,
    });
    const list = [
      k('aaaaaaaaaaa', '2026-10-02'),
      k('bbbbbbbbbbb', '2026-10-09', '2026-10-09T15:00:00Z'),
      k('ccccccccccc', '2026-10-09', '2026-10-10T09:00:00Z'),
    ].sort(byNewest);
    expect(list.map((x) => x.videoId)).toEqual(['ccccccccccc', 'bbbbbbbbbbb', 'aaaaaaaaaaa']);
  });
});
