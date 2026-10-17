import { describe, expect, it } from 'vitest';

import type { AwesomeDesignEntry } from '@/lib/content/awesomeDesignCatalog';
import { buildFusionStages, extractDocLines, extractPalette } from '@/lib/content/fusionHeroData';

const markdown = `# Design System Inspiration of Stripe

## 1. Visual Theme & Atmosphere

Prose paragraph that must not be quoted.

**Key Characteristics:**
- sohne-var with OpenType "ss01" on all text
- Deep navy (#061b31) headings on #FFFFFF with #533AFD accents, repeated #533afd
- A third characteristic that is intentionally long so that it has to be clipped at a word boundary near the limit
- A fourth characteristic that must be dropped
`;

function entry(slug: string, designMarkdown = markdown): AwesomeDesignEntry {
  return {
    slug,
    title: slug.toUpperCase(),
    designMarkdown,
    preview: { lightUrl: `/previews/${slug}/light`, darkUrl: `/previews/${slug}/dark` },
  } as AwesomeDesignEntry;
}

describe('fusion hero data', () => {
  it('quotes the title, first section and first characteristics verbatim', () => {
    const lines = extractDocLines(markdown);

    expect(lines.map((line) => line.kind)).toEqual(['h1', 'h2', 'label', 'item', 'item', 'item']);
    expect(lines[0].text).toBe('# Design System Inspiration of Stripe');
    expect(lines[3].text).toBe('- sohne-var with OpenType "ss01" on all text');
    expect(lines[5].text.endsWith('…')).toBe(true);
    expect(lines[5].text.length).toBeLessThanOrEqual(77);
  });

  it('omits the characteristics block when the file has none', () => {
    expect(extractDocLines('# Title\n\n## Section\n\nJust prose.').map((line) => line.kind)).toEqual(['h1', 'h2']);
  });

  it('collects unique lower-case hex colours in order of first mention', () => {
    expect(extractPalette(markdown)).toEqual(['#061b31', '#ffffff', '#533afd']);
  });

  it('keeps the configured order and skips missing or empty entries', () => {
    const stages = buildFusionStages(
      [entry('a'), entry('b'), entry('c', '')],
      (slug) => `/designs/${slug}/`,
      ['c', 'b', 'missing', 'a'],
    );

    expect(stages.map((stage) => stage.slug)).toEqual(['b', 'a']);
    expect(stages[0]).toMatchObject({ href: '/designs/b/', lightUrl: '/previews/b/light', darkUrl: '/previews/b/dark' });
  });
});
