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

  it('targets the DESIGN.md query in the title and uses the brand-specific English description', () => {
    expect(detailPageSource).toContain('title={`${entry.title} DESIGN.md • ${copy.detail.pageTitleSuffix}`}');
    expect(detailPageSource).toContain(
      "locale === 'en' ? entry.seoDescription : getDetailDescription(locale, entry.title)",
    );
  });
});
