import { describe, expect, it } from 'vitest';
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
