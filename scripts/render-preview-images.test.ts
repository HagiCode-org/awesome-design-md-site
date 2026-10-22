import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import * as render from './render-preview-images.mjs';
import * as shared from './preview-images-shared.mjs';

interface Entry {
  slug: string;
  sources: { light: string | null; dark: string | null };
}

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempRoot() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'preview-render-'));
  tempDirs.push(dir);
  return dir;
}

async function writeSource(root: string, slug: string, variant: 'light' | 'dark', html: string) {
  const dir = path.join(root, slug);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, variant === 'dark' ? 'preview-dark.html' : 'preview.html');
  await writeFile(file, html);
  return file;
}

describe('planRenderJobs', () => {
  it('plans a render for each preview page of a normal entry', async () => {
    const root = await createTempRoot();
    const light = await writeSource(root, 'alpha', 'light', '<html>light</html>');
    const dark = await writeSource(root, 'alpha', 'dark', '<html>dark</html>');
    const entries: Entry[] = [{ slug: 'alpha', sources: { light, dark } }];

    const jobs = await render.planRenderJobs(entries, {
      manifest: shared.emptyManifest(),
      imageDir: path.join(root, 'images'),
    });

    expect(jobs.map((job: { variant: string; action: string }) => [job.variant, job.action])).toEqual([
      ['light', 'render'],
      ['dark', 'render'],
    ]);
    expect(jobs[0].sourceSha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('records the dark variant as reusing the light images for a light-only entry', async () => {
    const root = await createTempRoot();
    const light = await writeSource(root, 'beta', 'light', '<html>light</html>');
    const entries: Entry[] = [{ slug: 'beta', sources: { light, dark: null } }];

    const jobs = await render.planRenderJobs(entries, {
      manifest: shared.emptyManifest(),
      imageDir: path.join(root, 'images'),
    });

    expect(jobs).toEqual([
      expect.objectContaining({ slug: 'beta', variant: 'light', action: 'render' }),
      { slug: 'beta', variant: 'dark', action: 'reuse', reuses: 'light' },
    ]);
  });

  it('skips a variant whose source hash and image files are unchanged', async () => {
    const root = await createTempRoot();
    const imageDir = path.join(root, 'images');
    const light = await writeSource(root, 'gamma', 'light', '<html>light</html>');
    const sourceSha256 = await shared.sha256File(light);
    const files = {
      fit: { path: 'gamma/light-fit.avif', width: 1440, height: 10, bytes: 1 },
      tablet: { path: 'gamma/light-tablet.avif', width: 820, height: 10, bytes: 1 },
      mobile: { path: 'gamma/light-mobile.avif', width: 390, height: 10, bytes: 1 },
      thumb: { path: 'gamma/light-thumb.avif', width: 780, height: 1131, bytes: 1 },
    };

    await mkdir(path.join(imageDir, 'gamma'), { recursive: true });
    for (const file of Object.values(files)) {
      await writeFile(path.join(imageDir, file.path), 'avif');
    }

    const manifest = {
      version: 1,
      entries: {
        gamma: { light: shared.renderedRecord({ sourceSha256, capped: false, pageHeight: 10, files }) },
      },
    };
    const entries: Entry[] = [{ slug: 'gamma', sources: { light, dark: null } }];

    const jobs = await render.planRenderJobs(entries, { manifest, imageDir });
    expect(jobs[0]).toMatchObject({ variant: 'light', action: 'skip' });

    const forced = await render.planRenderJobs(entries, { manifest, imageDir, force: true });
    expect(forced[0]).toMatchObject({ variant: 'light', action: 'render' });
  });

  it('renders again when the source hash no longer matches the record', async () => {
    const root = await createTempRoot();
    const light = await writeSource(root, 'delta', 'light', '<html>changed</html>');
    const manifest = {
      version: 1,
      entries: {
        delta: {
          light: shared.renderedRecord({
            sourceSha256: '0'.repeat(64),
            capped: false,
            pageHeight: 10,
            files: {},
          }),
        },
      },
    };

    const jobs = await render.planRenderJobs([{ slug: 'delta', sources: { light, dark: null } }], {
      manifest,
      imageDir: path.join(root, 'images'),
    });

    expect(jobs[0].action).toBe('render');
  });

  it('rejects an --only slug that is not in the vendor tree', async () => {
    await expect(
      render.planRenderJobs([], { manifest: shared.emptyManifest(), imageDir: '/unused', only: 'nope' }),
    ).rejects.toThrow('Unknown design entry "nope"');
  });
});

describe('manifest output', () => {
  it('writes the same bytes for the same records, with slugs in sorted order', () => {
    const files = (name: string) => ({
      fit: { path: `${name}/light-fit.avif`, width: 1440, height: 10, bytes: 5 },
      tablet: { path: `${name}/light-tablet.avif`, width: 820, height: 10, bytes: 5 },
      mobile: { path: `${name}/light-mobile.avif`, width: 390, height: 10, bytes: 5 },
      thumb: { path: `${name}/light-thumb.avif`, width: 780, height: 1131, bytes: 5 },
    });
    const build = () => ({
      version: 1,
      entries: {
        zeta: { light: shared.renderedRecord({ sourceSha256: 'a', capped: false, pageHeight: 10, files: files('zeta') }), dark: shared.reuseRecord('light') },
        alpha: { light: shared.renderedRecord({ sourceSha256: 'b', capped: true, pageHeight: 8100, files: files('alpha') }), dark: shared.reuseRecord('light') },
      },
    });

    const output = shared.formatManifest(build());

    expect(output).toBe(shared.formatManifest(build()));
    expect(output.indexOf('"alpha"')).toBeLessThan(output.indexOf('"zeta"'));
    expect(output).not.toMatch(/generatedAt|timestamp/u);

    const parsed = JSON.parse(output);
    expect(Object.keys(parsed.entries.alpha.light.files)).toEqual(['fit', 'tablet', 'mobile', 'thumb']);
    expect(parsed.entries.zeta.dark).toEqual({ reuses: 'light' });
  });
});

describe('measureBudget', () => {
  it('lists the offenders when a file or the whole set is over budget', async () => {
    const root = await createTempRoot();
    await mkdir(path.join(root, 'big'), { recursive: true });
    await writeFile(path.join(root, 'big', 'light-fit.avif'), Buffer.alloc(2048));
    await writeFile(path.join(root, 'big', 'light-thumb.avif'), Buffer.alloc(100));
    const manifest = {
      version: 1,
      entries: {
        big: {
          light: {
            files: {
              fit: { path: 'big/light-fit.avif', width: 1440, height: 10, bytes: 2048 },
              thumb: { path: 'big/light-thumb.avif', width: 780, height: 1131, bytes: 100 },
            },
          },
        },
      },
    };

    const budget = await shared.measureBudget(root, manifest, { fileBytes: 1024, totalBytes: 2000 });

    expect(budget.totalBytes).toBe(2148);
    expect(budget.largest[0].path).toBe('big/light-fit.avif');
    expect(budget.offenders).toEqual([
      'big/light-fit.avif is 2.0 KB, over the 1.0 KB per-file budget',
      'the set totals 2.1 KB, over the 2.0 KB directory budget',
    ]);
  });
});

describe('capture policy', () => {
  function fakeRoute(url: string, isNavigation = false) {
    const calls: string[] = [];
    return {
      calls,
      route: {
        request: () => ({ url: () => url, isNavigationRequest: () => isNavigation }),
        continue: async () => calls.push('continue'),
        abort: async (reason: string) => calls.push(`abort:${reason}`),
      },
    };
  }

  it('lets only the font hosts and inline data through, and reports everything else', async () => {
    const blocked = new Set<string>();
    const policy = render.createNetworkPolicy(blocked);

    const font = fakeRoute('https://fonts.gstatic.com/s/inter/v1/a.woff2');
    await policy(font.route);
    expect(font.calls).toEqual(['continue']);

    const external = fakeRoute('https://tracker.example.com/pixel.gif');
    await policy(external.route);
    expect(external.calls).toEqual(['abort:blockedbyclient']);

    const link = fakeRoute('https://brand.example.com/', true);
    await policy(link.route);
    expect(link.calls).toEqual(['abort:blockedbyclient']);

    expect([...blocked]).toEqual(['https://tracker.example.com/pixel.gif', 'https://brand.example.com/']);
  });

  it('extracts the declared Google font families from a preview page', () => {
    const html = `
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;family=Space+Grotesk&display=swap" rel="stylesheet">
    `;

    expect(render.declaredFontFamilies(html)).toEqual(['Inter', 'Space Grotesk']);
  });

  it('fails the entry, naming the font, when a declared family has an errored face', async () => {
    const faces = [
      { family: '"Inter"', status: 'loaded' },
      { family: '"Space Grotesk"', status: 'error' },
    ];
    const page = {
      evaluate: async (fn: (arg: unknown) => unknown, arg: unknown) => {
        Object.defineProperty(document, 'fonts', {
          configurable: true,
          value: { ready: Promise.resolve(), [Symbol.iterator]: () => faces[Symbol.iterator]() },
        });
        return fn(arg);
      },
    };

    await expect(render.assertFontsReady(page, ['Inter', 'Space Grotesk'], 'alpha (light)')).rejects.toThrow(
      'Fonts did not load for alpha (light): "Space Grotesk" failed to load',
    );
  });

  it('passes when every declared family has a usable face', async () => {
    const faces = [{ family: '"Inter"', status: 'unloaded' }];
    const page = {
      evaluate: async (fn: (arg: unknown) => unknown, arg: unknown) => {
        Object.defineProperty(document, 'fonts', {
          configurable: true,
          value: { ready: Promise.resolve(), [Symbol.iterator]: () => faces[Symbol.iterator]() },
        });
        return fn(arg);
      },
    };

    await expect(render.assertFontsReady(page, ['Inter'], 'alpha (light)')).resolves.toBeUndefined();
  });
});

describe('local font fallback', () => {
  it('embeds the locally installed Commit Mono face as a data URL', async () => {
    const css = await render.localFontFaceCss('Commit Mono');

    expect(css).toContain("font-family: 'Commit Mono'");
    expect(css).toMatch(/url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\)/u);
  });

  it('adds nothing for a family that Google Fonts serves', async () => {
    await expect(render.localFontFaceCss('Inter')).resolves.toBeNull();
  });

  it('ships the font file that the fallback reads', async () => {
    await expect(stat(render.LOCAL_FONT_FILES['Commit Mono'])).resolves.toMatchObject({ size: expect.any(Number) });
  });
});

describe('thumbnail and encoding', () => {
  it('crops the thumbnail to exactly the card aspect ratio', () => {
    const crop = shared.thumbCrop();

    expect(crop).toEqual({ cssWidth: 390, cssHeight: 565.5, pixelWidth: 780, pixelHeight: 1131 });
    expect(crop.pixelWidth / crop.pixelHeight).toBeCloseTo(shared.CARD_ASPECT.width / shared.CARD_ASPECT.height, 4);
  });

  it('encodes a cropped capture as AVIF that sharp decodes at the expected size', async () => {
    const capture = await sharp({
      create: { width: 780, height: 1132, channels: 3, background: '#123456' },
    })
      .png()
      .toBuffer();

    const crop = shared.thumbCrop();
    const avif = await sharp(capture)
      .extract({ left: 0, top: 0, width: crop.pixelWidth, height: crop.pixelHeight })
      .avif(shared.ENCODE_SETTINGS.thumb)
      .toBuffer();
    const metadata = await sharp(avif).metadata();

    expect(metadata.format).toBe('heif');
    expect(metadata.compression).toBe('av1');
    expect(metadata.width).toBe(780);
    expect(metadata.height).toBe(1131);
  }, 20_000);
});

describe('parseRenderArgs', () => {
  it('reads --only, --force and --root and rejects unknown options', () => {
    expect(render.parseRenderArgs(['--only', 'apple', '--force'])).toMatchObject({ only: 'apple', force: true });
    expect(() => render.parseRenderArgs(['--bogus'])).toThrow('Unknown option --bogus');
  });
});
