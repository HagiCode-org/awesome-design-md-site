import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import {
  DEFAULT_ROOT,
  IMAGE_NAMES,
  RENDER_COMMAND,
  VARIANTS,
  exists,
  expectedPixelWidth,
  otherVariant,
  readManifest,
  resolvePaths,
  scanVendorEntries,
  sha256File,
  thumbCrop,
} from './preview-images-shared.mjs';

function renderHint(slug) {
  return `Run: ${RENDER_COMMAND} --only ${slug}`;
}

export function isAvifBytes(bytes) {
  const brand = bytes.subarray(8, 12).toString('latin1');

  return bytes.subarray(4, 8).toString('latin1') === 'ftyp' && ['avif', 'avis'].includes(brand);
}

async function listFiles(directory, prefix = '') {
  if (!(await exists(directory))) {
    return [];
  }

  const found = [];

  for (const dirent of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${dirent.name}` : dirent.name;

    if (dirent.isDirectory()) {
      found.push(...(await listFiles(path.join(directory, dirent.name), relative)));
    } else {
      found.push(relative);
    }
  }

  return found;
}

async function verifyFile(imageDir, slug, variant, name, file, failures) {
  const label = `"${slug}" (${variant}, ${name})`;
  const target = path.join(imageDir, file.path);

  if (!(await exists(target))) {
    failures.push(`Missing preview image ${label}: ${file.path}. ${renderHint(slug)}`);
    return;
  }

  const bytes = await readFile(target);

  if (!isAvifBytes(bytes)) {
    failures.push(`Preview image ${label} is not AVIF: ${file.path}. ${renderHint(slug)}`);
    return;
  }

  let metadata;

  try {
    metadata = await sharp(bytes).metadata();
  } catch {
    failures.push(`Preview image ${label} does not decode: ${file.path}. ${renderHint(slug)}`);
    return;
  }

  const expected = name === 'thumb' ? thumbCrop() : undefined;
  const expectedWidth = expectedPixelWidth(name);
  const expectedHeight = expected?.pixelHeight;

  if (
    metadata.width !== expectedWidth ||
    (expectedHeight !== undefined && metadata.height !== expectedHeight) ||
    metadata.width !== file.width ||
    metadata.height !== file.height
  ) {
    failures.push(
      `Preview image ${label} has the wrong dimensions: ${file.path} is ${metadata.width}×${metadata.height}, ` +
        `the manifest says ${file.width}×${file.height}. ${renderHint(slug)}`,
    );
  }
}

export async function verifyPreviewImages({ root = DEFAULT_ROOT } = {}) {
  const paths = resolvePaths(root);
  const entries = await scanVendorEntries(paths.sourceRoot);
  const manifest = await readManifest(paths.manifestPath);
  const failures = [];
  const referenced = new Set();
  const catalogSlugs = new Set(entries.map((entry) => entry.slug));

  for (const entry of entries) {
    const record = manifest.entries[entry.slug];

    if (!record) {
      failures.push(`Preview images are missing for design entry "${entry.slug}". ${renderHint(entry.slug)}`);
      continue;
    }

    for (const variant of VARIANTS) {
      const variantRecord = record[variant];
      const source = entry.sources[variant];

      if (!variantRecord) {
        failures.push(`Preview images for "${entry.slug}" (${variant}) have no manifest record. ${renderHint(entry.slug)}`);
        continue;
      }

      if (!source) {
        if (variantRecord.reuses !== otherVariant(variant)) {
          failures.push(
            `Manifest for "${entry.slug}" (${variant}) must reuse the ${otherVariant(variant)} images. ${renderHint(entry.slug)}`,
          );
        }
        continue;
      }

      if (variantRecord.reuses !== undefined) {
        failures.push(
          `"${entry.slug}" has a ${variant} preview page, but its manifest record reuses another variant. ${renderHint(entry.slug)}`,
        );
        continue;
      }

      if (variantRecord.sourceSha256 !== (await sha256File(source))) {
        failures.push(
          `Preview images for "${entry.slug}" (${variant}) are stale: ${path.relative(paths.root, source)} changed after rendering. ${renderHint(entry.slug)}`,
        );
      }

      for (const name of IMAGE_NAMES) {
        const file = variantRecord.files?.[name];

        if (!file) {
          failures.push(`Manifest for "${entry.slug}" (${variant}) has no ${name} image. ${renderHint(entry.slug)}`);
          continue;
        }

        referenced.add(file.path);
        await verifyFile(paths.imageDir, entry.slug, variant, name, file, failures);
      }
    }
  }

  for (const slug of Object.keys(manifest.entries)) {
    if (!catalogSlugs.has(slug)) {
      failures.push(
        `Orphan preview record "${slug}": no design entry with that slug exists. Remove it from ${path.relative(paths.root, paths.manifestPath)} and delete public/preview-images/${slug}.`,
      );
    }
  }

  for (const file of await listFiles(paths.imageDir)) {
    if (!file.endsWith('.avif')) {
      failures.push(`Non-AVIF file in the preview image directory: ${file}. Only .avif files may be published.`);
    } else if (!referenced.has(file)) {
      failures.push(`Orphan preview image ${file} is not listed in the manifest. Delete it, or ${renderHint(file.split('/')[0])}.`);
    }
  }

  return { failures, checked: entries.length };
}

export async function main(argv = process.argv.slice(2), log = console.log) {
  const rootIndex = argv.indexOf('--root');
  const root = rootIndex >= 0 ? argv[rootIndex + 1] : DEFAULT_ROOT;
  const { failures, checked } = await verifyPreviewImages({ root });

  if (failures.length > 0) {
    log('Preview image verification failed:');
    for (const failure of failures) {
      log(`  - ${failure}`);
    }
    return 1;
  }

  log(`Preview images verified for ${checked} design entries.`);
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
