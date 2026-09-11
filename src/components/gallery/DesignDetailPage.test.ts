import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const detailPageSource = readFileSync(
  path.resolve(process.cwd(), 'src/components/gallery/DesignDetailPage.astro'),
  'utf8',
);

describe('DesignDetailPage showcase composition', () => {
  it('renders the localized HagiCode showcase after adjacent navigation', () => {
    expect(detailPageSource).toContain(
      "import HagiCodeShowcase from '@/components/gallery/HagiCodeShowcase';",
    );
    expect(detailPageSource).toContain('<HagiCodeShowcase locale={locale} client:load />');
    expect(detailPageSource.indexOf('<AdjacentNavigation')).toBeLessThan(
      detailPageSource.indexOf('<HagiCodeShowcase'),
    );
  });
});
