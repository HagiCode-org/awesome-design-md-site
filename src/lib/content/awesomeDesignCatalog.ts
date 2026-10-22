import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { toString } from 'mdast-util-to-string';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import type { Heading, Root } from 'mdast';
import previewImageManifestData from '../../data/preview-images.json';

export type SourceStatus = 'ready' | 'missing_source';
export type PreviewVariant = 'light' | 'dark';
export type PreviewImageName = 'fit' | 'tablet' | 'mobile' | 'thumb';

export interface AwesomeDesignCatalogOptions {
  sourceRoot?: string;
  previewBasePath?: string;
  previewImageManifest?: PreviewImageManifest;
}

export interface PreviewImageFile {
  url: string;
  width: number;
  height: number;
}

export type PreviewImageSet = Record<PreviewImageName, PreviewImageFile>;

export interface AwesomeDesignPreview {
  lightUrl: string;
  darkUrl: string;
  hasDedicatedLight: boolean;
  hasDedicatedDark: boolean;
  sourceLightPath: string | null;
  sourceDarkPath: string | null;
  images: Record<PreviewVariant, PreviewImageSet>;
}

export interface PreviewImageFileRecord {
  path: string;
  width: number;
  height: number;
  bytes: number;
}

export type PreviewImageRecord =
  | { reuses: PreviewVariant }
  | {
      sourceSha256: string;
      capped: boolean;
      pageHeight: number;
      files: Record<PreviewImageName, PreviewImageFileRecord>;
    };

export interface PreviewImageManifest {
  version: number;
  entries: Record<string, Partial<Record<PreviewVariant, PreviewImageRecord>>>;
}

export interface AwesomeDesignEntry {
  slug: string;
  sourceKey: string;
  sourceDir: string;
  lastUpdated: Date;
  title: string;
  readmeTitle: string;
  summary: string;
  seoDescription: string;
  readmeMarkdown: string;
  designMarkdown: string;
  designDownloadUrl: string;
  readmeHtml: string;
  designHtml: string;
  searchText: string;
  preview: AwesomeDesignPreview;
}

export interface AwesomeDesignCatalog {
  entries: AwesomeDesignEntry[];
  sourceRoot: string;
  sourceStatus: SourceStatus;
}

const REPO_ROOT = process.cwd();
const DEFAULT_SOURCE_ROOT = path.join(REPO_ROOT, 'vendor', 'awesome-design-md');
const DEFAULT_PREVIEW_BASE_PATH = '/previews';
const PREVIEW_IMAGE_BASE_PATH = '/preview-images';
const DEFAULT_PREVIEW_IMAGE_MANIFEST = previewImageManifestData as PreviewImageManifest;
const README_FILE = 'README.md';
const DESIGN_FILE = 'DESIGN.md';
const LIGHT_PREVIEW_FILE = 'preview.html';
const DARK_PREVIEW_FILE = 'preview-dark.html';
const execFileAsync = promisify(execFile);

let defaultCatalogPromise: Promise<AwesomeDesignCatalog> | undefined;

export async function getAwesomeDesignCatalog(
  options: AwesomeDesignCatalogOptions = {},
): Promise<AwesomeDesignCatalog> {
  if (!options.sourceRoot && !options.previewBasePath && !options.previewImageManifest) {
    defaultCatalogPromise ??= loadAwesomeDesignCatalog(options);
    return defaultCatalogPromise;
  }

  return loadAwesomeDesignCatalog(options);
}

export async function getAwesomeDesignEntryBySlug(
  slug: string,
  options: AwesomeDesignCatalogOptions = {},
): Promise<AwesomeDesignEntry | undefined> {
  const catalog = await getAwesomeDesignCatalog(options);
  return catalog.entries.find((entry) => entry.slug === slug);
}

export function getAdjacentDesignEntries(
  entries: AwesomeDesignEntry[],
  slug: string,
): {
  previous?: AwesomeDesignEntry;
  next?: AwesomeDesignEntry;
} {
  const currentIndex = entries.findIndex((entry) => entry.slug === slug);

  if (currentIndex < 0) {
    return {};
  }

  return {
    previous: entries[currentIndex - 1],
    next: entries[currentIndex + 1],
  };
}

export async function loadPublishedPreviewHtml(
  slug: string,
  variant: PreviewVariant,
  options: AwesomeDesignCatalogOptions = {},
): Promise<string> {
  const entry = await getAwesomeDesignEntryBySlug(slug, options);

  if (!entry) {
    throw new Error(`Unknown design entry: ${slug}`);
  }

  const targetPath =
    variant === 'dark'
      ? entry.preview.sourceDarkPath ?? entry.preview.sourceLightPath
      : entry.preview.sourceLightPath ?? entry.preview.sourceDarkPath;

  if (!targetPath) {
    throw new Error(`No preview asset available for design entry: ${slug}`);
  }

  return readFile(targetPath, 'utf8');
}

