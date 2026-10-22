import type { AwesomeDesignEntry } from '@/lib/content/awesomeDesignCatalog';

/** Entries shown on the home hero stage, in rotation order. Missing slugs are skipped. */
export const FUSION_HERO_SLUGS = ['stripe', 'linear.app', 'spotify', 'ferrari', 'supabase'] as const;

export type FusionDocLineKind = 'h1' | 'h2' | 'label' | 'item';

export interface FusionDocLine {
  kind: FusionDocLineKind;
  text: string;
}

export interface FusionStage {
  slug: string;
  title: string;
  href: string;
  /** Tablet-width rendered page image; the stage shows its top at a fixed width. */
  lightImageUrl: string;
  darkImageUrl: string;
  /** Verbatim lines lifted from the entry's own DESIGN.md. */
  lines: FusionDocLine[];
  /** Hex colours that appear in the entry's DESIGN.md, in order of first mention. */
  palette: string[];
}

const MAX_LINE_LENGTH = 76;
const MAX_ITEMS = 3;
const MAX_PALETTE = 6;

function clip(text: string): string {
  if (text.length <= MAX_LINE_LENGTH) {
    return text;
  }

  const cut = text.slice(0, MAX_LINE_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > MAX_LINE_LENGTH * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function extractDocLines(markdown: string): FusionDocLine[] {
  const rows = markdown.split(/\r?\n/);
  const lines: FusionDocLine[] = [];

  const title = rows.find((row) => /^#\s+\S/.test(row));
  if (title) {
    lines.push({ kind: 'h1', text: clip(title.trim()) });
  }

  const section = rows.find((row) => /^##\s+\S/.test(row));
  if (section) {
    lines.push({ kind: 'h2', text: clip(section.trim()) });
  }

  const labelIndex = rows.findIndex((row) => /^\*\*[^*]+:\*\*\s*$/.test(row.trim()));
  if (labelIndex >= 0) {
    const items = rows
      .slice(labelIndex + 1)
      .filter((row) => row.trim() !== '')
      .slice(0, MAX_ITEMS)
      .filter((row) => /^[-*]\s+\S/.test(row.trim()));

    if (items.length > 0) {
      lines.push({ kind: 'label', text: rows[labelIndex].trim() });
      items.forEach((row) => lines.push({ kind: 'item', text: clip(row.trim()) }));
    }
  }

  return lines;
}

export function extractPalette(markdown: string): string[] {
  const seen = new Set<string>();

  for (const match of markdown.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    seen.add(match[0].toLowerCase());
    if (seen.size === MAX_PALETTE) {
      break;
    }
  }

  return [...seen];
}

export function buildFusionStages(
  entries: AwesomeDesignEntry[],
  toHref: (slug: string) => string,
  slugs: readonly string[] = FUSION_HERO_SLUGS,
): FusionStage[] {
  return slugs
    .map((slug) => entries.find((entry) => entry.slug === slug))
    .filter((entry): entry is AwesomeDesignEntry => entry !== undefined && entry.designMarkdown.length > 0)
    .map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      href: toHref(entry.slug),
      lightImageUrl: entry.preview.images.light.tablet.url,
      darkImageUrl: entry.preview.images.dark.tablet.url,
      lines: extractDocLines(entry.designMarkdown),
      palette: extractPalette(entry.designMarkdown),
    }));
}
