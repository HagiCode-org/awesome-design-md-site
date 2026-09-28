import type { SiteLinksOptions } from '@hagicode/hagilight/site-links';
import { defaultLocale, type SupportedLocale } from '@/i18n';

const HAGILIGHT_SITE_URL = 'https://hagilight.hagicode.com';

export function getHagilightFooterLinks(locale: SupportedLocale): SiteLinksOptions {
  if (locale === defaultLocale) {
    return { rssFeedUrl: `${HAGILIGHT_SITE_URL}/rss.xml` };
  }

  return { rssLocaleFeedUrl: `${HAGILIGHT_SITE_URL}/rss.${locale}.xml` };
}