export async function loadPublishedDesignMarkdown(
  slug: string,
  options: AwesomeDesignCatalogOptions = {},
): Promise<string> {
  const entry = await getAwesomeDesignEntryBySlug(slug, options);

  if (!entry) {
    throw new Error(`Unknown design entry: ${slug}`);
  }

  return entry.designMarkdown;
}

async function loadAwesomeDesignCatalog(
  options: AwesomeDesignCatalogOptions = {},
): Promise<AwesomeDesignCatalog> {
  const sourceRoot = options.sourceRoot ?? DEFAULT_SOURCE_ROOT;
  const previewBasePath = options.previewBasePath ?? DEFAULT_PREVIEW_BASE_PATH;
  const previewImageManifest = options.previewImageManifest ?? DEFAULT_PREVIEW_IMAGE_MANIFEST;
  const designRoot = path.join(sourceRoot, 'design-md');

  if (!(await pathExists(designRoot))) {
    return {
      entries: [],
      sourceRoot,
      sourceStatus: 'missing_source',
    };
  }

  const entryDirs = await readdir(designRoot, { withFileTypes: true });
  const { byEntry: lastUpdatedByEntry, fallback: sourceUpdatedAt } =
    await getLastUpdatedBySourceKey(sourceRoot);
  const entries = await Promise.all(
    entryDirs
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) =>
        loadCatalogEntry({
          designRoot,
          previewBasePath,
          previewImageManifest,
          sourceKey: dirent.name,
          lastUpdated: lastUpdatedByEntry.get(dirent.name) ?? sourceUpdatedAt,
        }),
      ),
  );

  entries.sort((left, right) =>
    left.title.localeCompare(right.title, 'en', { sensitivity: 'base' }),
  );

  return {
    entries,
    sourceRoot,
    sourceStatus: 'ready',
  };
}

async function loadCatalogEntry(input: {
  designRoot: string;
  previewBasePath: string;
  previewImageManifest: PreviewImageManifest;
  sourceKey: string;
  lastUpdated: Date;
}): Promise<AwesomeDesignEntry> {
  const sourceDir = path.join(input.designRoot, input.sourceKey);
  const readmePath = path.join(sourceDir, README_FILE);
  const designPath = path.join(sourceDir, DESIGN_FILE);
  const lightPreviewPath = path.join(sourceDir, LIGHT_PREVIEW_FILE);
  const darkPreviewPath = path.join(sourceDir, DARK_PREVIEW_FILE);

  const hasReadme = await pathExists(readmePath);
  const hasDesign = await pathExists(designPath);
  const hasLightPreview = await pathExists(lightPreviewPath);
  const hasDarkPreview = await pathExists(darkPreviewPath);

  const missingFiles = [
    !hasReadme && README_FILE,
    !hasDesign && DESIGN_FILE,
    !hasLightPreview && !hasDarkPreview && `${LIGHT_PREVIEW_FILE} or ${DARK_PREVIEW_FILE}`,
  ].filter(Boolean);

  if (missingFiles.length > 0) {
    throw new Error(
      `Invalid design entry "${input.sourceKey}": missing ${missingFiles.join(', ')} in ${sourceDir}`,
    );
  }

  const images = resolvePreviewImages(input.sourceKey, input.previewImageManifest);
  const screenshots = { light: images.light.fit, dark: images.dark.fit };
  const [readmeMarkdown, designMarkdown] = await Promise.all([
    readFile(readmePath, 'utf8'),
    readFile(designPath, 'utf8'),
  ]);

  const readmeTree = await parseMarkdown(readmeMarkdown);
  const designTree = await parseMarkdown(designMarkdown);
  const readmeTitle = extractFirstHeading(readmeTree) || startCase(input.sourceKey);
  const readmeDisplayTitle = cleanupDisplayTitle(readmeTitle, input.sourceKey);
  // README headings are often mis-cased upstream ("Bmw", "Mongodb"); DESIGN.md keeps the brand casing.
  const designHeading = extractFirstHeading(designTree);
  const designDisplayTitle = designHeading ? cleanupDisplayTitle(designHeading, input.sourceKey) : null;
  const title =
    designDisplayTitle && designDisplayTitle.toLowerCase() === readmeDisplayTitle.toLowerCase()
      ? designDisplayTitle
      : readmeDisplayTitle;
  const summary =
    extractFirstParagraph(readmeTree) ||
    extractFirstParagraph(designTree) ||
    `${title} design system reference, preview, and implementation notes.`;
  const seoDescription = buildSeoDescription(extractDesignThemeParagraph(designTree), summary);
  const searchText = normalizeWhitespace(
    [title, summary, toString(readmeTree), toString(designTree)]
      .join(' ')
      .toLocaleLowerCase('en'),
  );
  const slug = input.sourceKey;

  return {
    slug,
    sourceKey: input.sourceKey,
    sourceDir,
    lastUpdated: input.lastUpdated,
    title,
    readmeTitle,
    summary,
    seoDescription,
    readmeMarkdown,
    designMarkdown,
    designDownloadUrl: getDesignDownloadPath(slug),
    readmeHtml: await renderMarkdownToHtml(readmeMarkdown, screenshots),
    designHtml: await renderMarkdownToHtml(designMarkdown, screenshots),
    searchText,
    preview: {
      lightUrl: `${input.previewBasePath}/${encodeURIComponent(slug)}/light.html`,
      darkUrl: `${input.previewBasePath}/${encodeURIComponent(slug)}/dark.html`,
      hasDedicatedLight: hasLightPreview,
      hasDedicatedDark: hasDarkPreview,
      sourceLightPath: hasLightPreview ? lightPreviewPath : null,
      sourceDarkPath: hasDarkPreview ? darkPreviewPath : null,
      images,
    },
  };
}

