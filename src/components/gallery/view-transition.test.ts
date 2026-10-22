import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const layout = readFileSync(path.resolve(root, 'src/layouts/BaseLayout.astro'), 'utf8');
const stylesheet = readFileSync(path.resolve(root, 'public/global.css'), 'utf8');
const detail = readFileSync(path.resolve(root, 'src/components/gallery/PreviewSwitcher.astro'), 'utf8');
const card = readFileSync(path.resolve(root, 'src/components/gallery/DesignCard.astro'), 'utf8');

describe('card to detail view transition', () => {
  it('opts into cross-document transitions only for visitors who accept motion', () => {
    const block = stylesheet.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*@view-transition\s*\{[^}]*\}/u)?.[0];

    expect(block).toContain('navigation: auto');
  });

  it('names the morphing element on the clicked card and on the detail stage, never both statically', () => {
    expect(layout).toContain("const NAME = 'design-preview'");
    expect(layout).toContain("addEventListener('pageswap'");
    expect(layout).toContain("addEventListener('pagereveal'");
    expect(layout).toContain("document.querySelector('[data-preview-stage]')");
    expect(layout).toContain('.design-card-preview');
    expect(stylesheet).not.toMatch(/view-transition-name:\s*design-preview/u);
    expect(card).toContain('design-card-preview');
    expect(detail).toContain('data-preview-stage');
  });

  it('keeps the site header out of the page cross-fade', () => {
    expect(stylesheet).toMatch(/\.site-header\s*\{\s*view-transition-name:\s*site-header;/u);
  });
});
