import { describe, expect, it } from 'vitest';
import { selectRssEntries } from './gallery-rss';

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
});
