import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { toString } from 'mdast-util-to-string';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import type { Heading, Root } from 'mdast';

export type SourceStatus = 'ready' | 'missing_source';
export type PreviewVariant = 'light' | 'dark';

export interface AwesomeDesignCatalogOptions {
  sourceRoot?: string;
  previewBasePath?: string;
}

export interface AwesomeDesignPreview {
  lightUrl: string;
  darkUrl: string;
  hasDedicatedLight: boolean;
  hasDedicatedDark: boolean;
  sourceLightPath: string | null;
  sourceDarkPath: string | null;
}

export interface AwesomeDesignEntry {
  slug: string;
  sourceKey: string;
  sourceDir: string;
  title: string;
  readmeTitle: string;
  summary: string;
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
const README_FILE = 'README.md';
const DESIGN_FILE = 'DESIGN.md';
const LIGHT_PREVIEW_FILE = 'preview.html';
const DARK_PREVIEW_FILE = 'preview-dark.html';

let defaultCatalogPromise: Promise<AwesomeDesignCatalog> | undefined;

export async function getAwesomeDesignCatalog(
  options: AwesomeDesignCatalogOptions = {},
): Promise<AwesomeDesignCatalog> {
  if (!options.sourceRoot && !options.previewBasePath) {
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
  const designRoot = path.join(sourceRoot, 'design-md');

  if (!(await pathExists(designRoot))) {
    return {
      entries: [],
      sourceRoot,
      sourceStatus: 'missing_source',
    };
  }

  const entryDirs = await readdir(designRoot, { withFileTypes: true });
  const entries = await Promise.all(
    entryDirs
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) =>
        loadCatalogEntry({
          designRoot,
          previewBasePath,
          sourceKey: dirent.name,
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
  sourceKey: string;
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

  const [readmeMarkdown, designMarkdown] = await Promise.all([
    readFile(readmePath, 'utf8'),
    readFile(designPath, 'utf8'),
  ]);

  const readmeTree = await parseMarkdown(readmeMarkdown);
  const designTree = await parseMarkdown(designMarkdown);
  const readmeTitle = extractFirstHeading(readmeTree) || startCase(input.sourceKey);
  const title = cleanupDisplayTitle(readmeTitle, input.sourceKey);
  const summary =
    extractFirstParagraph(readmeTree) ||
    extractFirstParagraph(designTree) ||
    `${title} design system reference, preview, and implementation notes.`;
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
    title,
    readmeTitle,
    summary,
    readmeMarkdown,
    designMarkdown,
    designDownloadUrl: getDesignDownloadPath(slug),
    readmeHtml: await renderMarkdownToHtml(readmeMarkdown),
    designHtml: await renderMarkdownToHtml(designMarkdown),
    searchText,
    preview: {
      lightUrl: `${input.previewBasePath}/${encodeURIComponent(slug)}/light.html`,
      darkUrl: `${input.previewBasePath}/${encodeURIComponent(slug)}/dark.html`,
      hasDedicatedLight: hasLightPreview,
      hasDedicatedDark: hasDarkPreview,
      sourceLightPath: hasLightPreview ? lightPreviewPath : null,
      sourceDarkPath: hasDarkPreview ? darkPreviewPath : null,
    },
  };
}

async function parseMarkdown(markdown: string): Promise<Root> {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const parsed = processor.parse(markdown) as Root;
  return (await processor.run(parsed)) as Root;
}

async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
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
