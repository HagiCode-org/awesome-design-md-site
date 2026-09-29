import { generateRssFeed } from '@hagicode/hagilight/rss';
import { getRouteLocaleMetadata, type SupportedLocale } from '@/i18n';
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

export async function generateGalleryRss(locale: SupportedLocale, site: URL | undefined, feedPath: string) {
  if (!site) throw new Error('The Astro site URL is required to generate the RSS feed.');
  const { entries } = await getAwesomeDesignCatalog();
  const metadata = getRouteLocaleMetadata(locale);

  const response = await generateRssFeed({
    site,
    title: getSiteMeta(locale).name,
    description: getHomeDescription(locale, entries.length),
    language: metadata.htmlLang,
    items: selectRssEntries(entries).map((entry) => ({
      title: entry.title,
      description: entry.summary,
      link: toLocalePath(`/designs/${encodeURIComponent(entry.slug)}/`, locale),
      pubDate: entry.lastUpdated,
    })),
  });
  const xml = await response.text();
  const feedUrl = new URL(feedPath, site).href.replaceAll('&', '&amp;');
  if (!xml.includes('<rss version="2.0">') || !xml.includes('<channel>')) {
    throw new Error('Hagilight generated RSS XML with an unexpected structure.');
  }

  return new Response(
    xml
      .replace(
        '<rss version="2.0">',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
      )
      .replace(
        '<channel>',
        `<channel><atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
      ),
    { status: response.status, headers: response.headers },
  );
}
