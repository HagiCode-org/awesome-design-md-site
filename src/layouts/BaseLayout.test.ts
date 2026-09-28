import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const layoutPath = resolve(process.cwd(), 'src/layouts/BaseLayout.astro');
const stylesheetPath = resolve(process.cwd(), 'public/global.css');

function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const channels = color
      .slice(1)
      .match(/.{2}/gu)
      ?.map((channel) => Number.parseInt(channel, 16) / 255);
    if (!channels || channels.length !== 3) {
      throw new Error(`Expected a six-digit hex color, received ${color}`);
    }

    const [red, green, blue] = channels.map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function cssColor(block: string, variable: string): string {
  const color = block.match(new RegExp(`${variable}:\\s*(#[\\da-f]{6})`, 'i'))?.[1];
  if (!color) {
    throw new Error(`Expected ${variable} to be a six-digit hex color`);
  }
  return color;
}

describe('BaseLayout promoto integration', () => {
  it('mounts the hagilight banner between main content and the footer', async () => {
    const source = await readFile(layoutPath, 'utf8');

    expect(source).toContain("import PromotoBanner from '@hagicode/hagilight/PromotoBanner';");
    expect(source.indexOf('<main')).toBeLessThan(source.indexOf('<PromotoBanner locale={lang} />'));
    expect(source.indexOf('<PromotoBanner locale={lang} />')).toBeLessThan(source.indexOf('<Footer'));
    expect(source).not.toMatch(/PromoteCard|promote-loader|getPromotionCopy|data-promote-card/u);
  });

  it('scopes readable dark and light banner colors and visible focus outlines', async () => {
    const stylesheet = await readFile(stylesheetPath, 'utf8');
    const darkTokens = stylesheet.match(/\.hagilight-promoto\s*\{([^}]*)\}/su)?.[1];
    const lightTokens = stylesheet.match(/\[data-theme='light'\]\s+\.hagilight-promoto\s*\{([^}]*)\}/su)?.[1];

    expect(darkTokens).toBeDefined();
    expect(lightTokens).toBeDefined();
    if (!darkTokens || !lightTokens) {
      throw new Error('Expected scoped hagilight theme tokens for dark and light themes');
    }

    expect(contrastRatio('#ffffff', cssColor(darkTokens, '--sl-color-accent'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', cssColor(darkTokens, '--sl-color-accent-high'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#faff69', cssColor(darkTokens, '--sl-color-bg'))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#faff69', cssColor(darkTokens, '--sl-color-accent-high'))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#ffffff', cssColor(lightTokens, '--sl-color-accent'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', cssColor(lightTokens, '--sl-color-accent-high'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#166534', '#ffffff')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#ffffff', cssColor(lightTokens, '--sl-color-accent-high'))).toBeGreaterThanOrEqual(3);
    expect(stylesheet).toContain('outline-color: #faff69;');
    expect(stylesheet).toContain('outline-color: #166534;');
  });
});
