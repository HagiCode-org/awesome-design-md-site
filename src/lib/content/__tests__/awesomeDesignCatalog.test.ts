import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import {
  buildSeoDescription,
  getAdjacentDesignEntries,
  getAwesomeDesignCatalog,
  loadPublishedDesignMarkdown,
  loadPublishedPreviewHtml,
  type PreviewImageFileRecord,
  type PreviewImageManifest,
  type PreviewImageName,
  type PreviewImageRecord,
} from '@/lib/content/awesomeDesignCatalog';
import previewImageManifest from '@/data/preview-images.json';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('awesomeDesignCatalog', () => {
  it('returns an empty catalog when the submodule content is not initialized', async () => {
    const sourceRoot = await createSourceRoot();
    const catalog = await getAwesomeDesignCatalog(await catalogOptions(sourceRoot));

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
    const catalog = await getAwesomeDesignCatalog(await catalogOptions(sourceRoot));

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
    expect(entry.designDownloadUrl).toBe('/designs/linear.app/DESIGN.md');
    expect(entry.searchText).toContain('fast workflows');

    const darkHtml = await loadPublishedPreviewHtml('linear.app', 'dark', await catalogOptions(sourceRoot));
    expect(darkHtml).toContain('light preview');
    await expect(loadPublishedDesignMarkdown('linear.app', await catalogOptions(sourceRoot))).resolves.toContain(
      'Shared notes for interface design.',
    );
  });

  it('derives a brand-specific SEO description and keeps one h1 in rendered documents', async () => {
    const sourceRoot = await createSourceRoot({
      acme: {
        readme: '# Acme Inspired Design System\n\nShared boilerplate summary.',
        design:
          '# Design System Inspiration of Acme\n\n## 1. Visual Theme & Atmosphere\n\nAcme is **bold** and playful, with `#ff0000` accents.\n\n## 2. Colors\n\nRed everywhere.',
        previewLight: '<html></html>',
      },
    });
    const [entry] = (await getAwesomeDesignCatalog(await catalogOptions(sourceRoot))).entries;

    expect(entry.seoDescription).toBe('Acme is bold and playful, with #ff0000 accents.');
    expect(entry.summary).toBe('Shared boilerplate summary.');
    expect(entry.designHtml).not.toContain('<h1');
    expect(entry.designHtml).toContain('<h2 id="design-system-inspiration-of-acme">');
    expect(entry.readmeHtml).not.toContain('<h1');
  });

  it('prefers the brand casing from DESIGN.md when the README title only differs in case', async () => {
    const sourceRoot = await createSourceRoot({
      bmw: {
        readme: '# Bmw Inspired Design System\n\nSummary.',
        design: '# Design System Inspiration of BMW\n\n## 1. Theme\n\nBMW is precise.',
        previewLight: '<html></html>',
      },
      other: {
        readme: '# Other Inspired Design System\n\nSummary.',
        design: '# Design System Inspiration of Something Else\n\n## 1. Theme\n\nText.',
        previewLight: '<html></html>',
      },
    });
    const titles = Object.fromEntries(
      (await getAwesomeDesignCatalog(await catalogOptions(sourceRoot))).entries.map((e) => [e.slug, e.title]),
    );

    expect(titles.bmw).toBe('BMW');
    expect(titles.other).toBe('Other');
  });

  it('falls back to the summary when DESIGN.md has no theme paragraph', async () => {
    const sourceRoot = await createSourceRoot({
      plain: {
        readme: '# Plain\n\nPlain summary text.',
        design: '# Plain\n\n## Colors\n\n## Type\n\nLater paragraph.',
        previewLight: '<html></html>',
      },
    });
    const [entry] = (await getAwesomeDesignCatalog(await catalogOptions(sourceRoot))).entries;

    expect(entry.seoDescription).toBe('Plain summary text.');
  });

  it('truncates SEO descriptions at a word boundary', () => {
    const long = 'word '.repeat(60);
    const result = buildSeoDescription(long, 'fallback');

    expect(result.length).toBeLessThanOrEqual(155);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });

  it('fails fast when required source files are missing', async () => {
    const sourceRoot = await createSourceRoot({
      stripe: {
        readme: '# Stripe Inspired Design System',
        previewLight: '<html><body>light preview</body></html>',
      },
    });

    await expect(getAwesomeDesignCatalog(await catalogOptions(sourceRoot))).rejects.toThrow(/missing DESIGN\.md/i);
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
    const catalog = await getAwesomeDesignCatalog(await catalogOptions(sourceRoot));
    const adjacent = getAdjacentDesignEntries(catalog.entries, 'stripe');

    expect(catalog.entries.map((entry) => entry.slug)).toEqual(['airbnb', 'stripe', 'vercel']);
    expect(adjacent.previous?.slug).toBe('airbnb');
    expect(adjacent.next?.slug).toBe('vercel');
  });
  it('exposes the rendered image set per variant and reuses the light set when there is no dark render', async () => {
    const sourceRoot = await createSourceRoot({
      'linear.app': {
        readme: '# Linear Inspired Design System\n\nFast workflows.',
        design: '# Design System Inspiration of Linear\n\nNotes.',
        previewLight: '<html>light</html>',
      },
      'x.ai': {
        readme: '# X.ai Inspired Design System\n\nSummary.',
        design: '# Design System Inspiration of X.ai\n\nNotes.',
        previewLight: '<html>light</html>',
        previewDark: '<html>dark</html>',
      },
    });
    const catalog = await getAwesomeDesignCatalog(await catalogOptions(sourceRoot));
    const linear = catalog.entries.find((entry) => entry.slug === 'linear.app');
    const xai = catalog.entries.find((entry) => entry.slug === 'x.ai');

    expect(linear?.preview.images.light.fit).toEqual({
      url: '/preview-images/linear.app/light-fit.avif',
      width: 1440,
      height: 1000,
    });
    expect(linear?.preview.images.light.thumb).toEqual({
      url: '/preview-images/linear.app/light-thumb.avif',
      width: 780,
      height: 1131,
    });
    expect(linear?.preview.images.dark).toEqual(linear?.preview.images.light);
    expect(xai?.preview.images.dark.tablet.url).toBe('/preview-images/x.ai/dark-tablet.avif');
    expect(xai?.preview.images.dark.mobile.width).toBe(390);
    expect(xai?.preview.images.light).not.toBe(xai?.preview.images.dark);
  });

  it('fails catalog loading for an entry without a manifest record, naming the entry', async () => {
    const sourceRoot = await createSourceRoot({
      stripe: {
        readme: '# Stripe Inspired Design System\n\nPayments.',
        design: '# Design System Inspiration of Stripe\n\nNotes.',
        previewLight: '<html>stripe</html>',
      },
    });

    await expect(getAwesomeDesignCatalog({ sourceRoot, previewImageManifest: { version: 1, entries: {} } })).rejects.toThrow(
      'Preview images are missing for design entry "stripe". Run `npm run previews:render -- --only stripe`',
    );
  });

  it('replaces the legacy Cloudflare R2 screenshots with the local Fit image of the same variant', async () => {
    const sourceRoot = await createSourceRoot({
      acme: {
        readme:
          '# Acme Inspired Design System\n\n## Preview\n\nA sample page.\n\n### Dark Mode\n![Dark](https://pub-x.r2.dev/designs/acme/preview-dark-screenshot.png)\n\n### Light Mode\n![Light](https://pub-x.r2.dev/designs/acme/preview-screenshot.png)\n\n## Usage\n\nKeep it.',
        design: '# Design System Inspiration of Acme\n\n## 1. Theme\n\nText.',
        previewLight: '<html></html>',
        previewDark: '<html></html>',
      },
    });
    const [entry] = (await getAwesomeDesignCatalog(await catalogOptions(sourceRoot))).entries;

    expect(entry.readmeHtml).not.toContain('r2.dev');
    expect(entry.readmeHtml).toContain('src="/preview-images/acme/dark-fit.avif"');
    expect(entry.readmeHtml).toContain('src="/preview-images/acme/light-fit.avif"');
    expect(entry.readmeHtml).toContain('loading="lazy"');
    expect(entry.readmeHtml).toContain('Dark Mode');
    expect(entry.readmeHtml).toContain('Light Mode');
    expect(entry.readmeHtml).toContain('A sample page.');
    expect(entry.readmeHtml).toContain('Keep it.');
    expect(entry.readmeMarkdown).toContain('pub-x.r2.dev');
  });

  it('keeps the manifest keys equal to the catalog slugs for the real vendor tree', async () => {
    const catalog = await getAwesomeDesignCatalog();
    const catalogSlugs = catalog.entries.map((entry) => entry.slug).sort();

    expect(Object.keys((previewImageManifest as PreviewImageManifest).entries).sort()).toEqual(catalogSlugs);
  });
});

