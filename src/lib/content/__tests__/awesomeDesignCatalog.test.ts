import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import {
  getAdjacentDesignEntries,
  getAwesomeDesignCatalog,
  loadPublishedPreviewHtml,
} from '@/lib/content/awesomeDesignCatalog';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('awesomeDesignCatalog', () => {
  it('returns an empty catalog when the submodule content is not initialized', async () => {
    const sourceRoot = await createSourceRoot();
    const catalog = await getAwesomeDesignCatalog({ sourceRoot });

    expect(catalog.sourceStatus).toBe('missing_source');
    expect(catalog.entries).toHaveLength(0);
  });

  it('normalizes catalog entries and falls back to the available preview asset', async () => {
    const sourceRoot = await createSourceRoot({
      'linear.app': {
        readme: '# Linear Inspired Design System\n\nFast workflows for product teams.',
        design: '# Design System Inspiration of Linear\n\nShared notes for interface design.',
        previewLight: '<html><body>light preview</body></html>',
      },
    });
    const catalog = await getAwesomeDesignCatalog({ sourceRoot });

    expect(catalog.sourceStatus).toBe('ready');
    expect(catalog.entries).toHaveLength(1);

    const [entry] = catalog.entries;
    expect(entry.slug).toBe('linear.app');
    expect(entry.title).toBe('Linear');
    expect(entry.summary).toBe('Fast workflows for product teams.');
    expect(entry.preview.hasDedicatedLight).toBe(true);
    expect(entry.preview.hasDedicatedDark).toBe(false);
    expect(entry.preview.lightUrl).toBe('/previews/linear.app/light.html');
    expect(entry.preview.darkUrl).toBe('/previews/linear.app/dark.html');
    expect(entry.searchText).toContain('fast workflows');

    const darkHtml = await loadPublishedPreviewHtml('linear.app', 'dark', { sourceRoot });
    expect(darkHtml).toContain('light preview');
  });

  it('fails fast when required source files are missing', async () => {
    const sourceRoot = await createSourceRoot({
      stripe: {
        readme: '# Stripe Inspired Design System',
        previewLight: '<html><body>light preview</body></html>',
      },
    });

    await expect(getAwesomeDesignCatalog({ sourceRoot })).rejects.toThrow(/missing DESIGN\.md/i);
  });

  it('resolves adjacent entries from the canonical sorted catalog', async () => {
    const sourceRoot = await createSourceRoot({
      stripe: {
        readme: '# Stripe Inspired Design System\n\nPayments for the internet.',
        design: '# Design System Inspiration of Stripe',
        previewLight: '<html><body>stripe</body></html>',
      },
      vercel: {
        readme: '# Vercel Inspired Design System\n\nShip faster.',
        design: '# Design System Inspiration of Vercel',
        previewLight: '<html><body>vercel</body></html>',
      },
      airbnb: {
        readme: '# Airbnb Inspired Design System\n\nBelong anywhere.',
        design: '# Design System Inspiration of Airbnb',
        previewLight: '<html><body>airbnb</body></html>',
      },
    });
    const catalog = await getAwesomeDesignCatalog({ sourceRoot });
    const adjacent = getAdjacentDesignEntries(catalog.entries, 'stripe');

    expect(catalog.entries.map((entry) => entry.slug)).toEqual(['airbnb', 'stripe', 'vercel']);
    expect(adjacent.previous?.slug).toBe('airbnb');
    expect(adjacent.next?.slug).toBe('vercel');
  });
});

async function createSourceRoot(
  entries?: Record<
    string,
    {
      readme?: string;
      design?: string;
      previewLight?: string;
      previewDark?: string;
    }
  >,
): Promise<string> {
  const sourceRoot = await mkdtemp(path.join(tmpdir(), 'awesome-design-md-site-'));
  tempDirs.push(sourceRoot);

  if (!entries) {
    return sourceRoot;
  }

  const designRoot = path.join(sourceRoot, 'design-md');
  await mkdir(designRoot, { recursive: true });

  for (const [slug, entry] of Object.entries(entries)) {
    const entryRoot = path.join(designRoot, slug);
    await mkdir(entryRoot, { recursive: true });

    if (entry.readme) {
      await writeFile(path.join(entryRoot, 'README.md'), entry.readme, 'utf8');
    }

    if (entry.design) {
      await writeFile(path.join(entryRoot, 'DESIGN.md'), entry.design, 'utf8');
    }

    if (entry.previewLight) {
      await writeFile(path.join(entryRoot, 'preview.html'), entry.previewLight, 'utf8');
    }

    if (entry.previewDark) {
      await writeFile(path.join(entryRoot, 'preview-dark.html'), entry.previewDark, 'utf8');
    }
  }

  return sourceRoot;
}
