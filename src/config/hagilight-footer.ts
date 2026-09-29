import type { SiteLinksOptions } from '@hagicode/hagilight/site-links';
import { defaultLocale, type SupportedLocale } from '@/i18n';

export function getHagilightFooterLinks(locale: SupportedLocale): SiteLinksOptions {
  if (locale === defaultLocale) {
    return { rssFeedUrl: '/rss.xml' };
  }

  return { rssLocaleFeedUrl: `/rss.${locale}.xml` };
}
