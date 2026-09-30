import { describe, expect, it } from 'vitest';
import { createGalleryFeed, selectRssEntries } from './gallery-rss';

describe('gallery RSS entry selection', () => {
  it('sorts by latest source change and caps the feed at 50 entries', () => {
    const entries = Array.from({ length: 51 }, (_, index) => ({
      slug: String(index),
      title: `Design ${index}`,
      summary: `Summary ${index}`,
      lastUpdated: new Date(Date.UTC(2026, 0, index + 1)),
    }));

    const selected = selectRssEntries(entries);

    expect(selected).toHaveLength(50);
    expect(selected[0].slug).toBe('50');
    expect(selected.at(-1)?.slug).toBe('1');
  });

  it('localizes gallery feed metadata and detail paths', () => {
    const feed = createGalleryFeed('zh-CN', [{
      slug: 'sample-design',
      title: 'Sample Design',
      summary: 'A sample design system.',
      lastUpdated: new Date('2026-01-01T00:00:00Z'),
    }]);

    expect(feed.description).toContain('设计');
    expect(feed.items[0]).toMatchObject({
      title: 'Sample Design',
      link: '/zh-CN/designs/sample-design/',
    });
  });
});
