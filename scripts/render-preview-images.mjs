import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import {
  DEFAULT_ROOT,
  ENCODE_SETTINGS,
  FONT_HOSTS,
  FULL_PAGE_WIDTHS,
  MAX_PAGE_HEIGHT,
  VARIANTS,
  formatManifest,
  imageFileRecord,
  imageRelativePath,
  measureBudget,
  otherVariant,
  readManifest,
  renderedRecord,
  reuseRecord,
  resolvePaths,
  scanVendorEntries,
  sha256File,
  thumbCrop,
  exists,
} from './preview-images-shared.mjs';

const VIEWPORT_HEIGHT = 900;
// Families a preview page declares that Google Fonts never serves. Their files come from the
// locally installed package (OFL) and are embedded as data: URLs, so no extra host is contacted.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_FONT_FILES = {
  'Commit Mono': path.join(SCRIPT_DIR, '..', 'node_modules', '@fontsource', 'commit-mono', 'files', 'commit-mono-latin-400-normal.woff2'),
};
const PAGE_TIMEOUT_MS = 60_000;
const FREEZE_CSS = '*, *::before, *::after { animation: none !important; transition: none !important; }';

export function isAllowedRequest(url, isNavigation) {
  if (isNavigation) {
    return false;
  }

  const { protocol, hostname } = new URL(url);

  if (protocol === 'data:' || protocol === 'blob:') {
    return true;
  }

  return protocol === 'https:' && FONT_HOSTS.includes(hostname);
}

// Every request except the font hosts is aborted. Aborted URLs are collected so the
// maintainer can review what the page tried to load.
export function createNetworkPolicy(blocked) {
  return async (route) => {
    const request = route.request();

    if (isAllowedRequest(request.url(), request.isNavigationRequest())) {
      return route.continue();
    }

    blocked.add(request.url());
    return route.abort('blockedbyclient');
  };
}

