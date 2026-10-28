import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { verifyPreviewImages } from './verify-preview-images.mjs';
import * as shared from './preview-images-shared.mjs';

const IMAGE_SIZES = {
  fit: { width: 1440, height: 40 },
  tablet: { width: 820, height: 40 },
  mobile: { width: 390, height: 40 },
  thumb: { width: 780, height: 1131 },
};

const tempDirs: string[] = [];
let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'preview-verify-'));
  tempDirs.push(root);
});

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function writeVendorEntry(slug: string, { dark = true } = {}) {
  const dir = path.join(root, 'vendor', 'awesome-design-md', 'design-md', slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'README.md'), `# ${slug}\n`);
  await writeFile(path.join(dir, 'DESIGN.md'), `# ${slug}\n`);
  await writeFile(path.join(dir, 'preview.html'), `<html>${slug} light</html>`);

  if (dark) {
    await writeFile(path.join(dir, 'preview-dark.html'), `<html>${slug} dark</html>`);
  }

  return dir;
}

async function sourceSha(slug: string, file: 'preview.html' | 'preview-dark.html') {
  return shared.sha256File(path.join(root, 'vendor', 'awesome-design-md', 'design-md', slug, file));
}

async function writeImage(relativePath: string, width: number, height: number) {
  const target = path.join(root, 'public', 'preview-images', relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  const bytes = await sharp({ create: { width, height, channels: 3, background: '#fefefe' } })
    .avif({ quality: 50, effort: 0 })
    .toBuffer();
  await writeFile(target, bytes);
  return { path: relativePath, width, height, bytes: bytes.length };
}

async function writeVariant(slug: string, variant: 'light' | 'dark') {
  const files: Record<string, { path: string; width: number; height: number; bytes: number }> = {};

  for (const name of ['fit', 'tablet', 'mobile', 'thumb'] as const) {
    files[name] = await writeImage(
      shared.imageRelativePath(slug, variant, name),
      IMAGE_SIZES[name].width,
      IMAGE_SIZES[name].height,
    );
  }

  return shared.renderedRecord({
    sourceSha256: await sourceSha(slug, variant === 'dark' ? 'preview-dark.html' : 'preview.html'),
    capped: false,
    pageHeight: 40,
    files,
  });
}

async function writeManifest(entries: Record<string, unknown>) {
  const manifestPath = path.join(root, 'src', 'data', 'preview-images.json');
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, shared.formatManifest({ version: 1, entries }));
}

async function createCompleteSet(slug = 'alpha') {
  await writeVendorEntry(slug);
  await writeManifest({
    [slug]: {
      light: await writeVariant(slug, 'light'),
      dark: await writeVariant(slug, 'dark'),
    },
  });
}

describe('verifyPreviewImages', () => {
  it('passes for a complete, current image set', async () => {
    await createCompleteSet();

    const { failures, checked } = await verifyPreviewImages({ root });

    expect(failures).toEqual([]);
    expect(checked).toBe(1);
  }, 30_000);

  it('accepts a light-only entry whose dark variant reuses the light images', async () => {
    await writeVendorEntry('beta', { dark: false });
    await writeManifest({
      beta: {
        light: await writeVariant('beta', 'light'),
        dark: shared.reuseRecord('light'),
      },
    });

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([]);
  }, 30_000);

  it('fails with the entry and the render command when an entry has no manifest record', async () => {
    await createCompleteSet('alpha');
    await writeVendorEntry('gamma');

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([
      'Preview images are missing for design entry "gamma". Run: pnpm run previews:render --only gamma',
    ]);
  }, 30_000);

  it('fails naming the file when a listed image is missing', async () => {
    await createCompleteSet();
    await rm(path.join(root, 'public', 'preview-images', 'alpha', 'dark-mobile.avif'));

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([
      expect.stringContaining('Missing preview image "alpha" (dark, mobile): alpha/dark-mobile.avif. Run: pnpm run previews:render --only alpha'),
    ]);
  }, 30_000);

  it('fails when a listed file is not AVIF', async () => {
    await createCompleteSet();
    const png = await sharp({ create: { width: 390, height: 40, channels: 3, background: '#000' } })
      .png()
      .toBuffer();
    await writeFile(path.join(root, 'public', 'preview-images', 'alpha', 'light-mobile.avif'), png);

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([expect.stringContaining('Preview image "alpha" (light, mobile) is not AVIF: alpha/light-mobile.avif')]);
  }, 30_000);

  it('fails when the decoded size differs from the manifest', async () => {
    await createCompleteSet();
    const manifestPath = path.join(root, 'src', 'data', 'preview-images.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.entries.alpha.light.files.tablet.width = 800;
    await writeFile(manifestPath, JSON.stringify(manifest));

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([
      expect.stringContaining('Preview image "alpha" (light, tablet) has the wrong dimensions: alpha/light-tablet.avif is 820×40, the manifest says 800×40'),
    ]);
  }, 30_000);

  it('fails naming the entry as stale when its preview page changed after rendering', async () => {
    await createCompleteSet();
    await writeFile(
      path.join(root, 'vendor', 'awesome-design-md', 'design-md', 'alpha', 'preview-dark.html'),
      '<html>edited</html>',
    );

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([
      expect.stringContaining('Preview images for "alpha" (dark) are stale'),
    ]);
    expect(failures[0]).toContain('pnpm run previews:render --only alpha');
  }, 30_000);

  it('reports image files that no entry references as orphans', async () => {
    await createCompleteSet();
    await writeImage('alpha/light-old.avif', 10, 10);

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([
      expect.stringContaining('Orphan preview image alpha/light-old.avif is not listed in the manifest'),
    ]);
  }, 30_000);

  it('reports a manifest record for a removed entry as an orphan', async () => {
    await createCompleteSet();
    const manifestPath = path.join(root, 'src', 'data', 'preview-images.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.entries.removed = manifest.entries.alpha;
    await writeFile(manifestPath, JSON.stringify(manifest));

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([expect.stringContaining('Orphan preview record "removed"')]);
  }, 30_000);

  it('rejects non-AVIF files in the preview image directory', async () => {
    await createCompleteSet();
    await writeFile(path.join(root, 'public', 'preview-images', 'alpha', 'notes.png'), 'png');

    const { failures } = await verifyPreviewImages({ root });

    expect(failures).toEqual([expect.stringContaining('Non-AVIF file in the preview image directory: alpha/notes.png')]);
  }, 30_000);
});