async function catalogOptions(sourceRoot: string) {
  const designRoot = path.join(sourceRoot, 'design-md');
  const slugs = await readdir(designRoot).catch(() => []);
  const entries: PreviewImageManifest['entries'] = {};

  for (const slug of slugs) {
    const hasLight = await exists(path.join(designRoot, slug, 'preview.html'));
    const hasDark = await exists(path.join(designRoot, slug, 'preview-dark.html'));

    entries[slug] = {
      light: hasLight ? renderedImageRecord(slug, 'light') : { reuses: 'dark' },
      dark: hasDark ? renderedImageRecord(slug, 'dark') : { reuses: 'light' },
    };
  }

  return { sourceRoot, previewImageManifest: { version: 1, entries } };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function renderedImageRecord(slug: string, variant: 'light' | 'dark'): PreviewImageRecord {
  const size = { fit: [1440, 1000], tablet: [820, 1000], mobile: [390, 1000], thumb: [780, 1131] } as const;
  const files = Object.fromEntries(
    (Object.keys(size) as PreviewImageName[]).map((name) => [
      name,
      { path: `${slug}/${variant}-${name}.avif`, width: size[name][0], height: size[name][1], bytes: 1 },
    ]),
  ) as Record<PreviewImageName, PreviewImageFileRecord>;

  return { sourceSha256: 'test-sha', capped: false, pageHeight: 1000, files };
}

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

  execFileSync('git', ['init'], { cwd: sourceRoot, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Gallery test'], { cwd: sourceRoot });
  execFileSync('git', ['config', 'user.email', 'gallery-test@example.invalid'], { cwd: sourceRoot });
  execFileSync('git', ['add', 'design-md'], { cwd: sourceRoot });
  execFileSync('git', ['commit', '-m', 'Add test catalog'], { cwd: sourceRoot, stdio: 'ignore' });

  return sourceRoot;
}
