import { getRouteLocaleMetadata, isSupportedLocale, type SupportedLocale } from '@/i18n';
import { getHomeDescription, getSiteMeta, toLocalePath } from '@/config/site';
import { getAwesomeDesignCatalog, type AwesomeDesignEntry } from '@/lib/content/awesomeDesignCatalog';

const RSS_ENTRY_LIMIT = 50;

type RssEntry = Pick<AwesomeDesignEntry, 'slug' | 'title' | 'summary' | 'lastUpdated'>;

export function selectRssEntries(entries: readonly RssEntry[]): RssEntry[] {
  return [...entries]
    .sort((left, right) =>
      right.lastUpdated.getTime() - left.lastUpdated.getTime()
      || left.title.localeCompare(right.title, 'en', { sensitivity: 'base' }),
    )
    .slice(0, RSS_ENTRY_LIMIT);
}

export function createGalleryFeed(locale: SupportedLocale, entries: readonly RssEntry[]) {
  return {
    title: getSiteMeta(locale).name,
    description: getHomeDescription(locale, entries.length),
    items: selectRssEntries(entries).map((entry) => ({
      title: entry.title,
      description: entry.summary,
      link: toLocalePath(`/designs/${encodeURIComponent(entry.slug)}/`, locale),
      pubDate: entry.lastUpdated,
    })),
  }
}

export async function getGalleryFeed(route: string, lang: string) {
  if (!isSupportedLocale(route)) {
    throw new Error(`Unsupported RSS route locale: ${route}`);
  }
  const locale = route;
  const expectedLang = getRouteLocaleMetadata(locale).htmlLang;
  if (Intl.getCanonicalLocales(lang)[0] !== Intl.getCanonicalLocales(expectedLang)[0]) {
    throw new Error(`RSS route locale "${route}" does not match language "${lang}".`);
  }
  const { entries } = await getAwesomeDesignCatalog();
  return createGalleryFeed(locale, entries);
}
