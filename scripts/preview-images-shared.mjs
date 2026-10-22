import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RENDER_COMMAND = 'npm run previews:render';
export const MANIFEST_VERSION = 1;
export const VARIANTS = ['light', 'dark'];
export const SOURCE_FILES = { light: 'preview.html', dark: 'preview-dark.html' };
export const FULL_PAGE_WIDTHS = { fit: 1440, tablet: 820, mobile: 390 };
export const IMAGE_NAMES = ['fit', 'tablet', 'mobile', 'thumb'];
export const CARD_ASPECT = { width: 4, height: 5.8 };
export const THUMB_CSS_WIDTH = 390;
export const THUMB_SCALE = 2;
export const MAX_PAGE_HEIGHT = 8000;
export const FILE_BUDGET_BYTES = 1024 * 1024;
export const TOTAL_BUDGET_BYTES = 60 * 1024 * 1024;
export const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
export const ENCODE_SETTINGS = {
  full: { quality: 50, effort: 4, chromaSubsampling: '4:2:0' },
  thumb: { quality: 55, effort: 4, chromaSubsampling: '4:2:0' },
};

export function resolvePaths(root = DEFAULT_ROOT) {
  return {
    root,
    sourceRoot: path.join(root, 'vendor', 'awesome-design-md'),
    imageDir: path.join(root, 'public', 'preview-images'),
    manifestPath: path.join(root, 'src', 'data', 'preview-images.json'),
  };
}

// The card frame is 4 : 5.8, so the thumbnail is the top of the mobile layout at 2x
// with a height that keeps the same ratio. 390 CSS px at 2x gives 780 x 1131 device px.
export function thumbCrop() {
  const cssHeight = (THUMB_CSS_WIDTH * CARD_ASPECT.height) / CARD_ASPECT.width;
  const pixelWidth = THUMB_CSS_WIDTH * THUMB_SCALE;
  const pixelHeight = Math.round(cssHeight * THUMB_SCALE);

  return { cssWidth: THUMB_CSS_WIDTH, cssHeight, pixelWidth, pixelHeight };
}

export function expectedPixelWidth(name) {
  return name === 'thumb' ? thumbCrop().pixelWidth : FULL_PAGE_WIDTHS[name];
}

export function otherVariant(variant) {
  return variant === 'dark' ? 'light' : 'dark';
}

export async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function sha256File(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

// Same entry rule as src/lib/content/awesomeDesignCatalog.ts: a directory under design-md
// needs README.md, DESIGN.md and at least one preview page.
export async function scanVendorEntries(sourceRoot) {
  const designRoot = path.join(sourceRoot, 'design-md');
  const dirents = await readdir(designRoot, { withFileTypes: true });
  const entries = [];

  for (const dirent of dirents.filter((item) => item.isDirectory()).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const sourceDir = path.join(designRoot, dirent.name);
    const sources = {};

    for (const variant of VARIANTS) {
      const sourcePath = path.join(sourceDir, SOURCE_FILES[variant]);
      sources[variant] = (await exists(sourcePath)) ? sourcePath : null;
    }

    const missing = [
      !(await exists(path.join(sourceDir, 'README.md'))) && 'README.md',
      !(await exists(path.join(sourceDir, 'DESIGN.md'))) && 'DESIGN.md',
      !sources.light && !sources.dark && 'preview.html or preview-dark.html',
    ].filter(Boolean);

    if (missing.length > 0) {
      throw new Error(`Invalid design entry "${dirent.name}": missing ${missing.join(', ')} in ${sourceDir}`);
    }

    entries.push({ slug: dirent.name, sources });
  }

  return entries;
}

export function emptyManifest() {
  return { version: MANIFEST_VERSION, entries: {} };
}

export async function readManifest(manifestPath) {
  let raw;

  try {
    raw = await readFile(manifestPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return emptyManifest();
    }

    throw error;
  }

  const manifest = JSON.parse(raw);

  if (manifest.version !== MANIFEST_VERSION) {
    throw new Error(`Unsupported preview image manifest version ${manifest.version} in ${manifestPath}`);
  }

  return manifest;
}

// Slugs are sorted and each record is built with a fixed key order, so a second run with
// unchanged inputs writes byte-identical JSON.
export function formatManifest(manifest) {
  const entries = {};

  for (const slug of Object.keys(manifest.entries).sort()) {
    entries[slug] = manifest.entries[slug];
  }

  return `${JSON.stringify({ version: MANIFEST_VERSION, entries }, null, 2)}\n`;
}

export function renderedRecord({ sourceSha256, capped, pageHeight, files }) {
  return {
    sourceSha256,
    capped,
    pageHeight,
    files: Object.fromEntries(IMAGE_NAMES.map((name) => [name, files[name]])),
  };
}

export function reuseRecord(reuses) {
  return { reuses };
}

export function imageFileRecord(relativePath, { width, height, bytes }) {
  return { path: relativePath, width, height, bytes };
}

export function imageRelativePath(slug, variant, name) {
  return `${slug}/${variant}-${name}.avif`;
}

export function recordedFiles(manifest) {
  const files = [];

  for (const record of Object.values(manifest.entries)) {
    for (const variant of VARIANTS) {
      const variantRecord = record[variant];

      if (variantRecord?.files) {
        files.push(...Object.values(variantRecord.files));
      }
    }
  }

  return files;
}

export async function measureBudget(imageDir, manifest, budget = {}) {
  const fileBudget = budget.fileBytes ?? FILE_BUDGET_BYTES;
  const totalBudget = budget.totalBytes ?? TOTAL_BUDGET_BYTES;
  const files = [];

  for (const file of recordedFiles(manifest)) {
    const bytes = (await stat(path.join(imageDir, file.path))).size;
    files.push({ path: file.path, bytes });
  }

  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 10);
  const offenders = files
    .filter((file) => file.bytes > fileBudget)
    .map((file) => `${file.path} is ${formatBytes(file.bytes)}, over the ${formatBytes(fileBudget)} per-file budget`);

  if (totalBytes > totalBudget) {
    offenders.push(
      `the set totals ${formatBytes(totalBytes)}, over the ${formatBytes(totalBudget)} directory budget`,
    );
  }

  return { totalBytes, largest, offenders };
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
