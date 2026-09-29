import type { APIRoute } from 'astro';
import { isSupportedLocale, supportedLocales } from '@/i18n';
import { generateGalleryRss } from '@/lib/gallery-rss';

export function getStaticPaths() {
  return supportedLocales.map((locale) => ({ params: { locale } }));
}

export const GET: APIRoute = ({ params, site }) => {
  const { locale } = params;
  if (typeof locale !== 'string' || !isSupportedLocale(locale)) {
    throw new Error(`Unsupported RSS locale: ${locale ?? '(missing)'}`);
  }

  return generateGalleryRss(locale, site, `/rss.${locale}.xml`);
};