// The gallery shows rendered images, so an entry without a manifest record must not load.
// A dark variant without its own render reuses the light set, the same as the HTML fallback.
function resolvePreviewImages(
  slug: string,
  manifest: PreviewImageManifest,
): Record<PreviewVariant, PreviewImageSet> {
  const record = manifest.entries[slug];
  const resolveVariant = (variant: PreviewVariant): PreviewImageSet => {
    const variantRecord = record?.[variant];

    if (!variantRecord) {
      throw new Error(missingPreviewImagesMessage(slug));
    }

    if ('reuses' in variantRecord) {
      const source = record?.[variantRecord.reuses];

      if (!source || 'reuses' in source) {
        throw new Error(`Preview images for design entry "${slug}" (${variant}) reuse ${variantRecord.reuses}, which has no rendered set.`);
      }

      return toPreviewImageSet(source.files);
    }

    return toPreviewImageSet(variantRecord.files);
  };

  return {
    light: resolveVariant('light'),
    dark: resolveVariant('dark'),
  };
}

function missingPreviewImagesMessage(slug: string): string {
  return `Preview images are missing for design entry "${slug}". Run \`npm run previews:render -- --only ${slug}\` and commit the output.`;
}

function toPreviewImageSet(files: Record<PreviewImageName, PreviewImageFileRecord>): PreviewImageSet {
  return {
    fit: toPreviewImageFile(files.fit),
    tablet: toPreviewImageFile(files.tablet),
    mobile: toPreviewImageFile(files.mobile),
    thumb: toPreviewImageFile(files.thumb),
  };
}

function toPreviewImageFile(file: PreviewImageFileRecord): PreviewImageFile {
  return {
    url: `${PREVIEW_IMAGE_BASE_PATH}/${file.path.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`,
    width: file.width,
    height: file.height,
  };
}