export function declaredFontFamilies(html) {
  const families = new Set();

  for (const [url] of html.matchAll(/https:\/\/fonts\.googleapis\.com\/[^"'\s<>)]+/gu)) {
    for (const family of new URL(url.replaceAll('&amp;', '&')).searchParams.getAll('family')) {
      families.add(family.split(':')[0]);
    }
  }

  return [...families];
}

export async function localFontFaceCss(family) {
  const file = LOCAL_FONT_FILES[family];

  if (!file) {
    return null;
  }

  const data = await readFile(file);
  return `@font-face { font-family: '${family}'; font-style: normal; font-weight: 400; font-display: block; src: url(data:font/woff2;base64,${data.toString('base64')}) format('woff2'); }`;
}

// Adds the local face for each declared family that Google did not provide, then waits until the
// face is loaded so the capture uses it rather than the fallback.
export async function addMissingLocalFonts(page, families) {
  const missing = await page.evaluate(async (names) => {
    await document.fonts.ready;
    return names.filter((name) => ![...document.fonts].some((face) => face.family.replace(/["']/gu, '') === name));
  }, families);

  for (const family of missing) {
    const css = await localFontFaceCss(family);

    if (css) {
      await page.addStyleTag({ content: css });
      await page.evaluate(async (name) => {
        await document.fonts.load(`400 16px "${name}"`);
      }, family);
    }
  }
}

// Fails the entry when a declared family has no @font-face at all, or when one of its
// faces errored. A fallback face must never be captured silently.
export async function assertFontsReady(page, families, label) {
  if (families.length === 0) {
    return;
  }

  const faces = await page.evaluate(async (names) => {
    await document.fonts.ready;

    return names.map((name) => {
      const matched = [...document.fonts].filter((face) => face.family.replace(/["']/gu, '') === name);

      return {
        name,
        count: matched.length,
        failed: matched.filter((face) => face.status === 'error').length,
      };
    });
  }, families);

  const problems = faces.flatMap((face) => {
    if (face.count === 0) {
      return [`"${face.name}" has no font face`];
    }

    return face.failed > 0 ? [`"${face.name}" failed to load`] : [];
  });

  if (problems.length > 0) {
    throw new Error(`Fonts did not load for ${label}: ${problems.join(', ')}`);
  }
}

// Captures one page at one width. Height is the full scroll height, capped at MAX_PAGE_HEIGHT,
// or the fixed crop height for the card thumbnail.
async function capturePage(browser, { html, variant, width, scale, cropHeight, blocked, families, label }) {
  const context = await browser.newContext({
    viewport: { width, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: scale,
    colorScheme: variant,
    reducedMotion: 'reduce',
  });

  try {
    const page = await context.newPage();
    await page.route('**/*', createNetworkPolicy(blocked));
    await page.setContent(html, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
    await page.addStyleTag({ content: FREEZE_CSS });
    await addMissingLocalFonts(page, families);
    await assertFontsReady(page, families, label);

    const pageHeight = await page.evaluate(() =>
      Math.ceil(Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0)),
    );
    const capped = cropHeight === undefined && pageHeight > MAX_PAGE_HEIGHT;
    const height = cropHeight ?? Math.min(pageHeight, MAX_PAGE_HEIGHT);
    const png = await page.screenshot({
      type: 'png',
      fullPage: true,
      clip: { x: 0, y: 0, width, height },
    });

    return { png, pageHeight, capped };
  } finally {
    await context.close();
  }
}

async function writeImage(imageDir, relativePath, buffer) {
  const target = path.join(imageDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);

  const metadata = await sharp(buffer).metadata();
  return imageFileRecord(relativePath, { width: metadata.width, height: metadata.height, bytes: buffer.length });
}

export async function renderVariant(browser, { slug, variant, sourcePath, sourceSha256, imageDir }) {
  const html = await readFile(sourcePath, 'utf8');
  const families = declaredFontFamilies(html);
  const label = `${slug} (${variant})`;
  const blocked = new Set();
  const files = {};
  let pageHeight = 0;
  let capped = false;

  for (const name of ['fit', 'tablet', 'mobile']) {
    const shot = await capturePage(browser, {
      html,
      variant,
      width: FULL_PAGE_WIDTHS[name],
      scale: 1,
      blocked,
      families,
      label,
    });
    const avif = await sharp(shot.png).avif(ENCODE_SETTINGS.full).toBuffer();

    files[name] = await writeImage(imageDir, imageRelativePath(slug, variant, name), avif);
    pageHeight = Math.max(pageHeight, shot.pageHeight);
    capped ||= shot.capped;
  }

  // The browser clip rounds to whole device pixels, so capture one CSS pixel more and cut
  // the exact card ratio from the top of that image.
  const crop = thumbCrop();
  const thumbShot = await capturePage(browser, {
    html,
    variant,
    width: crop.cssWidth,
    scale: crop.pixelWidth / crop.cssWidth,
    cropHeight: Math.ceil(crop.cssHeight),
    blocked,
    families,
    label,
  });
  const thumbAvif = await sharp(thumbShot.png)
    .extract({ left: 0, top: 0, width: crop.pixelWidth, height: crop.pixelHeight })
    .avif(ENCODE_SETTINGS.thumb)
    .toBuffer();
  files.thumb = await writeImage(imageDir, imageRelativePath(slug, variant, 'thumb'), thumbAvif);

  return {
    record: renderedRecord({ sourceSha256, capped, pageHeight, files }),
    blocked: [...blocked].sort(),
  };
}

/**
 * @param {Array<{ slug: string, sources: { light: string | null, dark: string | null } }>} entries
 * @param {{ manifest: { entries: Record<string, any> }, imageDir: string, only?: string, force?: boolean }} options
 */
export async function planRenderJobs(entries, { manifest, imageDir, only, force = false }) {
  const selected = only ? entries.filter((entry) => entry.slug === only) : entries;

  if (only && selected.length === 0) {
    throw new Error(`Unknown design entry "${only}". Check the slug against vendor/awesome-design-md/design-md.`);
  }

  const jobs = [];

  for (const entry of selected) {
    for (const variant of VARIANTS) {
      const sourcePath = entry.sources[variant];

      if (!sourcePath) {
        jobs.push({ slug: entry.slug, variant, action: 'reuse', reuses: otherVariant(variant) });
        continue;
      }

      const sourceSha256 = await sha256File(sourcePath);
      const record = manifest.entries[entry.slug]?.[variant];
      const unchanged =
        record?.sourceSha256 === sourceSha256 &&
        (await Promise.all(
          Object.values(record.files ?? {}).map((file) => exists(path.join(imageDir, file.path))),
        )).every(Boolean);

      jobs.push({
        slug: entry.slug,
        variant,
        action: unchanged && !force ? 'skip' : 'render',
        sourcePath,
        sourceSha256,
      });
    }
  }

  return jobs;
}

function setRecord(manifest, slug, variant, record) {
  manifest.entries[slug] ??= {};
  manifest.entries[slug][variant] = record;
}

async function writeManifest(manifestPath, manifest) {
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, formatManifest(manifest));
}

export async function runRender({ root = DEFAULT_ROOT, only, force = false }, log = console.log) {
  const paths = resolvePaths(root);
  const entries = await scanVendorEntries(paths.sourceRoot);
  const manifest = await readManifest(paths.manifestPath);
  const jobs = await planRenderJobs(entries, { manifest, imageDir: paths.imageDir, only, force });
  const report = { rendered: 0, skipped: 0, reused: 0, failures: [], blocked: [] };
  const browser = jobs.some((job) => job.action === 'render') ? await launchBrowser() : undefined;

  try {
    for (const [index, job] of jobs.entries()) {
      const prefix = `[${index + 1}/${jobs.length}] ${job.slug} ${job.variant}`;

      if (job.action === 'skip') {
        report.skipped += 1;
        log(`${prefix}: skipped, source unchanged`);
        continue;
      }

      if (job.action === 'reuse') {
        setRecord(manifest, job.slug, job.variant, reuseRecord(job.reuses));
        report.reused += 1;
        log(`${prefix}: reuses the ${job.reuses} images`);
        continue;
      }

      log(`${prefix}: rendering`);

      try {
        const { record, blocked } = await renderVariant(browser, {
          slug: job.slug,
          variant: job.variant,
          sourcePath: job.sourcePath,
          sourceSha256: job.sourceSha256,
          imageDir: paths.imageDir,
        });

        setRecord(manifest, job.slug, job.variant, record);
        await writeManifest(paths.manifestPath, manifest);
        report.rendered += 1;
        report.blocked.push(...blocked.map((url) => `${job.slug} ${job.variant}: ${url}`));
        log(`${prefix}: fit ${record.files.fit.width}×${record.files.fit.height}, capped=${record.capped}`);
      } catch (error) {
        report.failures.push(`${job.slug} ${job.variant}: ${error.message}`);
        log(`${prefix}: FAILED ${error.message}`);
      }
    }
  } finally {
    await browser?.close();
  }

  await writeManifest(paths.manifestPath, manifest);

  const budget = await measureBudget(paths.imageDir, manifest);
  return { ...report, budget, manifest };
}

async function launchBrowser() {
  const { chromium } = await import('playwright');
  return chromium.launch({ headless: true });
}

export function parseRenderArgs(argv) {
  const options = { only: undefined, force: false, root: DEFAULT_ROOT };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--force') {
      options.force = true;
    } else if (arg === '--only' || arg === '--root') {
      const value = argv[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} needs a value`);
      }

      options[arg.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown option ${arg}`);
    }
  }

  return options;
}

export async function main(argv = process.argv.slice(2), log = console.log) {
  const options = parseRenderArgs(argv);
  const report = await runRender(options, log);

  log('');
  log(`Rendered ${report.rendered}, skipped ${report.skipped}, reused ${report.reused}.`);
  log(`Total ${(report.budget.totalBytes / (1024 * 1024)).toFixed(2)} MB across the manifest.`);
  log('Largest files:');
  for (const file of report.budget.largest.slice(0, 5)) {
    log(`  ${file.path} ${(file.bytes / 1024).toFixed(0)} KB`);
  }

  if (report.blocked.length > 0) {
    log('Blocked external requests (review, then accept or fix the source):');
    for (const url of report.blocked) {
      log(`  ${url}`);
    }
  }

  const failures = [...report.failures, ...report.budget.offenders];

  if (failures.length > 0) {
    log('Preview image render failed:');
    for (const failure of failures) {
      log(`  ${failure}`);
    }
    return 1;
  }

  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