async function getLastUpdatedBySourceKey(sourceRoot: string): Promise<{
  byEntry: Map<string, Date>;
  fallback: Date;
}> {
  const [{ stdout: history }, { stdout: headTimestamp }] = await Promise.all([
    execFileAsync('git', ['log', '--format=%ct', '--name-only', '--', 'design-md'], {
      cwd: sourceRoot,
      maxBuffer: 8 * 1024 * 1024,
    }),
    execFileAsync('git', ['log', '-1', '--format=%ct'], { cwd: sourceRoot }),
  ]);
  const fallbackTimestamp = Number(headTimestamp.trim());
  if (!Number.isFinite(fallbackTimestamp)) {
    throw new Error(`Unable to determine the source revision date in ${sourceRoot}.`);
  }

  const byEntry = new Map<string, Date>();
  let timestamp: number | undefined;
  for (const line of history.split(/\r?\n/u)) {
    if (/^\d+$/u.test(line)) {
      timestamp = Number(line);
      continue;
    }

    const sourceKey = line.match(/^design-md\/([^/]+)\//u)?.[1];
    if (sourceKey && timestamp !== undefined && !byEntry.has(sourceKey)) {
      byEntry.set(sourceKey, new Date(timestamp * 1000));
    }
  }

  return { byEntry, fallback: new Date(fallbackTimestamp * 1000) };
}

async function parseMarkdown(markdown: string): Promise<Root> {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const parsed = processor.parse(markdown) as Root;
  return (await processor.run(parsed)) as Root;
}

async function renderMarkdownToHtml(
  markdown: string,
  screenshots: Record<PreviewVariant, PreviewImageFile>,
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkReplaceLegacyScreenshots, screenshots)
    .use(remarkRehype)
    .use(rehypeDemoteH1)
    .use(rehypeLazyPreviewImages)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

// Upstream READMEs embed old light/dark screenshots hosted on Cloudflare R2. They are rewritten
// to this entry's locally rendered full-page Fit image for the same variant. The vendor Markdown
// itself is not changed.
const LEGACY_SCREENSHOT_HOST_SUFFIX = '.r2.dev';

function isLegacyScreenshotUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(LEGACY_SCREENSHOT_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function isLegacyScreenshotParagraph(node: Root['children'][number]): boolean {
  if (node.type !== 'paragraph') {
    return false;
  }

  const images = node.children.filter((child) => child.type === 'image');
  const onlyImagesAndSpace = node.children.every(
    (child) => child.type === 'image' || (child.type === 'text' && child.value.trim() === ''),
  );

  return onlyImagesAndSpace && images.length > 0 && images.every((image) => isLegacyScreenshotUrl(image.url));
}

function remarkReplaceLegacyScreenshots(screenshots: Record<PreviewVariant, PreviewImageFile>) {
  return (tree: Root) => {
    for (const node of tree.children) {
      if (!isLegacyScreenshotParagraph(node)) {
        continue;
      }

      for (const child of node.children) {
        if (child.type === 'image') {
          child.url = /dark/iu.test(child.url) ? screenshots.dark.url : screenshots.light.url;
        }
      }
    }
  };
}

const PREVIEW_IMAGE_LAZY_PREFIX = `${PREVIEW_IMAGE_BASE_PATH}/`;

function rehypeLazyPreviewImages() {
  return (tree: unknown) => {
    visit(tree as Root, (node) => {
      const element = node as unknown as { type: string; tagName?: string; properties?: Record<string, unknown> };
      if (element.type === 'element' && element.tagName === 'img' && String(element.properties?.src ?? '').startsWith(PREVIEW_IMAGE_LAZY_PREFIX)) {
        element.properties = { ...element.properties, loading: 'lazy', decoding: 'async' };
      }
    });
  };
}

// The detail page already owns the single <h1> (the entry title). Imported
// documents start with their own "# ..." heading, so demote it to keep one <h1> per page.
function rehypeDemoteH1() {
  return (tree: unknown) => {
    visit(tree as Root, (node) => {
      const element = node as unknown as { type: string; tagName?: string };
      if (element.type === 'element' && element.tagName === 'h1') {
        element.tagName = 'h2';
      }
    });
  };
}

// First paragraph under the first "##" section of DESIGN.md (the visual theme overview).
// It is brand-specific, unlike the README summary that is identical across entries.
function extractDesignThemeParagraph(tree: Root): string | null {
  let seenSection = false;

  for (const child of tree.children) {
    if (child.type === 'heading') {
      if (seenSection) {
        return null;
      }
      seenSection = (child as Heading).depth === 2;
      continue;
    }

    if (seenSection && child.type === 'paragraph') {
      const value = normalizeWhitespace(toString(child));
      if (value) {
        return value;
      }
    }
  }

  return null;
}

const SEO_DESCRIPTION_MAX_LENGTH = 155;

export function buildSeoDescription(primary: string | null, fallback: string): string {
  const source = normalizeWhitespace(primary || fallback);

  if (source.length <= SEO_DESCRIPTION_MAX_LENGTH) {
    return source;
  }

  const cut = source.slice(0, SEO_DESCRIPTION_MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-—–]+$/, '');

  return `${trimmed}…`;
}

function extractFirstHeading(tree: Root): string | null {
  let value: string | null = null;

  visit(tree, 'heading', (node) => {
    const heading = node as Heading;

    if (value || heading.depth !== 1) {
      return;
    }

    value = normalizeWhitespace(toString(heading));
  });

  return value;
}

function extractFirstParagraph(tree: Root): string | null {
  for (const child of tree.children) {
    if (child.type !== 'paragraph') {
      continue;
    }

    const value = normalizeWhitespace(toString(child));

    if (value) {
      return value;
    }
  }

  return null;
}

function cleanupDisplayTitle(value: string, sourceKey: string): string {
  const normalized = normalizeWhitespace(
    value
      .replace(/\s+Inspired Design System$/i, '')
      .replace(/^Design System Inspiration of\s+/i, ''),
  );

  return normalized || startCase(sourceKey);
}

function startCase(value: string): string {
  return value
    .split(/[.\-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function getDesignDownloadPath(slug: string): string {
  return `/designs/${encodeURIComponent(slug)}/DESIGN.md`;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
